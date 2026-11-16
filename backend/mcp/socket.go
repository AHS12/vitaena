package mcp

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"sync"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// onIdle calls idle with the number of assistants connected whenever one connects
// or leaves.
func (s *Service) onIdle(idle func(connections int)) {
	s.mu.Lock()
	s.idle = idle
	s.mu.Unlock()
}

// listen opens the socket, or the named pipe on Windows, once. Another copy of
// the app already listening, such as an installed one beside a development build,
// keeps it.
func (s *Service) listen() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.listening {
		return nil
	}

	folder, err := s.shell.DataFolder()
	if err != nil {
		return err
	}

	if err := os.MkdirAll(folder, 0o700); err != nil {
		return fmt.Errorf("cannot make the data folder: %w", err)
	}

	listener, err := listenAt(folder)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	s.listening = true
	s.closeSock = func() {
		cancel()
		_ = listener.Close()
	}

	go s.accept(ctx, listener)

	return nil
}

func (s *Service) accept(ctx context.Context, listener net.Listener) {
	for {
		conn, err := listener.Accept()
		if err != nil {
			if ctx.Err() == nil {
				log.Printf("mcp: %v", err)
			}

			return
		}

		go s.serve(ctx, conn)
	}
}

// serve speaks MCP with one assistant until it leaves.
func (s *Service) serve(ctx context.Context, conn net.Conn) {
	defer conn.Close()

	s.connected(1)
	defer s.connected(-1)

	session, err := s.server.Connect(ctx, &mcp.IOTransport{Reader: conn, Writer: conn}, nil)
	if err != nil {
		log.Printf("mcp: %v", err)
		return
	}

	_ = session.Wait()
}

func (s *Service) connected(change int) {
	s.mu.Lock()
	s.connections += change
	connections, idle := s.connections, s.idle
	s.mu.Unlock()

	if idle != nil {
		idle(connections)
	}
}

// idleQuit is how long an app started only for assistants waits, with none
// connected, before quitting.
const idleQuit = 5 * time.Minute

// QuitWhenIdle calls quit once no assistant has been connected for a while, as long
// as stillBackground says the window was never shown. It is a function rather than
// a method so Wails doesn't offer it to the interface.
func QuitWhenIdle(s *Service, stillBackground func() bool, quit func()) {
	var mu sync.Mutex

	check := func() {
		if stillBackground() {
			quit()
		}
	}
	timer := time.AfterFunc(idleQuit, check)

	s.onIdle(func(connections int) {
		mu.Lock()
		defer mu.Unlock()

		timer.Stop()

		if connections == 0 {
			timer = time.AfterFunc(idleQuit, check)
		}
	})
}
