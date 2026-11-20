// Package fonts keeps the fonts a person adds, so any document can use them.
//
// Each font file is copied into a fonts folder beside the saved documents, named by a
// hash of its contents: the same file added twice is one file, and a name from outside
// never becomes a path. Beside each file is a small JSON file with what the interface
// read from the font (its family, style, weight and scripts), so the list can be shown
// without reading every font. Being beside the documents, fonts go into backups with
// them and come back with a restore.
package fonts

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"

	"vitaena/backend/fsutil"
)

// FolderName is the fonts folder, inside the documents folder.
const FolderName = "fonts"

// MaxBytes is the largest font file kept. Fonts for Chinese or Japanese can be large,
// but few are larger than this.
const MaxBytes = 30 << 20

// InfoSuffix ends the file beside each font that says what it is.
const InfoSuffix = ".font.json"

// Extensions are the font files Typst reads.
var Extensions = []string{".ttf", ".otf", ".ttc"}

// Info is what the interface read from a font file.
type Info struct {
	Family  string   `json:"family"`
	Style   string   `json:"style"`
	Weight  int      `json:"weight"`
	Scripts []string `json:"scripts"`
}

// FontFile is one font file kept, with what it is.
type FontFile struct {
	ID string `json:"id"`
	// Name is the file's name when it was added, for the person to recognise.
	Name string `json:"name"`
	Size int64  `json:"size"`
	Info
	// Known is false when the file's info is missing, so the interface reads it again.
	Known bool `json:"known"`
}

type stored struct {
	Name string `json:"name"`
	Info
}

// Service is the fonts folder. Folder gives the documents folder, which may change.
type Service struct {
	folder func() (string, error)
	mu     sync.Mutex
}

// New keeps fonts in a folder inside the one folder gives.
func New(folder func() (string, error)) *Service {
	return &Service{folder: folder}
}

func (s *Service) dir() (string, error) {
	root, err := s.folder()
	if err != nil {
		return "", err
	}

	dir := filepath.Join(root, FolderName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("cannot create the fonts folder %q: %w", dir, err)
	}

	return dir, nil
}

func extensionOf(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	if slices.Contains(Extensions, ext) {
		return ext
	}

	return ""
}

// checkID refuses an id that isn't one this service made: a hash and a font extension.
func checkID(id string) error {
	ext := extensionOf(id)
	hash := strings.TrimSuffix(id, ext)

	if ext == "" || len(hash) != 32 || strings.Trim(hash, "0123456789abcdef") != "" {
		return fmt.Errorf("%q isn't a font kept here", id)
	}

	return nil
}

// IsKeptFile says whether a file name in the fonts folder is one this service writes:
// a font or the info beside it. Backups carry these, and only these.
func IsKeptFile(name string) bool {
	return checkID(strings.TrimSuffix(name, InfoSuffix)) == nil
}

// fileName is the last part of a path, split at either slash: the interface may send a
// Windows path, and filepath.Base splits only at the running system's own.
func fileName(path string) string {
	return path[strings.LastIndexAny(path, `/\`)+1:]
}

// AddFont keeps a font file and what the interface read from it, and returns it.
func (s *Service) AddFont(name string, data []byte, info Info) (FontFile, error) {
	ext := extensionOf(name)
	if ext == "" {
		return FontFile{}, fmt.Errorf("%s isn't a font file Vitaena reads. Add the .ttf or .otf file", fileName(name))
	}

	if len(data) == 0 {
		return FontFile{}, fmt.Errorf("%s is empty", fileName(name))
	}

	if len(data) > MaxBytes {
		return FontFile{}, fmt.Errorf("%s is larger than %d MB", fileName(name), MaxBytes>>20)
	}

	if strings.TrimSpace(info.Family) == "" {
		return FontFile{}, fmt.Errorf("%s has no family name inside it, so it can't be chosen", fileName(name))
	}

	sum := sha256.Sum256(data)
	id := hex.EncodeToString(sum[:16]) + ext

	s.mu.Lock()
	defer s.mu.Unlock()

	dir, err := s.dir()
	if err != nil {
		return FontFile{}, err
	}

	if err := fsutil.WriteAtomic(filepath.Join(dir, id), data); err != nil {
		return FontFile{}, fmt.Errorf("cannot keep %s: %w", fileName(name), err)
	}

	if err := writeInfo(dir, id, stored{Name: fileName(name), Info: info}); err != nil {
		return FontFile{}, err
	}

	return FontFile{ID: id, Name: fileName(name), Size: int64(len(data)), Info: info, Known: true}, nil
}

func writeInfo(dir string, id string, about stored) error {
	if about.Scripts == nil {
		about.Scripts = []string{}
	}

	text, err := json.Marshal(about)
	if err != nil {
		return err
	}

	if err := fsutil.WriteAtomic(filepath.Join(dir, id+InfoSuffix), text); err != nil {
		return fmt.Errorf("cannot keep what the font %s is: %w", about.Name, err)
	}

	return nil
}

// SetFontInfo keeps what the interface read from a font whose info was missing.
func (s *Service) SetFontInfo(id string, info Info) error {
	if err := checkID(id); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	dir, err := s.dir()
	if err != nil {
		return err
	}

	if _, err := os.Stat(filepath.Join(dir, id)); err != nil {
		return fmt.Errorf("the font %s isn't here", id)
	}

	name := id
	if text, err := fsutil.ReadIfThere(filepath.Join(dir, id+InfoSuffix)); err == nil && text != nil {
		var about stored
		if json.Unmarshal(text, &about) == nil && about.Name != "" {
			name = about.Name
		}
	}

	return writeInfo(dir, id, stored{Name: name, Info: info})
}

// ListFonts returns every font kept, by family and then by file name.
func (s *Service) ListFonts() ([]FontFile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	dir, err := s.dir()
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("cannot read the fonts folder %q: %w", dir, err)
	}

	fonts := []FontFile{}

	for _, entry := range entries {
		if entry.IsDir() || checkID(entry.Name()) != nil {
			continue
		}

		details, err := entry.Info()
		if err != nil {
			continue
		}

		font := FontFile{ID: entry.Name(), Name: entry.Name(), Size: details.Size(), Info: Info{Scripts: []string{}}}

		if text, err := fsutil.ReadIfThere(filepath.Join(dir, entry.Name()+InfoSuffix)); err == nil && text != nil {
			var about stored
			if json.Unmarshal(text, &about) == nil && about.Family != "" {
				font.Name = about.Name
				font.Info = about.Info
				font.Known = true

				if font.Scripts == nil {
					font.Scripts = []string{}
				}
			}
		}

		fonts = append(fonts, font)
	}

	slices.SortFunc(fonts, func(a, b FontFile) int {
		if c := strings.Compare(strings.ToLower(a.Family), strings.ToLower(b.Family)); c != 0 {
			return c
		}

		return strings.Compare(a.Name, b.Name)
	})

	return fonts, nil
}

// ReadFont returns a kept font file's bytes.
func (s *Service) ReadFont(id string) ([]byte, error) {
	if err := checkID(id); err != nil {
		return nil, err
	}

	dir, err := s.dir()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(filepath.Join(dir, id))
	if errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("the font %s isn't here any more", id)
	}

	return data, err
}

// RemoveFont deletes a kept font file and its info. Documents that use it fall back
// to a bundled font, and say so in Check.
func (s *Service) RemoveFont(id string) error {
	if err := checkID(id); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	dir, err := s.dir()
	if err != nil {
		return err
	}

	for _, path := range []string{filepath.Join(dir, id), filepath.Join(dir, id+InfoSuffix)} {
		if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("cannot remove the font: %w", err)
		}
	}

	return nil
}
