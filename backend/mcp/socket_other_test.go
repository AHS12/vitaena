//go:build !windows

package mcp

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestKeepsTheSocketInTheDataFolderWhenItsPathFits(t *testing.T) {
	if got := socketPath("/home/jane/.config/app"); got != filepath.Join("/home/jane/.config/app", SocketName) {
		t.Errorf("got %s", got)
	}
}

func TestMovesTheSocketOutOfADataFolderTooDeepForOne(t *testing.T) {
	deep := "/" + strings.Repeat("a-long-folder-name/", 8)
	got := socketPath(deep)

	if len(got) > mostSocketPath || strings.HasPrefix(got, deep) {
		t.Fatalf("got %s (%d bytes)", got, len(got))
	}

	if socketPath(deep) != got || socketPath(deep+"x") == got {
		t.Error("each data folder should have its own socket, the same every time")
	}
}
