package mcp

import (
	"errors"
	"io"
	"net"
	"sync"
	"time"

	"vitaena/appconfig"
)

// Arg is the argument an assistant starts the app with: `vitaena mcp`.
const Arg = "mcp"

// startWait is how long the relay waits for an app it started to be ready.
const startWait = 45 * time.Second

// Relay carries an assistant's MCP messages between in and out and the running
// app's socket, starting the app with start when it isn't running. It returns
// when either side closes. Nothing but MCP may be written to out, so problems go
// to the returned error, which main.go prints on stderr.
func Relay(dataFolder string, in io.Reader, out io.Writer, start func() (func(), error)) error {
	conn, err := reach(dataFolder, start)
	if err != nil {
		return err
	}
	defer conn.Close()

	var once sync.Once
	done := make(chan struct{})
	finish := func() { once.Do(func() { close(done) }) }

	go func() {
		_, _ = io.Copy(conn, in)

		// The assistant closed its end: tell the app, and keep reading its last answers.
		if half, ok := conn.(interface{ CloseWrite() error }); ok {
			_ = half.CloseWrite()
		} else {
			finish()
		}
	}()

	go func() {
		_, _ = io.Copy(out, conn)
		finish()
	}()

	<-done

	return nil
}

// reach connects to the app, starting it once if no one is listening.
func reach(dataFolder string, start func() (func(), error)) (net.Conn, error) {
	if conn, err := dial(dataFolder); err == nil {
		return conn, nil
	}

	reached, err := start()
	if err != nil {
		return nil, err
	}
	defer reached()

	deadline := time.Now().Add(startWait)

	for time.Now().Before(deadline) {
		if conn, err := dial(dataFolder); err == nil {
			return conn, nil
		}

		time.Sleep(200 * time.Millisecond)
	}

	return nil, errors.New(appconfig.Current().Name + " didn't start in time. Open it, then try again.")
}
