package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"runtime"
	"slices"
	"strings"

	"vitaena/appconfig"
	"vitaena/backend"
	"vitaena/backend/backup"
	"vitaena/backend/documents"
	"vitaena/backend/export"
	"vitaena/backend/fonts"
	"vitaena/backend/mcp"
	"vitaena/backend/secrets"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	identity := appconfig.Current()
	service := backend.NewApp()
	shell := backend.ShellOf(service)

	// An AI assistant starts `vitaena mcp` and talks to it over stdin and stdout.
	// It only relays to the running app, so it never opens a window of its own.
	if len(os.Args) > 1 && os.Args[1] == mcp.Arg {
		os.Exit(mcp.RunRelay(shell, backend.BackgroundArg))
	}

	background := slices.Contains(os.Args[1:], backend.BackgroundArg) || mcp.StartedForAssistant()
	if background {
		backend.StartInBackground(service)
	}

	library := documents.New(shell)
	// Fonts the person adds sit beside their documents, so backups carry them.
	addedFonts := fonts.New(library.LibraryFolder)

	// Each optional feature is a service of its own, in its own folder. Leaving
	// one out means deleting its lines here and its folders: see
	// docs/removing-features.md.
	backups := backup.New(shell, library, secrets.Keychain{})
	exports := export.New()
	assistants := mcp.New(shell)

	// Pictures are served from disk, not from the build, longest address first.
	pictures := []pictureRoute{
		{backup.HeldPicturePrefix, backup.HeldPictureHandler(backups)},
		{documents.PicturePathPrefix, documents.PictureHandler(library)},
	}

	dist, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}

	app := application.New(application.Options{
		Name:        identity.Name,
		Description: identity.Description,
		Services: []application.Service{
			application.NewService(service),
			application.NewService(library),
			application.NewService(addedFonts),
			application.NewService(backups),
			application.NewService(exports),
			application.NewService(assistants),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(dist),
			Middleware: func(next http.Handler) http.Handler {
				return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
					for _, route := range pictures {
						if strings.HasPrefix(request.URL.Path, route.prefix) {
							route.handler.ServeHTTP(writer, request)
							return
						}
					}

					next.ServeHTTP(writer, request)
				})
			},
		},
		ShouldQuit: backend.QuitGuard(service),
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID:               singleInstanceID(identity),
			OnSecondInstanceLaunch: backend.SecondLaunch(service),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
		Windows: application.WindowsOptions{
			AdditionalBrowserArgs: browserArgs(),
		},
		// The desktop matches this id to the menu entry, installed as <bundle id>.desktop,
		// to show the window's icon and name in the dock.
		Linux: application.LinuxOptions{
			ApplicationID: identity.BundleID,
		},
	})

	backend.OpenWindow(service, app, application.WebviewWindowOptions{
		Title:     identity.Name,
		MinWidth:  backend.MinWindowWidth,
		MinHeight: backend.MinWindowHeight,
		// On Windows the menu bar is the title bar, as in other modern desktop editors.
		// A Mac keeps its own window buttons, drawn over the bar by the inset title bar.
		// Linux keeps the system's title bar: GNOME and KDE draw their own, and a
		// frameless window there can't always be resized from its edges.
		Frameless:        runtime.GOOS == "windows",
		BackgroundColour: application.NewRGB(24, 25, 27),
		Mac: application.MacWindow{
			TitleBar: application.MacTitleBarHiddenInset,
		},
		Windows: application.WindowsWindow{
			Theme: application.SystemDefault,
		},
	})

	// Where there's no tray to quit it from, an app started for assistants quits
	// once none has been connected for a while, unless its window was shown.
	if background && !backend.HasTray() {
		mcp.QuitWhenIdle(assistants, func() bool { return backend.InBackground(service) }, app.Quit)
	}

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

// singleInstanceID names the running app, so a second launch finds it. A
// development build gets its own name, so it opens next to an installed copy
// rather than bringing that copy forward.
func singleInstanceID(identity appconfig.Config) string {
	if os.Getenv("FRONTEND_DEVSERVER_URL") != "" {
		return identity.BundleID + ".dev"
	}

	return identity.BundleID
}

// pictureRoute sends requests under prefix to a feature's picture handler.
type pictureRoute struct {
	prefix  string
	handler http.Handler
}
