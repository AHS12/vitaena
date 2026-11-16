# Vitaena

A desktop CV and resume builder for Windows, macOS and Linux: Wails 3 (Go) for the window,
files, tray, backups and updates; React and TypeScript for everything else; Typst (compiled
to WebAssembly) lays out the pages for both the preview and the PDF. Built from
wails-desktop-template.
Plans live in `specs/` (such as `specs/REWORK_PLAN.md` and `specs/LINUX_PLAN.md`). Git
ignores that folder, so it exists only on the owner's machine; never link to it from
published files.

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Its rules apply to you, and this file only
adds what an agent needs on top of them.

## Commands

Run these from the repository root. On Windows, `make` uses Git Bash.

| Command | Does |
|---|---|
| `make check` | Every lint, test and build check. Run this before calling work done |
| `make lint` | TypeScript types, ESLint, golangci-lint |
| `make test-frontend` | Vitest, using Node 22 fetched by `pnpm dlx` |
| `make test-go` | Go tests |
| `make web` | The interface alone, in a browser |
| `make dev` | The desktop app with hot reload |
| `make version V=1.2.3` | Set the version everywhere |
| `make rename NAME=… ID=… BUNDLE=… REPO=…` | Rename the app everywhere |

To run one test file:

```bash
cd frontend && pnpm dlx node@22 node_modules/vitest/vitest.mjs run src/core/history/history.test.ts
```

The hooks run lint on commit and all tests on push. Don't skip them with `--no-verify`.
Commit or push only when asked. Work on `dev`, and don't touch `main`.

## How the code is arranged

- `appconfig/app.config.json` is who the app is. Go embeds it, the frontend imports it, and
  `tools/appinfo` keeps the build files in step. Never write the app's name or id anywhere
  else: use `appconfig.Current()` in Go and `APP` from `core/app.ts` in TypeScript.
- `backend/` is the core Wails service. Each other folder in it is a service of its own,
  registered in `main.go`. A service gets the data folder and a way to send events through
  `backend.Shell`, so its tests need no app.
- The frontend reaches Go only through `frontend/src/platform`. `platform/shell.ts` calls
  each Go method by name on one of the services in `SERVICES`, so there are no generated
  bindings. In tests, `fakeDesktop` stands in for every service at once.
- `frontend/src/core` is pure: ESLint rejects React, Zustand, the platform and features
  there.
- `frontend/src/features/*` are optional. Nothing outside `features/` may import one;
  each adds to the shell through the `Feature` contract in `shell/feature.ts`, and is
  listed in `features/index.ts`. [Removing a feature](docs/removing-features.md) has the
  steps, and they're tested.
- `frontend/src/cv` is the CV: its document type (`cv.ts`), the render model a template
  is given (`render-model.ts`), the Typst engine (`typst/engine.ts`), templates
  (`templates/*.typ`), export formats and tours. Every template must pass
  `templates/ats.typst.test.ts`, which reads the PDF back the way an ATS does. It also holds
  what every type made of sections shares: the section schemas (`sections.ts`), the
  editor's section panels, the preview (`PagePreview.tsx`) and the design pane's parts.
- `frontend/src/biodata` is the biodata: its document type, render model, editor,
  templates (`templates/*.typ`, read back by `templates/templates.typst.test.ts`) and export
  formats. `store/document-types.ts` lists the types of document; a file's `kind` picks
  its type, the store keeps the open document's `kind`, and the app shows that type's
  editor.
- `frontend/src/cv/import` makes a CV or a biodata from a PDF or Word file, by rules: the
  readers (`read-pdf.ts`, `read-docx.ts`) give lines with their look, and `parse.ts` and
  `biodata-parse.ts` make the document. It's tested on every template's own PDF and on
  CVs from other apps in `fixtures/` (`make import-fixtures` rebuilds them).
- AI assistants reach the app over MCP. An assistant starts `vitaena mcp`, which only
  relays stdin and stdout to the running app (a named pipe on Windows, a socket in the
  data folder elsewhere), starting it in the background if it's closed. `backend/mcp`
  speaks the protocol; the tools themselves are in `frontend/src/features/mcp` and run
  the app's own code. On Windows, assistants installed as packages (Claude Desktop) see
  a private copy of AppData, which is why the pipe and the start through Explorer exist:
  read `backend/mcp/socket_windows.go` before changing either. Set
  `VITAENA_MCP_BINARY` to a built app to run its end-to-end test.
- A test that lays pages out with Typst is named `*.typst.test.ts`: each starts a
  compiler with every font, so `vitest.config.ts` runs only two of them at a time.
- `build/` holds each system's build files; [build/README.md](build/README.md) says which
  are written from `app.config.json`. Linux packages (deb, rpm, Arch, AppImage) come from
  `build/linux`. On a pull request, **CI** (`ci.yml`) runs the tests, the Go ones on all
  three systems, then the **Windows**, **macOS** and **Linux Test Build** workflows,
  which only build, install on a clean runner and start the app, since only Windows is
  used day to day; Windows and macOS also reach it with `vitaena mcp`
  (`.github/scripts/mcp-smoke.sh`).
- The document store is the source of truth for the document in hand. Documents are
  immutable values: an unchanged document keeps the same object, so "unsaved" is an
  identity check.

## Rules that are easy to break

- **Document files:** if a document type's content changes shape, raise its `version`
  and add a migration from the old one. Files people have saved must keep opening.
- **Words on screen:** follow [docs/terminology.md](docs/terminology.md). Labels,
  tooltips and the changelog are written in plain language.
- **Sizes:** a postcss step in `vite.config.ts` turns stylesheet pixels into rems, and the
  interface scale sets the root font size. In code, use `rem` or `uiScale()`, never CSS zoom.
- **Styles:** each area has its own file in `src/styles`, and a feature or the CV
  imports its own from its folder.
- **Long work:** use `afterPaint()` or `yieldIfBusy()` from `core/yield.ts`, so progress
  can draw before slow work blocks the page.
- **Licensing:** add no downloaded assets or copied code.
- **Systems:** Go files ending in `_windows.go`, `_darwin.go` or `_linux.go` build only on
  that system, so code every system calls goes in a file without one. On Linux the window
  keeps the system's title bar and there is no tray (GNOME shows none); `isLinux()` and
  `hasTray()` in `platform/window.ts`, and `hasTray()` in `backend/tray.go`, decide it.
- **Updates:** the app finds updates by the release file names in `backend/update.go`,
  `update_mac.go` and `update_appimage.go`. Change them only with
  `.github/workflows/release.yml`; a test compares the two.

## Style

Match the code around you: four-space indent, no semicolons, single quotes, no spaces inside
import braces. Comments are few, and explain why rather than what. Test names read as plain
sentences about behavior. Tests sit beside the code they cover, or in `frontend/src/tests`.

## Reporting your work

Say what you ran and what you actually saw. A passing test doesn't show that a screen
looks right, so for visual work, look at it, and say so if you couldn't.

To drive the real desktop app from a script, start a development build with
`APP_DEBUG_PORT=9333`: WebView2 then listens for the Chrome DevTools protocol on that
port. Production builds never do.

## Skills

Task guides are in `.claude/skills/`. Read the matching one before starting:

- `try-in-browser`: run the interface and check a change by looking at it
- `release`: publish a new version
