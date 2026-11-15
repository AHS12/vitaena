# Vitaena

**A private, offline CV and resume builder for the desktop.** Everything stays on your
computer: no account, no cloud, no tracking, and no AI writing for you.

Vitaena 2 is a rework of the [web version](https://github.com/AHS12/vitaena/tree/v1-web) as a
desktop app. Pages are laid out by [Typst](https://typst.app), running inside the app, so
long CVs break across pages properly and the PDF matches the preview exactly. No browser
engine or server is needed to make a PDF.

Templates are tested the way an applicant tracking system reads them: each one is laid out,
its text is pulled back out of the PDF, and the test checks the reading order, contact
details and dates.

Work in progress: see [docs/REWORK_PLAN.md](docs/REWORK_PLAN.md).

## Developing

Needs Go 1.26, Node 20+, pnpm and the [Wails 3](https://v3.wails.io) CLI.

```bash
make install   # frontend packages and git hooks
make dev       # the desktop app with hot reload
make web       # the interface alone, in a browser
make check     # every lint, test and build check
```

[AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md) describe how the code is
arranged.

## Licence

MIT. The bundled Inter font is under the SIL Open Font License 1.1.
