package fonts

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func service(t *testing.T) (*Service, string) {
	t.Helper()

	root := t.TempDir()

	return New(func() (string, error) { return root, nil }), filepath.Join(root, FolderName)
}

var kalpurush = Info{Family: "Kalpurush", Style: "normal", Weight: 400, Scripts: []string{"bengali", "latin"}}

func TestAddedFontIsKeptAndListedWithWhatItIs(t *testing.T) {
	s, dir := service(t)

	font, err := s.AddFont(`C:\Users\someone\Downloads\kalpurush.ttf`, []byte("font bytes"), kalpurush)
	if err != nil {
		t.Fatal(err)
	}

	if font.Name != "kalpurush.ttf" || !strings.HasSuffix(font.ID, ".ttf") || !font.Known {
		t.Fatalf("got %+v", font)
	}

	if _, err := os.Stat(filepath.Join(dir, font.ID)); err != nil {
		t.Fatalf("the file isn't in the fonts folder: %v", err)
	}

	listed, err := s.ListFonts()
	if err != nil {
		t.Fatal(err)
	}

	if len(listed) != 1 || listed[0].Family != "Kalpurush" || listed[0].Size != int64(len("font bytes")) || len(listed[0].Scripts) != 2 {
		t.Fatalf("got %+v", listed)
	}

	data, err := s.ReadFont(font.ID)
	if err != nil || !bytes.Equal(data, []byte("font bytes")) {
		t.Fatalf("read %q, %v", data, err)
	}
}

func TestTheSameFileAddedTwiceIsOneFont(t *testing.T) {
	s, _ := service(t)

	first, _ := s.AddFont("a.ttf", []byte("same"), kalpurush)
	second, _ := s.AddFont("b.ttf", []byte("same"), kalpurush)
	listed, _ := s.ListFonts()

	if first.ID != second.ID || len(listed) != 1 {
		t.Fatalf("got %s and %s, listed %d", first.ID, second.ID, len(listed))
	}
}

func TestFilesThatArentFontsAreRefused(t *testing.T) {
	s, _ := service(t)

	cases := map[string]struct {
		name string
		data []byte
		info Info
	}{
		"web font":  {"font.woff2", []byte("x"), kalpurush},
		"empty":     {"font.ttf", nil, kalpurush},
		"no family": {"font.otf", []byte("x"), Info{}},
		"too large": {"font.ttf", make([]byte, MaxBytes+1), kalpurush},
	}

	for name, c := range cases {
		if _, err := s.AddFont(c.name, c.data, c.info); err == nil {
			t.Errorf("%s: added", name)
		}
	}

	if listed, _ := s.ListFonts(); len(listed) != 0 {
		t.Fatalf("kept %d", len(listed))
	}
}

func TestNamesFromOutsideNeverReachOutOfTheFolder(t *testing.T) {
	s, _ := service(t)

	for _, id := range []string{"../secret.ttf", `..\..\x.ttf`, "settings.json", "0123456789abcdef0123456789abcdef.exe", ""} {
		if _, err := s.ReadFont(id); err == nil {
			t.Errorf("read %q", id)
		}

		if err := s.RemoveFont(id); err == nil {
			t.Errorf("removed %q", id)
		}
	}
}

func TestRemovingAFontTakesItsInfoToo(t *testing.T) {
	s, dir := service(t)

	font, _ := s.AddFont("kalpurush.ttf", []byte("font"), kalpurush)

	if err := s.RemoveFont(font.ID); err != nil {
		t.Fatal(err)
	}

	entries, _ := os.ReadDir(dir)
	if len(entries) != 0 {
		t.Fatalf("left %d files", len(entries))
	}
}

func TestAFontWhoseInfoIsMissingIsListedToBeReadAgain(t *testing.T) {
	s, dir := service(t)

	font, _ := s.AddFont("kalpurush.ttf", []byte("font"), kalpurush)
	_ = os.Remove(filepath.Join(dir, font.ID+InfoSuffix))

	listed, _ := s.ListFonts()
	if len(listed) != 1 || listed[0].Known {
		t.Fatalf("got %+v", listed)
	}

	if err := s.SetFontInfo(font.ID, kalpurush); err != nil {
		t.Fatal(err)
	}

	listed, _ = s.ListFonts()
	if !listed[0].Known || listed[0].Family != "Kalpurush" {
		t.Fatalf("got %+v", listed)
	}
}
