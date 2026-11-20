// Command fontpacks makes the font packs the app downloads, from the font files in
// frontend/node_modules, and checks them against backend/fontpacks/packs.json.
//
//	go run ./tools/fontpacks -out build/dist/font-packs   # make the zips, refusing any font that changed
//	go run ./tools/fontpacks -update                       # write each font's size and SHA-256 into packs.json
//
// The app checks every font it downloads against packs.json, so after changing a font
// package, run -update, and publish the packs on a new release (raise "release").
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"vitaena/backend/fontpacks"
)

const manifestPath = "backend/fontpacks/packs.json"

func main() {
	modules := flag.String("modules", "frontend/node_modules", "the folder the font packages are installed in")
	out := flag.String("out", "", "the folder to write the packs into")
	update := flag.Bool("update", false, "write each font's size and SHA-256, and each pack's size, into "+manifestPath)
	flag.Parse()

	if *out == "" && !*update {
		flag.Usage()
		os.Exit(2)
	}

	manifest := fontpacks.Packs()
	read := func(font fontpacks.Font) ([]byte, error) {
		return os.ReadFile(filepath.Join(*modules, filepath.FromSlash(font.Path)))
	}

	for i, pack := range manifest.Packs {
		for j, font := range pack.Fonts {
			data, err := read(font)
			if err != nil {
				log.Fatalf("%s: %v (run make install first)", font.Path, err)
			}

			sum := sha256.Sum256(data)
			got := hex.EncodeToString(sum[:])

			if *update {
				manifest.Packs[i].Fonts[j].Bytes = int64(len(data))
				manifest.Packs[i].Fonts[j].SHA256 = got
			} else if got != font.SHA256 || int64(len(data)) != font.Bytes {
				log.Fatalf("%s isn't the file in %s. Run go run ./tools/fontpacks -update, and publish the packs on a new release", font.Path, manifestPath)
			}
		}

		var zipped bytes.Buffer
		if err := fontpacks.WritePack(&zipped, manifest.Packs[i], read); err != nil {
			log.Fatal(err)
		}

		manifest.Packs[i].Bytes = int64(zipped.Len())

		if *out != "" {
			if err := os.MkdirAll(*out, 0o755); err != nil {
				log.Fatal(err)
			}

			if err := os.WriteFile(filepath.Join(*out, pack.File), zipped.Bytes(), 0o644); err != nil {
				log.Fatal(err)
			}

			fmt.Printf("%s  %.1f MB\n", pack.File, float64(zipped.Len())/(1<<20))
		}
	}

	if *update {
		text, err := json.MarshalIndent(manifest, "", "  ")
		if err != nil {
			log.Fatal(err)
		}

		if err := os.WriteFile(manifestPath, append(text, '\n'), 0o644); err != nil {
			log.Fatal(err)
		}

		fmt.Println("Wrote", manifestPath)
	}
}
