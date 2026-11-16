# Words on screen

Everything the app shows follows these rules: labels, buttons, tooltips, messages,
settings and the changelog.

## Plain words

Write for someone who has never seen the app and doesn't know how it's built. Name things
by what a person does with them, not by how they work.

| Technical term | People see | Notes |
|---|---|---|
| Document, file, record | **CV** | The type's `noun` in code, so the word lives in one place. **Resume** only where a template suits one |
| Marriage profile, matrimonial CV | **Biodata** | The same in the singular and the plural: "a biodata", "3 biodata" |
| Documents of several types | **Documents** | Only once the app makes more than one type; `libraryWords()` says which. Each is then marked with its type |
| Library, data folder | **Your documents** | The page; **Where your work is saved** in Settings. **Your CVs** while the app makes only CVs |
| ATS, applicant tracking system, parser | **Screening system** | **ATS** only in **One column (ATS)** and **ATS mode**, where job ads have taught people the word |
| Render, compile, Typst | *(never shown)* | The **page**, the **preview** |
| Proficiency, rating | **Level** | Five dots, with a word such as **Native** beside them |
| Trash, bin, soft delete | **Recently removed** | Kept 30 days. **Remove** moves something there; **Remove for good** is the only thing that can't be undone |
| Delete | **Remove** | |
| Duplicate | **Copy** | |
| Draft, autosave, crash recovery | **You left some work unsaved** / **Pick up where I left off** | |
| Dirty, unsaved changes | **Unsaved** | A dot beside the name in the title bar |
| Backup archive, zip | **Backup** | "A backup is one .zip file…" is fine where the file is the point |
| Restore, import | **Restore** / **Bring back** | For a backup. A CV from a PDF or Word file is **imported** |
| Parse, convert, extract a PDF or .docx | **Import a CV** / **Make a CV from** | Lines it can't place go to **Not sorted** |
| S3, bucket, endpoint | **Cloud backup**, **Bucket**, **Storage address** | Only in cloud setup, where people bring these words with them |
| Credentials, secret key | **Keys** | The secret is never shown again once saved |
| Command palette | **Search or run** | |
| MCP, MCP server, agent, LLM, tool call | **AI assistants** | The setting. An assistant is the person's own, such as Claude or Copilot; the app itself has no AI |
| Keybinding, hotkey | **Shortcut** / **Keys** | |
| JSON, schema, version mismatch | *(never shown)* | "Made by a newer version of the app. Update it to open this." |
| Bindings, service, IPC | *(never shown)* | |

## Button voice

One verb per button. The verb names the outcome.

| Don't write | Write |
|---|---|
| OK | Name the outcome: **Save**, **Export**, **Got it** |
| Apply | What it does: **Rename**, **Restore 2 CVs** |
| Confirm | **Remove for good**, **Replace** |
| Submit | **Save**, **Open GitHub** |
| Reset | **Restore default**, **Reset this page** |
| Yes / No | The two outcomes: **Replace** / **Keep them** |

A button that starts a dialog ends with an ellipsis: **Export…**, **Save a copy…**.

## Error voice

A message says what didn't happen, why if it's known, and what to do next. The person is
never blamed, and nothing technical is shown unless it helps them act.

> "Couldn't back up to D:\Backups: the folder isn't there. Plug the drive in, or choose
> another folder in Settings, Backup."

## Sentences

- Short sentences, in the second person: "Your work is saved", not "The work has been saved".
- Sentence case everywhere: **Recently removed**, not **Recently Removed**.
- No exclamation marks, no "simply" or "just", no "please" in labels.
- Numbers as digits: "3 CVs", "Removed 2 CVs".
