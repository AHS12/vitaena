// Package fontpacks downloads the fonts too large to come with the app: those for
// Chinese, Japanese and Korean, which would make the installer several times larger
// for people who never write in them.
//
// Each pack is a zip on one GitHub release of the app, a pre-release so the update
// check, which asks for the latest release, never sees it. The pack's fonts are listed
// in packs.json with their size and SHA-256, so a file that isn't exactly the one the
// app was built with is refused. They are kept in the app's own folder, not beside the
// documents: they're the same for everyone and can be downloaded again, so backups
// needn't carry them. The interface loads them from the address RoutePrefix.
package fontpacks

import (
	"archive/zip"
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"vitaena/appconfig"
	"vitaena/backend"
)

// FolderName is where packs are kept, inside the app's own folder: one folder each.
const FolderName = "font-packs"

// RoutePrefix is where the interface reads a pack's fonts: /font-packs/<pack>/<file>.
const RoutePrefix = "/font-packs/"

// LocalEnv, when set to a folder, is where packs come from instead of GitHub, so the
// download can be tried before a release holds them: make dev-packs sets it.
const LocalEnv = "VITAENA_FONT_PACKS"

// ProgressEvent tells the interface how far a download has got. Matches PROGRESS_EVENT
// in frontend/src/platform/font-packs.ts.
const ProgressEvent = "fonts:pack-progress"

// Font is one font file in a pack: its npm path, which the frontend names it by, its
// size and its SHA-256.
type Font struct {
	Path   string `json:"path"`
	Bytes  int64  `json:"bytes"`
	SHA256 string `json:"sha256"`
}

// Name is the file's name in the zip and on disk.
func (f Font) Name() string { return path.Base(f.Path) }

// Pack is one download: the fonts for one language.
type Pack struct {
	// ID is the document language it's for, such as "ja" or "zh-Hans".
	ID    string `json:"id"`
	File  string `json:"file"`
	Bytes int64  `json:"bytes"`
	Fonts []Font `json:"fonts"`
}

// Manifest is packs.json: the release the packs are on, and each pack.
type Manifest struct {
	Release string `json:"release"`
	Packs   []Pack `json:"packs"`
}

//go:embed packs.json
var manifestJSON []byte

// Packs is the list the app was built with.
func Packs() Manifest {
	var manifest Manifest
	if err := json.Unmarshal(manifestJSON, &manifest); err != nil {
		panic("fontpacks: packs.json doesn't read: " + err.Error())
	}

	return manifest
}

// Find returns the pack with an id.
func (m Manifest) Find(id string) (Pack, bool) {
	index := slices.IndexFunc(m.Packs, func(pack Pack) bool { return pack.ID == id })
	if index < 0 {
		return Pack{}, false
	}

	return m.Packs[index], true
}

// FontBytes is the size of a pack's fonts once unpacked.
func (p Pack) FontBytes() int64 {
	var total int64
	for _, font := range p.Fonts {
		total += font.Bytes
	}

	return total
}

// State is a pack as the interface sees it.
type State struct {
	ID        string `json:"id"`
	Bytes     int64  `json:"bytes"`
	Installed bool   `json:"installed"`
}

// Progress is how far a pack's download has got, from 0 to 1.
type Progress struct {
	ID       string  `json:"id"`
	Fraction float64 `json:"fraction"`
}

// Service keeps the downloaded packs.
type Service struct {
	shell    backend.Shell
	manifest Manifest
	// baseURL is where the packs are, ending in a slash. Tests point it at their own server.
	baseURL string
	// localDir, when set, holds the packs instead, as tools/fontpacks writes them.
	localDir string
	client   *http.Client
	mu       sync.Mutex
	busy     map[string]bool
}

// New keeps packs in the app's own folder and downloads them from its GitHub release.
func New(shell backend.Shell) *Service {
	manifest := Packs()

	return &Service{
		shell:    shell,
		manifest: manifest,
		baseURL:  "https://github.com/" + appconfig.Current().Repository + "/releases/download/" + manifest.Release + "/",
		client:   &http.Client{Timeout: 30 * time.Minute},
		busy:     map[string]bool{},
		localDir: os.Getenv(LocalEnv),
	}
}

func (s *Service) folder() (string, error) {
	data, err := s.shell.DataFolder()
	if err != nil {
		return "", err
	}

	return filepath.Join(data, FolderName), nil
}

// installed says whether every font of a pack is there, at its size. Its contents were
// checked when it was downloaded.
func installed(dir string, pack Pack) bool {
	for _, font := range pack.Fonts {
		info, err := os.Stat(filepath.Join(dir, font.Name()))
		if err != nil || info.Size() != font.Bytes {
			return false
		}
	}

	return true
}

// ListFontPacks returns every pack, and whether it's downloaded.
func (s *Service) ListFontPacks() ([]State, error) {
	root, err := s.folder()
	if err != nil {
		return nil, err
	}

	states := make([]State, 0, len(s.manifest.Packs))
	for _, pack := range s.manifest.Packs {
		states = append(states, State{ID: pack.ID, Bytes: pack.Bytes, Installed: installed(filepath.Join(root, pack.ID), pack)})
	}

	return states, nil
}

// DownloadFontPack downloads a pack, checks each font in it, and keeps them. It
// reports progress with ProgressEvent.
func (s *Service) DownloadFontPack(id string) error {
	pack, ok := s.manifest.Find(id)
	if !ok {
		return fmt.Errorf("there are no fonts to download for %q", id)
	}

	s.mu.Lock()
	if s.busy[id] {
		s.mu.Unlock()
		return errors.New("these fonts are already downloading")
	}
	s.busy[id] = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.busy, id)
		s.mu.Unlock()
	}()

	root, err := s.folder()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(root, 0o755); err != nil {
		return fmt.Errorf("cannot create the folder for downloaded fonts: %w", err)
	}

	archive := filepath.Join(root, "."+id+".zip")
	defer os.Remove(archive)

	if err := s.fetch(pack, archive); err != nil {
		return err
	}

	unpacked := filepath.Join(root, "."+id+".new")
	_ = os.RemoveAll(unpacked)
	defer os.RemoveAll(unpacked)

	if err := unpack(archive, unpacked, pack); err != nil {
		return err
	}

	final := filepath.Join(root, id)
	if err := os.RemoveAll(final); err != nil {
		return fmt.Errorf("cannot replace the fonts downloaded before: %w", err)
	}

	if err := os.Rename(unpacked, final); err != nil {
		return fmt.Errorf("cannot keep the downloaded fonts: %w", err)
	}

	s.shell.Emit(ProgressEvent, Progress{ID: id, Fraction: 1})

	return nil
}

// fetch saves a pack's zip to a file, refusing one far larger than it should be.
func (s *Service) fetch(pack Pack, file string) error {
	if s.localDir != "" {
		return s.copyLocal(pack, file)
	}

	request, err := http.NewRequest(http.MethodGet, s.baseURL+pack.File, nil)
	if err != nil {
		return err
	}

	request.Header.Set("User-Agent", appconfig.Current().ID)

	response, err := s.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub answered %s", response.Status)
	}

	// The zip is smaller than its fonts, so anything larger isn't the pack.
	limit := pack.FontBytes() + 1<<20

	out, err := os.Create(file)
	if err != nil {
		return err
	}
	defer out.Close()

	total := response.ContentLength
	if total <= 0 {
		total = pack.Bytes
	}

	reader := &progressReader{reader: io.LimitReader(response.Body, limit+1), total: total, report: func(fraction float64) {
		// The last step is unpacking, so the bar stops short of full until it's done.
		s.shell.Emit(ProgressEvent, Progress{ID: pack.ID, Fraction: fraction * 0.95})
	}}

	written, err := io.Copy(out, reader)
	if err != nil {
		return err
	}

	if written > limit {
		return errors.New("the download is larger than the fonts it should hold")
	}

	return out.Close()
}

// copyLocal takes a pack from the local folder, reporting progress as a download would.
func (s *Service) copyLocal(pack Pack, file string) error {
	source, err := os.Open(filepath.Join(s.localDir, pack.File))
	if err != nil {
		return fmt.Errorf("%s isn't in %s. Run make font-packs", pack.File, s.localDir)
	}
	defer source.Close()

	out, err := os.Create(file)
	if err != nil {
		return err
	}
	defer out.Close()

	info, err := source.Stat()
	if err != nil {
		return err
	}

	reader := &progressReader{reader: source, total: info.Size(), report: func(fraction float64) {
		s.shell.Emit(ProgressEvent, Progress{ID: pack.ID, Fraction: fraction * 0.95})
	}}

	if _, err := io.Copy(out, reader); err != nil {
		return err
	}

	return out.Close()
}

// unpack writes each of a pack's fonts from its zip into a folder, checking each
// against its size and SHA-256. Anything else in the zip is ignored.
func unpack(archive string, dir string, pack Pack) error {
	reader, err := zip.OpenReader(archive)
	if err != nil {
		return errors.New("the downloaded fonts aren't a zip Vitaena can read")
	}
	defer reader.Close()

	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	for _, font := range pack.Fonts {
		index := slices.IndexFunc(reader.File, func(file *zip.File) bool { return file.Name == font.Name() })
		if index < 0 {
			return fmt.Errorf("the download has no %s", font.Name())
		}

		if err := unpackFont(reader.File[index], filepath.Join(dir, font.Name()), font); err != nil {
			return err
		}
	}

	return nil
}

func unpackFont(entry *zip.File, target string, font Font) error {
	source, err := entry.Open()
	if err != nil {
		return fmt.Errorf("cannot read %s in the download: %w", font.Name(), err)
	}
	defer source.Close()

	out, err := os.Create(target)
	if err != nil {
		return err
	}
	defer out.Close()

	hash := sha256.New()

	written, err := io.Copy(io.MultiWriter(out, hash), io.LimitReader(source, font.Bytes+1))
	if err != nil {
		return fmt.Errorf("cannot read %s in the download: %w", font.Name(), err)
	}

	if written != font.Bytes || !strings.EqualFold(hex.EncodeToString(hash.Sum(nil)), font.SHA256) {
		return fmt.Errorf("%s in the download isn't the font Vitaena expects, so it wasn't kept", font.Name())
	}

	return out.Close()
}

// RemoveFontPack deletes a downloaded pack. Documents that use its fonts show their
// letters as empty boxes until it's downloaded again.
func (s *Service) RemoveFontPack(id string) error {
	if _, ok := s.manifest.Find(id); !ok {
		return fmt.Errorf("there are no fonts for %q", id)
	}

	root, err := s.folder()
	if err != nil {
		return err
	}

	if err := os.RemoveAll(filepath.Join(root, id)); err != nil {
		return fmt.Errorf("cannot remove the fonts: %w", err)
	}

	return nil
}

// Handler serves a downloaded pack's fonts at RoutePrefix<pack>/<file>, and only those.
func Handler(s *Service) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		id, name, _ := strings.Cut(strings.TrimPrefix(request.URL.Path, RoutePrefix), "/")

		pack, ok := s.manifest.Find(id)
		if !ok || !slices.ContainsFunc(pack.Fonts, func(font Font) bool { return font.Name() == name }) {
			http.NotFound(writer, request)
			return
		}

		root, err := s.folder()
		if err != nil {
			http.NotFound(writer, request)
			return
		}

		file, err := os.Open(filepath.Join(root, id, name))
		if err != nil {
			http.NotFound(writer, request)
			return
		}
		defer file.Close()

		info, err := file.Stat()
		if err != nil {
			http.NotFound(writer, request)
			return
		}

		writer.Header().Set("Content-Type", "font/ttf")
		http.ServeContent(writer, request, name, info.ModTime(), file)
	})
}

// progressReader reports at most once per percent.
type progressReader struct {
	reader  io.Reader
	total   int64
	read    int64
	percent int64
	report  func(float64)
}

func (r *progressReader) Read(buffer []byte) (int, error) {
	count, err := r.reader.Read(buffer)
	r.read += int64(count)

	if r.total > 0 {
		if percent := min(r.read*100/r.total, 100); percent > r.percent {
			r.percent = percent
			r.report(float64(percent) / 100)
		}
	}

	return count, err
}
