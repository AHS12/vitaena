package fontpacks

import (
	"archive/zip"
	"compress/flate"
	"io"
	"time"
)

// packTime dates every file in a pack, so the same fonts always make the same zip.
var packTime = time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

// WritePack writes a pack's zip: each font, in order, read with read. tools/fontpacks
// makes the release's packs with it, and the tests make their own.
func WritePack(out io.Writer, pack Pack, read func(Font) ([]byte, error)) error {
	writer := zip.NewWriter(out)
	writer.RegisterCompressor(zip.Deflate, func(out io.Writer) (io.WriteCloser, error) {
		return flate.NewWriter(out, flate.BestCompression)
	})

	for _, font := range pack.Fonts {
		data, err := read(font)
		if err != nil {
			return err
		}

		entry, err := writer.CreateHeader(&zip.FileHeader{Name: font.Name(), Method: zip.Deflate, Modified: packTime})
		if err != nil {
			return err
		}

		if _, err := entry.Write(data); err != nil {
			return err
		}
	}

	return writer.Close()
}
