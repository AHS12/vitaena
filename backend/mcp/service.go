// Package mcp lets an AI assistant the person already uses read and change their
// documents, over the Model Context Protocol.
//
// Go only carries the calls. The tools themselves run in the interface, with the
// same code the editor uses, so an assistant can do only what the app can. The page
// sends its list of tools with Ready, Go offers them to assistants, and each call
// goes to the page as an event and comes back with Reply.
//
// An assistant starts `vitaena mcp`, which relays its stdin and stdout to the
// running app over a local socket: see relay.go. The app listens once the page is
// ready: see socket.go.
package mcp

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"vitaena/appconfig"
	"vitaena/backend"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// CallEvent is the event a tool call reaches the page by. Its data is the call's
// id, the tool's name and its arguments as JSON text.
const CallEvent = "mcp:call"

// callTimeout is how long a tool call waits for the page before answering with an
// error, so an assistant is never left hanging.
const callTimeout = 60 * time.Second

// The three answers to "may assistants use the documents", from the setting.
const (
	AccessOff  = "off"
	AccessRead = "read"
	AccessEdit = "edit"
)

// ToolSpec is one tool as the page describes it.
type ToolSpec struct {
	Name        string          `json:"name"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	InputSchema json.RawMessage `json:"inputSchema"`
	// ReadOnly tools are allowed with read-only access; the rest need edit access.
	ReadOnly bool `json:"readOnly"`
	// Destructive tools change what is already there, rather than only adding.
	Destructive bool `json:"destructive"`
	Idempotent  bool `json:"idempotent"`
}

// Reply is what the page answers a call with.
type Reply struct {
	// Text is the answer in words, which every client shows.
	Text string `json:"text"`
	// Structured is the same answer as data, for clients that read it.
	Structured json.RawMessage `json:"structured,omitempty"`
	// Images go after the text, such as pictures of the pages.
	Images []Image `json:"images,omitempty"`
	// IsError says the call failed. Text then says why, so the model can fix it.
	IsError bool `json:"isError"`
}

// Image is a picture in a reply, as base64.
type Image struct {
	Data     string `json:"data"`
	MIMEType string `json:"mimeType"`
}

// Service is the Wails service the page calls.
type Service struct {
	shell  backend.Shell
	server *mcp.Server

	mu      sync.Mutex
	access  string
	tools   []string
	pending map[string]chan Reply
	nextID  int
	// listening is set once the socket is open; see socket.go.
	listening bool
	closeSock func()
	// connections counts assistants connected now, for an idle quit.
	connections int
	idle        func(connections int)

	// copiesMu keeps two copies of one document from taking the same name.
	copiesMu sync.Mutex
}

// New makes the service. It does nothing until the page calls Ready.
func New(shell backend.Shell) *Service {
	server := mcp.NewServer(&mcp.Implementation{
		Name:    appconfig.Current().ID,
		Title:   appconfig.Current().Name,
		Version: appconfig.Current().Version,
	}, &mcp.ServerOptions{
		Instructions: instructions(),
	})

	s := &Service{shell: shell, server: server, access: AccessOff, pending: map[string]chan Reply{}}
	s.addPrompts()

	return s
}

func instructions() string {
	name := appconfig.Current().Name

	return name + " is a desktop app for CVs, resumes and marriage biodata. These tools " +
		"read and change the documents saved in it, on this computer. Find a document's id " +
		"with list_documents first."
}

// Ready gives the service the page's tools and the setting's access, and opens the
// socket the first time. The page calls it at start and whenever the setting
// changes.
func (s *Service) Ready(tools []ToolSpec, access string) error {
	if access != AccessRead && access != AccessEdit {
		access = AccessOff
	}

	added := make([]*mcp.Tool, 0, len(tools))

	for _, spec := range tools {
		tool, err := toolOf(spec)
		if err != nil {
			return err
		}

		added = append(added, tool)
	}

	s.mu.Lock()
	old := s.tools
	s.access = access
	s.tools = make([]string, 0, len(tools))

	for _, spec := range tools {
		s.tools = append(s.tools, spec.Name)
	}

	s.mu.Unlock()

	s.server.RemoveTools(old...)

	for i, tool := range added {
		s.server.AddTool(tool, s.handler(tools[i]))
	}

	return s.listen()
}

// Reply answers the call with this id. A late answer, after the call timed out, is
// dropped.
func (s *Service) Reply(id string, reply Reply) {
	s.mu.Lock()
	answer, ok := s.pending[id]
	delete(s.pending, id)
	s.mu.Unlock()

	if ok {
		answer <- reply
	}
}

// ServiceShutdown closes the socket when the app quits.
func (s *Service) ServiceShutdown() error {
	s.mu.Lock()
	closeSock := s.closeSock
	s.closeSock = nil
	s.mu.Unlock()

	if closeSock != nil {
		closeSock()
	}

	return nil
}

func toolOf(spec ToolSpec) (*mcp.Tool, error) {
	var schema map[string]any

	if err := json.Unmarshal(spec.InputSchema, &schema); err != nil || schema["type"] != "object" {
		return nil, fmt.Errorf("the tool %q needs an input schema of type object", spec.Name)
	}

	destructive := spec.Destructive
	openWorld := false

	return &mcp.Tool{
		Name:        spec.Name,
		Title:       spec.Title,
		Description: spec.Description,
		InputSchema: schema,
		Annotations: &mcp.ToolAnnotations{
			Title:           spec.Title,
			ReadOnlyHint:    spec.ReadOnly,
			DestructiveHint: &destructive,
			IdempotentHint:  spec.Idempotent,
			OpenWorldHint:   &openWorld,
		},
	}, nil
}

func (s *Service) handler(spec ToolSpec) mcp.ToolHandler {
	return func(ctx context.Context, request *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if refusal := s.refusal(spec); refusal != "" {
			return failure(refusal), nil
		}

		// A call with no arguments may send none, or null.
		arguments := request.Params.Arguments
		if len(arguments) == 0 || string(arguments) == "null" {
			arguments = json.RawMessage("{}")
		}

		reply, err := s.call(ctx, spec.Name, arguments, clientName(request))
		if err != nil {
			return failure(err.Error()), nil
		}

		result := &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: reply.Text}}, IsError: reply.IsError}

		for _, image := range reply.Images {
			data, err := base64.StdEncoding.DecodeString(image.Data)
			if err != nil {
				return failure("A picture in the answer couldn't be read."), nil
			}

			result.Content = append(result.Content, &mcp.ImageContent{Data: data, MIMEType: image.MIMEType})
		}

		if len(reply.Structured) > 0 && !reply.IsError {
			result.StructuredContent = reply.Structured
		}

		return result, nil
	}
}

// refusal is why the setting doesn't allow this tool now, or "".
func (s *Service) refusal(spec ToolSpec) string {
	s.mu.Lock()
	access := s.access
	s.mu.Unlock()

	name := appconfig.Current().Name

	switch {
	case access == AccessOff:
		return name + " isn't letting AI assistants use your documents. To allow it, open " + name +
			", then Settings, General, AI assistants."
	case access == AccessRead && !spec.ReadOnly:
		return name + " lets AI assistants read your documents but not change them or save files. To allow it, open " +
			name + ", then Settings, General, AI assistants, and choose Read and edit."
	}

	return ""
}

// clientName is what the assistant calls itself, such as "Claude", for messages
// like "Claude changed Experience".
func clientName(request *mcp.CallToolRequest) string {
	var info *mcp.Implementation

	if request.Session != nil {
		if params := request.Session.InitializeParams(); params != nil {
			info = params.ClientInfo
		}
	}

	// From 2026-07-28 there's no handshake, and each request says who it's from.
	if info == nil && request.Params != nil {
		if raw, ok := request.Params.GetMeta()[mcp.MetaKeyClientInfo]; ok {
			var fromMeta mcp.Implementation
			if data, err := json.Marshal(raw); err == nil && json.Unmarshal(data, &fromMeta) == nil {
				info = &fromMeta
			}
		}
	}

	switch {
	case info == nil:
		return "An assistant"
	case strings.TrimSpace(info.Title) != "":
		return strings.TrimSpace(info.Title)
	case strings.TrimSpace(info.Name) != "":
		return strings.TrimSpace(info.Name)
	}

	return "An assistant"
}

// call sends a call to the page and waits for its answer.
func (s *Service) call(ctx context.Context, tool string, arguments json.RawMessage, client string) (Reply, error) {
	answer := make(chan Reply, 1)

	s.mu.Lock()
	s.nextID++
	id := strconv.Itoa(s.nextID)
	s.pending[id] = answer
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.pending, id)
		s.mu.Unlock()
	}()

	s.shell.Emit(CallEvent, id, tool, string(arguments), client)

	timer := time.NewTimer(callTimeout)
	defer timer.Stop()

	select {
	case reply := <-answer:
		return reply, nil
	case <-timer.C:
		return Reply{}, errors.New(appconfig.Current().Name + " didn't answer in time. Try again in a moment.")
	case <-ctx.Done():
		return Reply{}, ctx.Err()
	}
}

func failure(text string) *mcp.CallToolResult {
	return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: text}}, IsError: true}
}
