package fontpacks

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"vitaena/backend"
)

func fontOf(name string, data []byte) Font {
	sum := sha256.Sum256(data)
	return Font{Path: "@expo-google-fonts/test/400Regular/" + name, Bytes: int64(len(data)), SHA256: hex.EncodeToString(sum[:])}
}

var (
	regular = []byte(strings.Repeat("regular font ", 400))
	bold    = []byte(strings.Repeat("bold font ", 300))
)

func testPack() Pack {
	return Pack{ID: "ja", File: "vitaena-fonts-ja.zip", Fonts: []Font{fontOf("Test_400Regular.ttf", regular), fontOf("Test_700Bold.ttf", bold)}}
}

func zipOf(t *testing.T, pack Pack, files map[string][]byte) []byte {
	t.Helper()

	var out bytes.Buffer
	if err := WritePack(&out, pack, func(font Font) ([]byte, error) { return files[font.Name()], nil }); err != nil {
		t.Fatal(err)
	}

	return out.Bytes()
}

// serviceWith is a service whose one pack is served by a test server answering with body.
func serviceWith(t *testing.T, pack Pack, body []byte) (*Service, string, *[]Progress) {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/"+pack.File {
			http.NotFound(writer, request)
			return
		}

		_, _ = writer.Write(body)
	}))
	t.Cleanup(server.Close)

	data := t.TempDir()
	progress := &[]Progress{}
	shell := backend.Shell{
		DataFolder: func() (string, error) { return data, nil },
		Emit: func(name string, values ...any) {
			if name == ProgressEvent {
				*progress = append(*progress, values[0].(Progress))
			}
		},
	}

	service := New(shell)
	service.manifest = Manifest{Release: "fonts-test", Packs: []Pack{pack}}
	service.baseURL = server.URL + "/"

	return service, data, progress
}

func TestTheBuiltInListNamesAReleaseAndEveryFontsSizeAndChecksum(t *testing.T) {
	manifest := Packs()

	if !strings.HasPrefix(manifest.Release, "fonts-") || len(manifest.Packs) == 0 {
		t.Fatalf("packs.json names release %q with %d packs", manifest.Release, len(manifest.Packs))
	}

	for _, pack := range manifest.Packs {
		if pack.Bytes <= 0 || pack.File == "" {
			t.Errorf("pack %s has no file or size", pack.ID)
		}

		for _, font := range pack.Fonts {
			if font.Bytes <= 0 || len(font.SHA256) != 64 {
				t.Errorf("%s has no size or checksum: run go run ./tools/fontpacks -update", font.Path)
			}
		}
	}
}

func TestAPackIsDownloadedCheckedAndListedAsInstalled(t *testing.T) {
	pack := testPack()
	service, data, progress := serviceWith(t, pack, zipOf(t, pack, map[string][]byte{"Test_400Regular.ttf": regular, "Test_700Bold.ttf": bold}))

	if err := service.DownloadFontPack("ja"); err != nil {
		t.Fatal(err)
	}

	got, err := os.ReadFile(filepath.Join(data, FolderName, "ja", "Test_700Bold.ttf"))
	if err != nil || !bytes.Equal(got, bold) {
		t.Fatalf("the bold font wasn't kept: %v", err)
	}

	states, err := service.ListFontPacks()
	if err != nil || len(states) != 1 || !states[0].Installed {
		t.Fatalf("the pack isn't listed as installed: %+v %v", states, err)
	}

	if len(*progress) == 0 || (*progress)[len(*progress)-1].Fraction != 1 {
		t.Errorf("the download didn't end by reporting it was done: %+v", *progress)
	}

	leftovers, _ := filepath.Glob(filepath.Join(data, FolderName, ".*"))
	if len(leftovers) != 0 {
		t.Errorf("the download left %v behind", leftovers)
	}
}

func TestAFontThatIsNotTheOneExpectedIsRefused(t *testing.T) {
	pack := testPack()
	tampered := append([]byte{}, regular...)
	tampered[0] = 'X'
	service, data, _ := serviceWith(t, pack, zipOf(t, pack, map[string][]byte{"Test_400Regular.ttf": tampered, "Test_700Bold.ttf": bold}))

	err := service.DownloadFontPack("ja")
	if err == nil || !strings.Contains(err.Error(), "isn't the font Vitaena expects") {
		t.Fatalf("a changed font was accepted: %v", err)
	}

	if _, err := os.Stat(filepath.Join(data, FolderName, "ja")); !os.IsNotExist(err) {
		t.Error("a pack with a changed font was kept")
	}
}

func TestADownloadThatIsNotAZipIsRefused(t *testing.T) {
	service, _, _ := serviceWith(t, testPack(), []byte("<html>Not found</html>"))

	if err := service.DownloadFontPack("ja"); err == nil {
		t.Fatal("a page that isn't a zip was accepted")
	}
}

func TestAMissingReleaseSaysWhatGitHubAnswered(t *testing.T) {
	pack := testPack()
	service, _, _ := serviceWith(t, pack, nil)
	service.baseURL += "missing/"

	err := service.DownloadFontPack("ja")
	if err == nil || !strings.Contains(err.Error(), "404") {
		t.Fatalf("a missing release didn't say so: %v", err)
	}
}

func TestOnlyAPacksOwnFontsAreServedAndRemovingAPackDeletesThem(t *testing.T) {
	pack := testPack()
	service, data, _ := serviceWith(t, pack, zipOf(t, pack, map[string][]byte{"Test_400Regular.ttf": regular, "Test_700Bold.ttf": bold}))

	if err := service.DownloadFontPack("ja"); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(data, "settings.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}

	handler := Handler(service)
	get := func(address string) *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, address, nil))
		return recorder
	}

	served := get(RoutePrefix + "ja/Test_400Regular.ttf")
	if body, _ := io.ReadAll(served.Body); served.Code != http.StatusOK || !bytes.Equal(body, regular) {
		t.Fatalf("the regular font wasn't served: %d", served.Code)
	}

	for _, address := range []string{RoutePrefix + "ja/../../settings.json", RoutePrefix + "ko/Test_400Regular.ttf", RoutePrefix + "ja/Other.ttf"} {
		if code := get(address).Code; code != http.StatusNotFound {
			t.Errorf("%s answered %d", address, code)
		}
	}

	if err := service.RemoveFontPack("ja"); err != nil {
		t.Fatal(err)
	}

	if code := get(RoutePrefix + "ja/Test_400Regular.ttf").Code; code != http.StatusNotFound {
		t.Errorf("a removed pack's font was still served: %d", code)
	}
}

func TestAPackCanComeFromALocalFolderBeforeItIsReleased(t *testing.T) {
	pack := testPack()
	service, data, _ := serviceWith(t, pack, nil)
	service.baseURL = "http://127.0.0.1:1/"
	service.localDir = t.TempDir()

	if err := os.WriteFile(filepath.Join(service.localDir, pack.File), zipOf(t, pack, map[string][]byte{"Test_400Regular.ttf": regular, "Test_700Bold.ttf": bold}), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := service.DownloadFontPack("ja"); err != nil {
		t.Fatal(err)
	}

	if _, err := os.Stat(filepath.Join(data, FolderName, "ja", "Test_400Regular.ttf")); err != nil {
		t.Fatal("the pack from the folder wasn't kept")
	}
}

func TestTheFontsReleaseIsAPreReleaseSoTheUpdateCheckNeverSeesIt(t *testing.T) {
	workflow, err := os.ReadFile(filepath.Join("..", "..", ".github", "workflows", "font-packs.yml"))
	if err != nil {
		t.Fatal(err)
	}

	for _, want := range []string{"--prerelease", "--latest=false", "go run ./tools/fontpacks -out"} {
		if !strings.Contains(string(workflow), want) {
			t.Errorf("font-packs.yml no longer has %s", want)
		}
	}

	release, err := os.ReadFile(filepath.Join("..", "..", ".github", "workflows", "release.yml"))
	if err != nil {
		t.Fatal(err)
	}

	if !strings.Contains(string(release), "startsWith(github.event.release.tag_name, 'v')") {
		t.Error("release.yml would build installers for the fonts release")
	}
}
