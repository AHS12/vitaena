package mcp

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestKeepsACopyAndReadsItBack(t *testing.T) {
	svc, _ := newService(t)

	name, err := svc.KeepCopy("cv-1", []byte(`{"name":"Jane Doe"}`))
	if err != nil {
		t.Fatal(err)
	}

	got, err := svc.ReadCopy(name)
	if err != nil || string(got) != `{"name":"Jane Doe"}` {
		t.Fatalf("got %q, %v", got, err)
	}
}

func TestKeepsEveryCopyEvenWithinOneMillisecond(t *testing.T) {
	svc, _ := newService(t)
	names := map[string]string{}

	for i := range 20 {
		contents := string(rune('a' + i))

		name, err := svc.KeepCopy("cv-1", []byte(contents))
		if err != nil {
			t.Fatal(err)
		}

		names[name] = contents
	}

	if len(names) != 20 {
		t.Fatalf("20 copies took %d names", len(names))
	}

	for name, contents := range names {
		if got, err := svc.ReadCopy(name); err != nil || string(got) != contents {
			t.Errorf("%s holds %q, %v; want %q", name, got, err, contents)
		}
	}
}

func TestRefusesNamesThatReachOutsideTheFolder(t *testing.T) {
	svc, _ := newService(t)

	if _, err := svc.KeepCopy("../cv-1", []byte("x")); err == nil {
		t.Error("an id with a path should be refused")
	}

	if _, err := svc.ReadCopy(`..\settings.json`); err == nil {
		t.Error("a copy name with a path should be refused")
	}
}

func TestForgetsCopiesAfterThirtyDays(t *testing.T) {
	svc, _ := newService(t)

	old, _ := svc.KeepCopy("cv-1", []byte("old"))
	dir, _ := svc.historyDir(copiesFolder)
	long := time.Now().Add(-31 * 24 * time.Hour)

	if err := os.Chtimes(filepath.Join(dir, old), long, long); err != nil {
		t.Fatal(err)
	}

	if _, err := svc.KeepCopy("cv-1", []byte("new")); err != nil {
		t.Fatal(err)
	}

	if _, err := svc.ReadCopy(old); err == nil || err.Error() != "that copy is gone: copies are kept 30 days" {
		t.Errorf("got %v", err)
	}
}

func TestListsWhatAssistantsDidNewestFirstAndKeepsTheLast200(t *testing.T) {
	svc, _ := newService(t)

	for i := range 205 {
		if err := svc.RecordActivity(Activity{Client: "Claude", DocumentID: "cv-1", Summary: string(rune('a' + i%26))}); err != nil {
			t.Fatal(err)
		}
	}

	list, err := svc.ListActivity()
	if err != nil {
		t.Fatal(err)
	}

	if len(list) != keepActivity || list[0].Summary != string(rune('a'+204%26)) || list[0].At == "" {
		t.Fatalf("got %d, first %+v", len(list), list[0])
	}

	if err := svc.ClearActivity(); err != nil {
		t.Fatal(err)
	}

	if list, _ := svc.ListActivity(); len(list) != 0 {
		t.Errorf("got %d after clearing", len(list))
	}
}
