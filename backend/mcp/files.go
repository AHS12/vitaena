package mcp

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"vitaena/backend/fsutil"
)

// An assistant names files by their path. The app reads only the kinds it imports, and
// writes exports beside what's there without replacing anything.

// mostImported is the largest file import_file reads.
const mostImported = 25 << 20

var importable = []string{".pdf", ".docx", ".doc"}

// File is one file an export made.
type File struct {
	Name string `json:"name"`
	Data []byte `json:"data"`
}

// ReadImportFile reads a PDF or Word file an assistant asked to import.
func (s *Service) ReadImportFile(path string) ([]byte, error) {
	if !filepath.IsAbs(path) {
		return nil, fmt.Errorf("give the file's full path, not %q", path)
	}

	extension := strings.ToLower(filepath.Ext(path))
	known := false

	for _, wanted := range importable {
		known = known || extension == wanted
	}

	if !known {
		return nil, errors.New("only a PDF or a Word file (.docx) can be imported")
	}

	info, err := os.Stat(path)

	switch {
	case errors.Is(err, os.ErrNotExist):
		return nil, fmt.Errorf("there's no file at %s", path)
	case err != nil:
		return nil, err
	case info.IsDir():
		return nil, fmt.Errorf("%s is a folder", path)
	case info.Size() > mostImported:
		return nil, errors.New("the file is over 25 MB, which is more than a CV ever needs")
	}

	return os.ReadFile(path)
}

// SaveFiles writes an export's files into folder, or Downloads when it's "", and
// returns where each went. A name already taken gets a number, so nothing is replaced.
func (s *Service) SaveFiles(folder string, files []File) ([]string, error) {
	if folder == "" {
		found, err := downloadsFolder()
		if err != nil {
			return nil, err
		}

		folder = found
	}

	if !filepath.IsAbs(folder) {
		return nil, fmt.Errorf("give the folder's full path, not %q", folder)
	}

	for _, file := range files {
		if err := fsutil.CheckFileName(file.Name); err != nil {
			return nil, err
		}
	}

	if err := os.MkdirAll(folder, 0o755); err != nil {
		return nil, fmt.Errorf("cannot make the folder: %w", err)
	}

	written := make([]string, 0, len(files))

	for _, file := range files {
		path := freePath(folder, file.Name)

		if err := fsutil.WriteAtomic(path, file.Data); err != nil {
			return written, err
		}

		written = append(written, path)
	}

	return written, nil
}

// freePath is folder/name, or "name 2.ext" and so on when that's taken.
func freePath(folder, name string) string {
	extension := filepath.Ext(name)
	stem := strings.TrimSuffix(name, extension)
	path := filepath.Join(folder, name)

	for count := 2; ; count++ {
		if _, err := os.Lstat(path); errors.Is(err, os.ErrNotExist) {
			return path
		}

		path = filepath.Join(folder, fmt.Sprintf("%s %d%s", stem, count, extension))
	}
}
