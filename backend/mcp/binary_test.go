package mcp

import (
	"context"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// TestABuiltAppAnswersAnAssistant starts a built app's `mcp` the way an assistant
// does, over stdin and stdout, and lists its documents. It runs only when
// VITAENA_MCP_BINARY names the program, since it starts the real app, with the
// real data folder, in the background.
func TestABuiltAppAnswersAnAssistant(t *testing.T) {
	program := os.Getenv("VITAENA_MCP_BINARY")
	if program == "" {
		t.Skip("set VITAENA_MCP_BINARY to a built app to run this")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
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

	result, err := session.CallTool(ctx, &mcp.CallToolParams{Name: "list_documents"})
	if err != nil {
		t.Fatal(err)
	}

	text := textOf(result)
	if first, _, _ := strings.Cut(text, "\n"); result.IsError {
		t.Logf("answered with an error, as the setting may be off: %s", first)
	} else {
		t.Logf("answered: %s", first)
	}
}
