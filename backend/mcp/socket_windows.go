package mcp

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"strings"
	"time"

	"vitaena/appconfig"

	"github.com/Microsoft/go-winio"
	"golang.org/x/sys/windows"
)

// On Windows the app and the relay meet at a named pipe, not a file. An assistant
// installed as a package, Claude Desktop among them, sees a private copy of
// AppData, so a socket file there can't be reached from outside it, and an app
// started from inside would read and save documents in that copy. Named pipes,
// named events and Explorer are the same inside and out.

// pipeName is the same for the app and the relay of one data folder, which also
// keeps tests apart from a running app.
func pipeName(dataFolder string) string {
	sum := sha256.Sum256([]byte(strings.ToLower(dataFolder)))

	return `\\.\pipe\` + appconfig.Current().ID + "-mcp-" + hex.EncodeToString(sum[:8])
}

// startEventName is the event a relay holds while Explorer starts the app, since
// Explorer can't pass the background argument.
func startEventName() string {
	return `Local\` + appconfig.Current().ID + "-mcp-start"
}

// listenAt opens the pipe for this user alone. A second copy can't open it.
func listenAt(dataFolder string) (net.Listener, error) {
	user, err := windows.GetCurrentProcessToken().GetTokenUser()
	if err != nil {
		return nil, err
	}

	listener, err := winio.ListenPipe(pipeName(dataFolder), &winio.PipeConfig{
		SecurityDescriptor: "D:P(A;;GA;;;" + user.User.Sid.String() + ")",
		MessageMode:        true,
	})
	if err != nil {
		if errors.Is(err, windows.ERROR_ACCESS_DENIED) || errors.Is(err, windows.ERROR_PIPE_BUSY) {
			return nil, errors.New("another copy of the app is already listening for assistants")
		}

		return nil, fmt.Errorf("cannot listen for assistants: %w", err)
	}

	return listener, nil
}

func dial(dataFolder string) (net.Conn, error) {
	timeout := time.Second

	return winio.DialPipe(pipeName(dataFolder), &timeout)
}

// StartApp asks Explorer to start the app, so it runs outside any package the
// assistant is in, with the person's own AppData. The event it holds tells the
// app it was started for an assistant; what it returns lets go of it once the app
// is reached.
func StartApp(string) (func(), error) {
	program, err := os.Executable()
	if err != nil {
		return nil, err
	}

	name, err := windows.UTF16PtrFromString(startEventName())
	if err != nil {
		return nil, err
	}

	event, err := windows.CreateEvent(nil, 1, 0, name)
	if err != nil {
		return nil, err
	}

	// Explorer answers 1 even when it starts the program, so its answer says nothing.
	_ = exec.Command("explorer.exe", program).Run()

	return func() { _ = windows.CloseHandle(event) }, nil
}

// StartedForAssistant reports whether a relay is waiting for this start.
func StartedForAssistant() bool {
	name, err := windows.UTF16PtrFromString(startEventName())
	if err != nil {
		return false
	}

	event, err := windows.OpenEvent(windows.SYNCHRONIZE, false, name)
	if err != nil {
		return false
	}

	_ = windows.CloseHandle(event)

	return true
}

// downloadsFolder is where exports go when no folder is named: the user's
// Downloads, wherever they moved it.
func downloadsFolder() (string, error) {
	return windows.KnownFolderPath(windows.FOLDERID_Downloads, 0)
}
