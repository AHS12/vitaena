//go:build !windows

package mcp

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"

	"vitaena/appconfig"
)

// SocketName is the file, in the app's data folder, assistants reach the app by.
// The data folder is the user's own, and the socket is for them alone.
const SocketName = "mcp.sock"

// mostSocketPath is the longest path a Unix socket can have: macOS allows 104 bytes
// with the ending zero, Linux 108.
const mostSocketPath = 103

// socketPath is the socket in the data folder, or, where that path is too long for a
// socket, one in the user's own runtime or temporary folder, named after the data
// folder so the app and the relay agree on it.
func socketPath(dataFolder string) string {
	path := filepath.Join(dataFolder, SocketName)
	if len(path) <= mostSocketPath {
		return path
	}

	dir := os.Getenv("XDG_RUNTIME_DIR")
	if dir == "" {
		dir = os.TempDir()
	}

	sum := sha256.Sum256([]byte(dataFolder))

	return filepath.Join(dir, fmt.Sprintf("%s-mcp-%d-%s.sock", appconfig.Current().ID, os.Getuid(), hex.EncodeToString(sum[:6])))
}

// listenAt listens in the data folder, removing a socket left by an app that
// didn't close.
func listenAt(dataFolder string) (net.Listener, error) {
	path := socketPath(dataFolder)

	if conn, err := net.DialTimeout("unix", path, time.Second); err == nil {
		_ = conn.Close()
		return nil, errors.New("another copy of the app is already listening for assistants")
	}

	_ = os.Remove(path)

	listener, err := net.Listen("unix", path)
	if err != nil {
		return nil, fmt.Errorf("cannot listen for assistants: %w", err)
	}

	_ = os.Chmod(path, 0o600)

	return listener, nil
}

func dial(dataFolder string) (net.Conn, error) {
	return net.DialTimeout("unix", socketPath(dataFolder), time.Second)
}

// StartApp starts this program again with backgroundArg, on its own so it outlives
// the relay. What it returns is called once the app is reached.
func StartApp(backgroundArg string) (func(), error) {
	program, err := os.Executable()
	if err != nil {
		return nil, err
	}

	command := exec.Command(program, backgroundArg)
	command.SysProcAttr = &syscall.SysProcAttr{Setsid: true}

	if err := command.Start(); err != nil {
		return nil, err
	}

	return func() {}, command.Process.Release()
}

// StartedForAssistant reports whether a relay asked for this start other than
// with the background argument. Only Windows needs that: see socket_windows.go.
func StartedForAssistant() bool {
	return false
}

// downloadsFolder is where exports go when no folder is named.
func downloadsFolder() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(home, "Downloads"), nil
}
