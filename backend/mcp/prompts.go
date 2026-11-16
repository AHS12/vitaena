package mcp

import (
	"context"
	"os"
	"strings"

	"vitaena/appconfig"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// Prompts are ready-made requests a person can pick in their assistant, such as a
// command in Claude Desktop, Claude Code or VS Code. They only say what to do with
// the tools; an assistant that doesn't show prompts loses nothing.

func (s *Service) addPrompts() {
	s.server.AddPrompt(&mcp.Prompt{
		Name:        "tailor_to_job",
		Title:       "Fit a CV to a job",
		Description: "Copies a CV and fits the copy to a job ad, leaving the original as it is.",
		Arguments: []*mcp.PromptArgument{
			{Name: "job_ad", Title: "Job ad", Description: "The job ad, pasted in.", Required: true},
			{Name: "cv", Title: "CV", Description: "Which CV to start from, by name. Default: the one open, or the newest."},
		},
	}, func(_ context.Context, request *mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
		cv := strings.TrimSpace(request.Params.Arguments["cv"])
		if cv == "" {
			cv = "the CV open in " + appconfig.Current().Name + ", or else the newest one"
		}

		return userPrompt("Fit a CV to this job",
			"Fit my CV to the job ad below, using the "+appconfig.Current().Name+" tools.\n\n"+
				"1. Find "+cv+" with list_documents, and read it with read_document.\n"+
				"2. Make a copy with duplicate_document, named after the role and the company, and change only the copy.\n"+
				"3. Rewrite the headline and summary for this role, reorder and reword bullets so the most relevant come first, and bring forward the skills the ad asks for, using its words where they're true of me. Never invent experience, numbers or skills I don't have; ask me if something is missing.\n"+
				"4. Run check_document on the copy and fix what it warns about, then show me the result with preview_pages and tell me what you changed.\n\n"+
				"The job ad:\n"+request.Params.Arguments["job_ad"]), nil
	})

	s.server.AddPrompt(&mcp.Prompt{
		Name:        "review_document",
		Title:       "Review a CV or biodata",
		Description: "Reads a document, runs Check, looks at the pages and suggests changes before making any.",
		Arguments: []*mcp.PromptArgument{
			{Name: "document", Title: "Document", Description: "Which one, by name. Default: the one open, or the newest."},
		},
	}, func(_ context.Context, request *mcp.GetPromptRequest) (*mcp.GetPromptResult, error) {
		document := strings.TrimSpace(request.Params.Arguments["document"])
		if document == "" {
			document = "the document open in " + appconfig.Current().Name + ", or else the newest one"
		}

		return userPrompt("Review a document",
			"Review "+document+" using the "+appconfig.Current().Name+" tools: read it with read_document, run check_document, and look at the pages with preview_pages.\n\n"+
				"Then tell me what reads well, and suggest the changes that would help most, each with the words you'd use. Don't change anything until I say which to make; then make them with edit_document."), nil
	})
}

func userPrompt(description, text string) *mcp.GetPromptResult {
	return &mcp.GetPromptResult{
		Description: description,
		Messages:    []*mcp.PromptMessage{{Role: "user", Content: &mcp.TextContent{Text: text}}},
	}
}

// ProgramPath is the program an assistant starts, for the lines to paste. An
// AppImage runs from a mount that changes each time, so it names the AppImage itself.
func (s *Service) ProgramPath() (string, error) {
	if image := os.Getenv("APPIMAGE"); image != "" {
		return image, nil
	}

	return os.Executable()
}
