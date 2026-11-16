package mcp

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestReadsOnlyPdfAndWordFilesByTheirFullPath(t *testing.T) {
	svc, _ := newService(t)
	dir := t.TempDir()
	pdf := filepath.Join(dir, "cv.PDF")
	_ = os.WriteFile(pdf, []byte("%PDF"), 0o600)
	_ = os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("x"), 0o600)

	if got, err := svc.ReadImportFile(pdf); err != nil || string(got) != "%PDF" {
		t.Fatalf("got %q, %v", got, err)
	}

	for path, want := range map[string]string{
		"cv.pdf":                         "full path",
		filepath.Join(dir, "notes.txt"):  "only a PDF or a Word file",
		filepath.Join(dir, "gone.docx"):  "there's no file",
		filepath.Join(dir, "folder.pdf"): "is a folder",
	} {
		if strings.HasSuffix(path, "folder.pdf") {
			_ = os.Mkdir(path, 0o700)
		}

		if _, err := svc.ReadImportFile(path); err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("%s: got %v, want %q", path, err, want)
		}
	}
}

func TestSavesFilesWithoutReplacingAny(t *testing.T) {
	svc, _ := newService(t)
	dir := filepath.Join(t.TempDir(), "Jobs")

	first, err := svc.SaveFiles(dir, []File{{Name: "Jane Doe.pdf", Data: []byte("one")}})
	if err != nil {
		t.Fatal(err)
	}

	second, err := svc.SaveFiles(dir, []File{{Name: "Jane Doe.pdf", Data: []byte("two")}, {Name: "Jane Doe.txt", Data: []byte("text")}})
	if err != nil {
		t.Fatal(err)
	}

	if filepath.Base(first[0]) != "Jane Doe.pdf" || filepath.Base(second[0]) != "Jane Doe 2.pdf" || filepath.Base(second[1]) != "Jane Doe.txt" {
		t.Fatalf("got %v then %v", first, second)
	}

	if kept, _ := os.ReadFile(first[0]); string(kept) != "one" {
		t.Errorf("the first file became %q", kept)
	}
}

func TestRefusesRelativeFoldersAndNamesWithPaths(t *testing.T) {
	svc, _ := newService(t)

	if _, err := svc.SaveFiles("Downloads", []File{{Name: "a.pdf"}}); err == nil {
		t.Error("a relative folder should be refused")
	}

	if _, err := svc.SaveFiles(t.TempDir(), []File{{Name: "../a.pdf"}}); err == nil {
		t.Error("a name with a path should be refused")
	}
}
