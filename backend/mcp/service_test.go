package mcp

import (
	"context"
	"encoding/json"
	"io"
	"strings"
	"sync"
	"testing"

	"vitaena/backend"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

var tools = []ToolSpec{
	{Name: "list_documents", Title: "List documents", Description: "Lists them.", InputSchema: json.RawMessage(`{"type":"object","properties":{"kind":{"type":"string"}}}`), ReadOnly: true},
	{Name: "edit_document", Title: "Edit a document", Description: "Changes one.", InputSchema: json.RawMessage(`{"type":"object"}`)},
}

// page stands in for the interface: it answers every call by echoing it.
type page struct {
	mu    sync.Mutex
	calls []string
	svc   *Service
}

func (p *page) emit(name string, data ...any) {
	if name != CallEvent {
		return
	}

	id, tool, arguments := data[0].(string), data[1].(string), data[2].(string)

	p.mu.Lock()
	p.calls = append(p.calls, tool+" "+arguments)
	p.mu.Unlock()

	reply := Reply{Text: "ran " + tool, Structured: json.RawMessage(`{"documents":[]}`)}
	if tool == "edit_document" {
		reply.Images = []Image{{Data: "AQID", MIMEType: "image/jpeg"}}
	}

	go p.svc.Reply(id, reply)
}

func newService(t *testing.T) (*Service, *page) {
	t.Helper()

	folder := t.TempDir()
	p := &page{}
	svc := New(backend.Shell{DataFolder: func() (string, error) { return folder, nil }, Emit: p.emit})
	p.svc = svc

	t.Cleanup(func() { _ = svc.ServiceShutdown() })

	return svc, p
}

// connect is an assistant talking to the service directly.
func connect(t *testing.T, svc *Service) *mcp.ClientSession {
	t.Helper()

	serverEnd, clientEnd := mcp.NewInMemoryTransports()

	if _, err := svc.server.Connect(context.Background(), serverEnd, nil); err != nil {
		t.Fatal(err)
	}

	session, err := mcp.NewClient(&mcp.Implementation{Name: "test"}, nil).Connect(context.Background(), clientEnd, nil)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { _ = session.Close() })

	return session
}

func call(t *testing.T, session *mcp.ClientSession, name string, arguments map[string]any) *mcp.CallToolResult {
	t.Helper()

	result, err := session.CallTool(context.Background(), &mcp.CallToolParams{Name: name, Arguments: arguments})
	if err != nil {
		t.Fatal(err)
	}

	return result
}

func textOf(result *mcp.CallToolResult) string {
	var parts []string

	for _, content := range result.Content {
		if text, ok := content.(*mcp.TextContent); ok {
			parts = append(parts, text.Text)
		}
	}

	return strings.Join(parts, "\n")
}

func TestOffersThePagesToolsWithTheirAnnotations(t *testing.T) {
	svc, _ := newService(t)

	if err := svc.Ready(tools, AccessRead); err != nil {
		t.Fatal(err)
	}

	listed, err := connect(t, svc).ListTools(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}

	if len(listed.Tools) != 2 {
		t.Fatalf("got %d tools", len(listed.Tools))
	}

	byName := map[string]*mcp.Tool{}
	for _, tool := range listed.Tools {
		byName[tool.Name] = tool
	}

	if !byName["list_documents"].Annotations.ReadOnlyHint || byName["edit_document"].Annotations.ReadOnlyHint {
		t.Error("only list_documents should say it only reads")
	}

	if open := byName["list_documents"].Annotations.OpenWorldHint; open == nil || *open {
		t.Error("tools should say they stay on this computer")
	}
}

func TestSendsACallToThePageAndAnswersWithItsReply(t *testing.T) {
	svc, p := newService(t)
	_ = svc.Ready(tools, AccessRead)

	result := call(t, connect(t, svc), "list_documents", map[string]any{"kind": "cv"})

	if result.IsError || textOf(result) != "ran list_documents" {
		t.Fatalf("got %+v: %s", result, textOf(result))
	}

	if got, _ := json.Marshal(result.StructuredContent); string(got) != `{"documents":[]}` {
		t.Errorf("structured content is %s", got)
	}

	if len(p.calls) != 1 || p.calls[0] != `list_documents {"kind":"cv"}` {
		t.Errorf("the page got %v", p.calls)
	}

	call(t, connect(t, svc), "list_documents", nil)

	if len(p.calls) != 2 || p.calls[1] != `list_documents {}` {
		t.Errorf("a call with no arguments should reach the page as {}, got %v", p.calls)
	}
}

func TestAnswersWithWhereToTurnItOnWhileTheSettingIsOff(t *testing.T) {
	svc, p := newService(t)
	_ = svc.Ready(tools, AccessOff)

	result := call(t, connect(t, svc), "list_documents", nil)

	if !result.IsError || !strings.Contains(textOf(result), "Settings, General, AI assistants") {
		t.Fatalf("got %s", textOf(result))
	}

	if len(p.calls) != 0 {
		t.Error("the page shouldn't be asked")
	}
}

func TestKeepsChangesBackWithReadOnlyAccess(t *testing.T) {
	svc, p := newService(t)
	_ = svc.Ready(tools, AccessRead)
	session := connect(t, svc)

	if result := call(t, session, "edit_document", nil); !result.IsError || !strings.Contains(textOf(result), "Read and edit") {
		t.Fatalf("got %s", textOf(result))
	}

	_ = svc.Ready(tools, AccessEdit)

	result := call(t, session, "edit_document", nil)
	if result.IsError {
		t.Fatalf("got %s", textOf(result))
	}

	// A picture in the page's answer reaches the assistant as an image.
	if image, ok := result.Content[1].(*mcp.ImageContent); !ok || string(image.Data) != "\x01\x02\x03" || image.MIMEType != "image/jpeg" {
		t.Errorf("got %+v", result.Content)
	}

	if len(p.calls) != 1 {
		t.Errorf("the page got %v", p.calls)
	}
}

func TestRefusesAToolWhoseSchemaIsntAnObject(t *testing.T) {
	svc, _ := newService(t)

	if err := svc.Ready([]ToolSpec{{Name: "bad", InputSchema: json.RawMessage(`{"type":"string"}`)}}, AccessRead); err == nil {
		t.Fatal("expected an error")
	}
}

func TestRelaysAnAssistantToTheAppOverTheSocket(t *testing.T) {
	svc, _ := newService(t)
	folder, _ := svc.shell.DataFolder()
	_ = svc.Ready(tools, AccessRead)

	session := relayed(t, folder, func() (func(), error) {
		t.Error("the app is running, so the relay shouldn't start it")
		return func() {}, nil
	})

	if result := call(t, session, "list_documents", nil); textOf(result) != "ran list_documents" {
		t.Fatalf("got %s", textOf(result))
	}
}

func TestStartsTheAppWhenNothingIsListening(t *testing.T) {
	svc, _ := newService(t)
	folder, _ := svc.shell.DataFolder()
	started, reached := 0, 0

	session := relayed(t, folder, func() (func(), error) {
		started++
		// The app starts, and its page says it's ready a moment later.
		go func() { _ = svc.Ready(tools, AccessRead) }()
		return func() { reached++ }, nil
	})

	if result := call(t, session, "list_documents", nil); textOf(result) != "ran list_documents" {
		t.Fatalf("got %s", textOf(result))
	}

	if started != 1 || reached != 1 {
		t.Errorf("started %d times, reached %d times", started, reached)
	}
}

func TestLeavesTheSocketToACopyAlreadyListening(t *testing.T) {
	first, _ := newService(t)
	folder, _ := first.shell.DataFolder()
	_ = first.Ready(tools, AccessRead)

	second := New(backend.Shell{DataFolder: func() (string, error) { return folder, nil }, Emit: func(string, ...any) {}})

	if err := second.Ready(tools, AccessRead); err == nil {
		t.Fatal("expected the second copy to leave the socket")
	}
}

// relayed is an assistant talking through Relay, as `vitaena mcp` does.
func relayed(t *testing.T, folder string, start func() (func(), error)) *mcp.ClientSession {
	t.Helper()

	toRelay, fromAssistant := io.Pipe()
	toAssistant, fromRelay := io.Pipe()
	done := make(chan error, 1)

	go func() { done <- Relay(folder, toRelay, fromRelay, start) }()

	session, err := mcp.NewClient(&mcp.Implementation{Name: "test"}, nil).Connect(context.Background(), &mcp.IOTransport{Reader: toAssistant, Writer: fromAssistant}, nil)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		_ = session.Close()

		if err := <-done; err != nil {
			t.Errorf("relay: %v", err)
		}
	})

	return session
}
