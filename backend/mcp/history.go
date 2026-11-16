package mcp

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"time"

	"vitaena/backend/fsutil"
)

// What assistants did, and copies of documents from before they changed them, kept in
// the data folder so a change can be looked over and put back. Copies are kept 30
// days, the same as Recently removed; the list keeps the last 200 changes.

const (
	historyFolder = "assistants"
	copiesFolder  = "copies"
	activityFile  = "activity.json"
	keepCopies    = 30 * 24 * time.Hour
	keepActivity  = 200
)

// Activity is one change an assistant made.
type Activity struct {
	At           string `json:"at"`
	Client       string `json:"client"`
	DocumentID   string `json:"documentId"`
	DocumentName string `json:"documentName"`
	Summary      string `json:"summary"`
	// Copy names the copy kept from before the change, if one was, for ReadCopy.
	Copy string `json:"copy,omitempty"`
}

func (s *Service) historyDir(parts ...string) (string, error) {
	folder, err := s.shell.DataFolder()
	if err != nil {
		return "", err
	}

	dir := filepath.Join(append([]string{folder, historyFolder}, parts...)...)

	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", fmt.Errorf("cannot make %s: %w", dir, err)
	}

	return dir, nil
}

// KeepCopy keeps a document's file as it was before an assistant changed it, and
// returns the copy's name. Copies older than 30 days go.
func (s *Service) KeepCopy(id string, contents []byte) (string, error) {
	if err := fsutil.CheckID(id); err != nil {
		return "", err
	}

	dir, err := s.historyDir(copiesFolder)
	if err != nil {
		return "", err
	}

	s.pruneCopies(dir)

	// Two changes can come within one millisecond, so a name already taken gets a number,
	// and no copy ever replaces another.
	s.copiesMu.Lock()
	defer s.copiesMu.Unlock()

	stamp := id + "~" + strconv.FormatInt(time.Now().UnixMilli(), 10)
	name := stamp + ".json"

	for count := 2; ; count++ {
		if _, err := os.Lstat(filepath.Join(dir, name)); errors.Is(err, os.ErrNotExist) {
			break
		}

		name = stamp + "-" + strconv.Itoa(count) + ".json"
	}

	if err := fsutil.WriteAtomic(filepath.Join(dir, name), contents); err != nil {
		return "", err
	}

	return name, nil
}

func (s *Service) pruneCopies(dir string) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if info, err := entry.Info(); err == nil && time.Since(info.ModTime()) > keepCopies {
			_ = os.Remove(filepath.Join(dir, entry.Name()))
		}
	}
}

// ReadCopy returns a copy KeepCopy kept.
func (s *Service) ReadCopy(name string) ([]byte, error) {
	if err := fsutil.CheckFileName(name); err != nil {
		return nil, err
	}

	dir, err := s.historyDir(copiesFolder)
	if err != nil {
		return nil, err
	}

	contents, err := os.ReadFile(filepath.Join(dir, name))
	if errors.Is(err, os.ErrNotExist) {
		return nil, errors.New("that copy is gone: copies are kept 30 days")
	}

	return contents, err
}

// RecordActivity adds a change to the list, keeping the last 200.
func (s *Service) RecordActivity(activity Activity) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	list, path, err := s.readActivity()
	if err != nil {
		return err
	}

	if activity.At == "" {
		activity.At = time.Now().UTC().Format(time.RFC3339)
	}

	list = append([]Activity{activity}, list...)
	if len(list) > keepActivity {
		list = list[:keepActivity]
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	return fsutil.WriteAtomic(path, data)
}

// ListActivity returns the changes assistants made, newest first.
func (s *Service) ListActivity() ([]Activity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	list, _, err := s.readActivity()

	return list, err
}

// ClearActivity forgets the list. The copies stay until they're 30 days old.
func (s *Service) ClearActivity() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, path, err := s.readActivity()
	if err != nil {
		return err
	}

	err = os.Remove(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}

	return err
}

// readActivity reads the list. Callers hold s.mu.
func (s *Service) readActivity() ([]Activity, string, error) {
	dir, err := s.historyDir()
	if err != nil {
		return nil, "", err
	}

	path := filepath.Join(dir, activityFile)
	list := []Activity{}

	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return list, path, nil
	}

	if err != nil {
		return nil, "", err
	}

	// A list that can't be read is started again rather than stopping assistants.
	if json.Unmarshal(data, &list) != nil {
		list = []Activity{}
	}

	return slices.Clip(list), path, nil
}
