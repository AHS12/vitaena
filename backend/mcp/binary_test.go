package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// TestABuiltAppAnswersAnAssistant starts a built app's `mcp` the way an assistant
// does, over stdin and stdout, and uses the reading tools on every document. It runs
// only when VITAENA_MCP_BINARY names the program, since it starts the real app in
// the background with whatever data folder APPDATA (or the system's) points to.
// VITAENA_MCP_PICTURES names a folder to keep the page pictures in, to look at.
func TestABuiltAppAnswersAnAssistant(t *testing.T) {
	program := os.Getenv("VITAENA_MCP_BINARY")
	if program == "" {
		t.Skip("set VITAENA_MCP_BINARY to a built app to run this")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	session, err := mcp.NewClient(&mcp.Implementation{Name: "binary-test"}, nil).Connect(ctx, &mcp.CommandTransport{Command: exec.Command(program, Arg)}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()

	listed, err := session.ListTools(ctx, nil)
	if err != nil {
		t.Fatal(err)
	}

	names := []string{}
	for _, tool := range listed.Tools {
		names = append(names, tool.Name)
	}

	t.Logf("server %s %s, tools %v", session.InitializeResult().ServerInfo.Name, session.InitializeResult().ServerInfo.Version, names)

	result := mustCall(ctx, t, session, "list_documents", nil, true)
	if result.IsError {
		t.Logf("answered with an error, as the setting may be off: %s", firstLine(textOf(result)))
		return
	}

	var found struct {
		Documents []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"documents"`
	}

	remarshal(t, result.StructuredContent, &found)
	t.Logf("%d documents", len(found.Documents))

	for _, document := range found.Documents {
		arguments := map[string]any{"id": document.ID}

		read := mustCall(ctx, t, session, "read_document", arguments, false)
		t.Logf("read %s: %s", document.Name, firstLine(textOf(read)))

		started := time.Now()
		checked := mustCall(ctx, t, session, "check_document", arguments, false)
		t.Logf("checked in %v: %s", time.Since(started).Round(time.Millisecond), firstLine(textOf(checked)))

		started = time.Now()
		preview := mustCall(ctx, t, session, "preview_pages", arguments, false)
		pictures := 0

		for index, content := range preview.Content {
			image, ok := content.(*mcp.ImageContent)
			if !ok {
				continue
			}

			pictures++

			if folder := os.Getenv("VITAENA_MCP_PICTURES"); folder != "" {
				name := filepath.Join(folder, fmt.Sprintf("%s-%d.jpg", document.ID, index))
				if err := os.WriteFile(name, image.Data, 0o600); err != nil {
					t.Error(err)
				}
			}
		}

		if pictures == 0 {
			t.Errorf("preview_pages drew no pages for %s", document.Name)
		}

		t.Logf("previewed in %v: %d pictures", time.Since(started).Round(time.Millisecond), pictures)
	}
}

// TestABuiltAppWritesForAnAssistant makes, edits, restyles and copies a document
// through a built app. It runs only when VITAENA_MCP_WRITE is also set, since it
// writes documents into the data folder: point APPDATA at a throwaway one, with the
// AI assistants setting on Read and edit.
func TestABuiltAppWritesForAnAssistant(t *testing.T) {
	program := os.Getenv("VITAENA_MCP_BINARY")
	if program == "" || os.Getenv("VITAENA_MCP_WRITE") == "" {
		t.Skip("set VITAENA_MCP_BINARY and VITAENA_MCP_WRITE to run this")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	session, err := mcp.NewClient(&mcp.Implementation{Name: "binary-test", Title: "Test Assistant"}, nil).Connect(ctx, &mcp.CommandTransport{Command: exec.Command(program, Arg)}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer session.Close()

	made := mustCall(ctx, t, session, "create_document", map[string]any{
		"kind":     "cv",
		"name":     "Made by a test",
		"template": "modern",
		"operations": []map[string]any{
			{"op": "set_field", "field": "name", "value": "Jane Doe"},
			{"op": "set_field", "field": "headline", "value": "Product designer"},
			{"op": "set_text", "section": "Summary", "text": "Designer of calm, useful software."},
			{"op": "add_entry", "section": "Experience", "title": "Product designer", "org": "Northwind", "start": "2022-03", "current": true, "bullets": []string{"Redesigned checkout, raising completion by **12%**."}},
			{"op": "set_tags", "section": "Skills", "label": "Tools", "items": []string{"Figma", "Prototyping"}},
		},
	}, false)
	t.Log(firstLine(textOf(made)))

	var created struct {
		ID string `json:"id"`
	}
	remarshal(t, made.StructuredContent, &created)

	edited := mustCall(ctx, t, session, "edit_document", map[string]any{"id": created.ID, "operations": []map[string]any{{"op": "add_section", "kind": "tags", "title": "Languages"}, {"op": "set_tags", "section": "Languages", "items": []string{"English (Fluent)"}}}}, false)
	t.Log(firstLine(textOf(edited)))

	styled := mustCall(ctx, t, session, "set_design", map[string]any{"id": created.ID, "accent": "#7a1f4b", "font": "lato"}, false)
	t.Log(firstLine(textOf(styled)))

	copied := mustCall(ctx, t, session, "duplicate_document", map[string]any{"id": created.ID}, false)
	t.Log(firstLine(textOf(copied)))

	read := mustCall(ctx, t, session, "read_document", map[string]any{"id": created.ID}, false)
	if text := textOf(read); !strings.Contains(text, "Redesigned checkout") || !strings.Contains(text, "LANGUAGES") {
		t.Errorf("the edits didn't arrive: %s", text)
	}

	out := t.TempDir()

	for _, format := range []string{"pdf", "docx", "text"} {
		exported := mustCall(ctx, t, session, "export_document", map[string]any{"id": created.ID, "format": format, "folder": out}, false)
		t.Log(strings.ReplaceAll(textOf(exported), "\n", " "))

		var saved struct {
			Files []string `json:"files"`
		}
		remarshal(t, exported.StructuredContent, &saved)

		if data, err := os.ReadFile(saved.Files[0]); err != nil || len(data) == 0 || (format == "pdf" && !strings.HasPrefix(string(data), "%PDF")) {
			t.Errorf("the %s wasn't written: %v", format, err)
		}
	}

	for _, fixture := range []string{"online-sidebar.pdf", "office-word.docx"} {
		path, _ := filepath.Abs(filepath.Join("..", "..", "frontend", "src", "cv", "import", "fixtures", fixture))
		imported := mustCall(ctx, t, session, "import_file", map[string]any{"path": path}, false)
		t.Log(textOf(imported))
	}

	preview := mustCall(ctx, t, session, "preview_pages", map[string]any{"id": created.ID}, false)

	if folder := os.Getenv("VITAENA_MCP_PICTURES"); folder != "" {
		for index, content := range preview.Content {
			if image, ok := content.(*mcp.ImageContent); ok {
				_ = os.WriteFile(filepath.Join(folder, fmt.Sprintf("made-%d.jpg", index)), image.Data, 0o600)
			}
		}
	}
}

func mustCall(ctx context.Context, t *testing.T, session *mcp.ClientSession, name string, arguments map[string]any, mayRefuse bool) *mcp.CallToolResult {
	t.Helper()

	result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: name, Arguments: arguments})
	if err != nil {
		t.Fatal(err)
	}

	if result.IsError && !mayRefuse {
		t.Fatalf("%s failed: %s", name, textOf(result))
	}

	return result
}

func remarshal(t *testing.T, from any, to any) {
	t.Helper()

	data, err := json.Marshal(from)
	if err == nil {
		err = json.Unmarshal(data, to)
	}

	if err != nil {
		t.Fatal(err)
	}
}

func firstLine(text string) string {
	line, _, _ := strings.Cut(text, "\n")
	return line
}
