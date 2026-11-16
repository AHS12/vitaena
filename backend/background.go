package backend

// BackgroundArg starts the app with no window, for an AI assistant: `vitaena mcp`
// starts it this way when it isn't running. The tray, where there is one, shows
// it's running and brings the window back.
const BackgroundArg = "--background"

// StartInBackground makes the window open hidden. main.go calls it before
// OpenWindow when the app was started with BackgroundArg. It is a function rather
// than a method so Wails doesn't offer it to the interface.
func StartInBackground(a *App) {
	a.mu.Lock()
	a.background = true
	a.mu.Unlock()
}

func (a *App) inBackground() bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	return a.background
}

// leaveBackground is called when the window is shown. From then on the app is an
// ordinary open app: the tray stays only if a setting wants it, and a window
// closed maximised is maximised again.
func (a *App) leaveBackground() {
	a.mu.Lock()
	was := a.background
	a.background = false
	maximise := was && a.openMaximised
	a.openMaximised = a.openMaximised && !maximise
	a.mu.Unlock()

	if !was {
		return
	}

	if maximise && a.window != nil {
		a.window.Maximise()
	}

	a.updateTray()
}

// HasTray reports whether this system shows tray icons. It is a function rather
// than a method so Wails doesn't offer it to the interface.
func HasTray() bool {
	return hasTray()
}

// InBackground reports whether the app is still running for assistants only,
// with its window never shown. It is a function rather than a method so Wails
// doesn't offer it to the interface.
func InBackground(a *App) bool {
	return a.inBackground()
}
