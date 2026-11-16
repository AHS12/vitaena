//go:build !windows

package mcp

import (
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
)

// SocketName is the file, in the app's data folder, assistants reach the app by.
// The data folder is the user's own, and the socket is for them alone.
const SocketName = "mcp.sock"

func socketPath(dataFolder string) string {
	return filepath.Join(dataFolder, SocketName)
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
