/**
 * The document store: the document in hand and everything that happens to it.
 *
 * Editing, undo, saving to the library or a file, opening, the autosaved draft, and the
 * library's list and Recently removed all live here, so the close guard and autosave
 * have one place to ask whether anything is unsaved.
 *
 * The document is an immutable value. An unchanged document keeps the same object, so
 * "unsaved" is one identity check, and undoing back to the saved point makes the
 * session clean again for free.
 */

import {create} from 'zustand'
import {DocumentFileError, parseAnyDocument, serializeDocument, untitled, type DocumentType} from '../core/document/document-file'
import {EMPTY_HISTORY, pushHistory, redo as redoHistory, undo as undoHistory, type History} from '../core/history/history'
import {openDocumentFile, saveDocumentFile} from '../platform/desktop'
import {clearDraftText, readDraftText, writeDraftText} from '../platform/draft'
import {
    copyDocumentPicture,
    forgetRemovedDocument,
    listDocuments,
    listRemovedDocuments,
    newDocumentId,
    putBackDocument,
    readDocument,
    removeDocument,
    showDocumentFile,
    writeDocument,
    type RemovedDocument,
    type SavedDocument,
} from '../platform/documents'
import {defaultType, DOCUMENT_TYPES, libraryCount, libraryWords, typeOfKind, type Content} from './document-types'

export type {Content}

/** The type of the document in hand. */
export const typeInHand = (state: Pick<DocumentStore, 'kind'>): DocumentType<Content> => typeOfKind(state.kind) ?? defaultType()

/** The document an older app's file becomes, and its type, or null when no type knows it. */
function adoptedFrom(text: string): {name: string; content: Content; kind: string} | null {
    try {
        const raw: unknown = JSON.parse(text)

        // A file of this app's own goes through the usual checks instead.
        if (typeof raw === 'object' && raw !== null && 'generator' in raw) {
            return null
        }

        for (const type of DOCUMENT_TYPES) {
            const adopted = type.adopt?.(raw)

            // The result must pass the same checks as any file.
            if (adopted) {
                return {name: adopted.name, content: type.content.parse(adopted.content), kind: type.kind}
            }
        }

        return null
    } catch {
        return null
    }
}

/** Which screen is showing. Home and the library show no document, so editing commands sleep there. */
export type Page = 'home' | 'documents' | 'editor'

/** True on the pages without a document on screen. */
export const isHomePage = (page: Page): boolean => page !== 'editor'

/** A short message, with an action when there's something to do about it. */
export interface Toast {
    readonly message: string
    /** Set when the message offers Undo, which runs the store's undo. */
    readonly undoable: boolean
    /** Where some files were written, so the message can take you there. */
    readonly folder?: string
    /** A button of its own, such as putting something back. */
    readonly action?: ToastAction
}

export interface ToastAction {
    readonly label: string
    readonly run: () => void
}

/** What the save prompt is asking for. */
export interface SavePrompt {
    readonly title: string
    /** The name offered, and the fallback if the field is left blank. */
    readonly name: string
    readonly asCopy: boolean
}

type Action = 'save' | 'open' | 'read' | 'delete'

function describeFailure(error: unknown, action: Action): string {
    if (error instanceof DocumentFileError) {
        return error.message
    }

    const detail = error instanceof Error ? error.message : String(error)

    return `Couldn't ${action} the file. ${detail}`
}

function fileNameOf(path: string): string {
    const parts = path.split(/[\\/]/)

    return parts[parts.length - 1] || path
}

/** "Shopping", or "3 notes". */
const namesLabel = (names: readonly string[]): string => (names.length === 1 ? `"${names[0]}"` : libraryCount(names.length))

/** A listed document's name, or the name its type gives one with none. */
const nameIn = (documents: readonly SavedDocument[], id: string): string => {
    const document = documents.find((candidate) => candidate.id === id)

    return document?.name ?? untitled(typeOfKind(document?.kind ?? null) ?? defaultType())
}

/** A name not already in the library. "Shopping" becomes "Shopping 2". */
function copyNameOf(base: string, documents: readonly SavedDocument[]): string {
    const taken = new Set(documents.map((document) => document.name))

    if (!taken.has(base)) {
        return base
    }

    let count = 2

    while (taken.has(`${base} ${count}`)) {
        count += 1
    }

    return `${base} ${count}`
}

/** Count listings, so one that finishes late can't replace a newer one. */
let documentListings = 0
let removedListings = 0

/** The open document's id while it sits in Recently removed, so putting it back reconnects it. */
let openDocumentRemoved: string | null = null

export interface DocumentStore {
    /** The type of the document in hand, as its file's `kind`. */
    kind: string
    content: Content
    /** The content as it was last saved. Compared by identity. */
    savedContent: Content
    history: History<Content>
    /** What the user calls this document. */
    name: string
    /** The library entry this document is, once it has been saved there. */
    currentId: string | null
    /** Where it was last opened from or saved to on disk, outside the library. */
    filePath: string | null
    /** Keys an older build should write back untouched. */
    extras: Readonly<Record<string, unknown>>
    /** True once a document has been started or opened this session, so there's one to go back to. */
    documentInHand: boolean

    /** Changes the content as one step to undo. Returning the same content does nothing. */
    edit(label: string, update: (content: Content) => Content): void
    /** Changes the content without a step to undo, as while typing. `commitEdit` records the step. */
    previewEdit(content: Content): void
    /** Records everything since `before` as one step to undo. */
    commitEdit(label: string, before: Content): void
    undo(): void
    redo(): void
    setName(name: string): void

    page: Page
    showHome(): void
    showDocuments(): void
    showEditor(): void
    /**
     * Starts a new, unsaved document of a type, the default one when none is given: empty,
     * or from the content given. Ask before calling this over unsaved work.
     */
    startNew(content?: Content, kind?: string): void

    announcement: string
    toast: Toast | null
    dismissToast(): void
    /** Says something that needs no answer, such as where a file was written. */
    notify(message: string, folder?: string, action?: ToastAction): void

    /** Saves to the library. A new document, or a copy, asks for a name first. */
    save(asCopy?: boolean): Promise<void>
    savePrompt: SavePrompt | null
    /** Saves with the name chosen. A blank name keeps the suggestion. */
    finishSave(name: string): Promise<void>
    cancelSave(): void
    /** Writes the document to a file the user picks. */
    saveToFile(): Promise<void>
    /** Opens a document file the user picks. */
    openFromFile(): Promise<void>

    /** Every saved document, newest first. */
    documents: readonly SavedDocument[]
    documentsLoading: boolean
    refreshDocuments(): Promise<void>
    /** The document picked on the library page, whose details show beside the list. */
    pickedId: string | null
    pick(id: string | null): void
    open(id: string): Promise<void>
    rename(id: string, name: string): Promise<void>
    /** Saves a copy without opening it, and picks the copy. */
    copy(id: string): Promise<void>
    showFile(id: string): Promise<void>
    /** Moves documents to Recently removed, with Undo in the message. */
    remove(ids: readonly string[]): Promise<void>
    putBack(ids: readonly string[]): Promise<void>
    forget(id: string): Promise<void>
    forgetAllRemoved(): Promise<void>
    removed: readonly RemovedDocument[]
    refreshRemoved(): Promise<void>

    /** True when there is a draft on disk worth offering back. */
    draftAvailable: boolean
    refreshDraft(): Promise<void>
    /** Writes the document as the draft, or clears the draft when nothing is unsaved. */
    flushDraft(): Promise<void>
    restoreDraft(): Promise<void>
    discardDraft(): Promise<void>
}

/** True when closing would lose something that was never saved. */
export function hasUnsavedChanges(state: Pick<DocumentStore, 'content' | 'savedContent'>): boolean {
    return state.content !== state.savedContent
}

export const useDocumentStore = create<DocumentStore>((set, get) => {
    const fail = (error: unknown, action: Action) => set({toast: {message: describeFailure(error, action), undoable: false}})

    /** Records the content as saved, and drops the draft with it. */
    const markSaved = (content: Content) => {
        set({savedContent: content, draftAvailable: false})
        void clearDraftText().catch(() => undefined)
    }

    /** Puts a loaded document in hand, with nothing to undo. */
    const take = (content: Content, fields: Partial<DocumentStore>) =>
        set({
            content,
            savedContent: content,
            history: EMPTY_HISTORY,
            page: 'editor',
            documentInHand: true,
            filePath: null,
            ...fields,
        })

    const textOf = (state: DocumentStore, name = state.name, extras = state.extras) =>
        serializeDocument({name, content: state.content, extras}, typeInHand(state))

    /** The one write to the library, so every save records the same things. */
    const saveNow = async (name: string, asCopy: boolean) => {
        const state = get()
        const copy = asCopy || state.currentId === null
        const id = copy ? newDocumentId() : (state.currentId as string)
        const extras = {...state.extras}

        // A copy is a new document, made now.
        if (copy) {
            delete extras.createdAt
        }

        try {
            // A picture that can't be made only costs the library its preview.
            const picture = (await typeInHand(state).thumbnail?.(state.content).catch(() => null)) ?? null

            await writeDocument(id, textOf(state, name, extras), picture)

            set({currentId: id, name, extras, toast: {message: `Saved "${name}"`, undoable: false}})
            markSaved(state.content)
            await get().refreshDocuments()
        } catch (error) {
            fail(error, 'save')
        }
    }

    const initial = defaultType().empty()

    return {
        kind: defaultType().kind,
        content: initial,
        savedContent: initial,
        history: EMPTY_HISTORY,
        name: untitled(defaultType()),
        currentId: null,
        filePath: null,
        extras: {},
        documentInHand: false,

        edit: (label, update) => {
            const before = get().content
            const content = update(before)

            if (content !== before) {
                set({content, history: pushHistory(get().history, label, before, content)})
            }
        },

        previewEdit: (content) => set({content}),

        commitEdit: (label, before) => {
            const {content, history} = get()

            if (content !== before) {
                set({history: pushHistory(history, label, before, content)})
            }
        },

        undo: () => {
            const result = undoHistory(get().history)

            if (result) {
                set({content: result.document, history: result.history})
            }
        },

        redo: () => {
            const result = redoHistory(get().history)

            if (result) {
                set({content: result.document, history: result.history})
            }
        },

        setName: (name) => set({name}),

        page: 'home',
        showHome: () => set({page: 'home'}),
        showDocuments: () => set({page: 'documents'}),
        showEditor: () => set({page: 'editor'}),

        startNew: (content, kind = defaultType().kind) => {
            const type = typeOfKind(kind) ?? defaultType()

            take(content ?? type.empty(), {kind: type.kind, name: untitled(type), currentId: null, extras: {}})
        },

        announcement: '',
        toast: null,
        dismissToast: () => set({toast: null}),
        notify: (message, folder, action) => set({toast: {message, undoable: false, folder, action}}),

        save: async (asCopy) => {
            const state = get()

            // Only a save that needs a name asks for one. Saving a named document again
            // shouldn't interrupt you.
            if (asCopy === true || state.currentId === null) {
                set({
                    savePrompt: {
                        title: asCopy === true ? 'Save a copy' : `Name your ${typeInHand(state).noun}`,
                        name: copyNameOf(state.name, state.documents),
                        asCopy: true,
                    },
                })

                return
            }

            await saveNow(state.name, false)
        },

        savePrompt: null,

        finishSave: async (name) => {
            const prompt = get().savePrompt
            const chosen = name.trim()

            set({savePrompt: null})
            await saveNow(chosen === '' ? (prompt?.name ?? get().name) : chosen, prompt?.asCopy ?? true)
        },

        cancelSave: () => set({savePrompt: null}),

        saveToFile: async () => {
            const state = get()

            try {
                const path = await saveDocumentFile(textOf(state), null, `${state.name}.json`, `Save ${typeInHand(state).noun}`)

                if (path) {
                    markSaved(state.content)
                    set({filePath: path, toast: {message: `Saved ${fileNameOf(path)}`, undoable: false}})
                }
            } catch (error) {
                fail(error, 'save')
            }
        },

        openFromFile: async () => {
            try {
                const opened = await openDocumentFile(`Open a ${libraryWords().noun}`)

                if (!opened) {
                    return
                }

                // A file from an older app comes in as a new document, never saved over.
                const adopted = adoptedFrom(opened.text)

                if (adopted) {
                    take(adopted.content, {
                        kind: adopted.kind,
                        name: adopted.name,
                        currentId: null,
                        filePath: null,
                        extras: {},
                        toast: {message: `Brought in ${fileNameOf(opened.path)}. Save it to keep it.`, undoable: false},
                    })
                    return
                }

                // Parsing throws before anything is set, so a bad file leaves the session as it was.
                const loaded = parseAnyDocument(opened.text, DOCUMENT_TYPES)

                take(loaded.content, {
                    kind: loaded.type.kind,
                    name: loaded.name,
                    // A file chosen from disk isn't a library entry.
                    currentId: null,
                    filePath: opened.path,
                    extras: loaded.extras,
                    toast: {message: `Opened ${fileNameOf(opened.path)}`, undoable: false},
                })
            } catch (error) {
                fail(error, 'open')
            }
        },

        documents: [],
        documentsLoading: false,

        refreshDocuments: async () => {
            const asked = ++documentListings

            set({documentsLoading: true})

            try {
                const documents = await listDocuments()

                if (asked === documentListings) {
                    set({documents, documentsLoading: false})
                }
            } catch (error) {
                if (asked === documentListings) {
                    set({documentsLoading: false})
                    fail(error, 'read')
                }
            }
        },

        pickedId: null,
        pick: (id) => set({pickedId: id}),

        open: async (id) => {
            try {
                const loaded = parseAnyDocument(await readDocument(id), DOCUMENT_TYPES)

                take(loaded.content, {
                    kind: loaded.type.kind,
                    name: loaded.name,
                    currentId: id,
                    extras: loaded.extras,
                    toast: {message: `Opened "${loaded.name}"`, undoable: false},
                })
                markSaved(loaded.content)
            } catch (error) {
                fail(error, 'open')
            }
        },

        rename: async (id, name) => {
            const chosen = name.trim()

            if (chosen === '') {
                return
            }

            try {
                const loaded = parseAnyDocument(await readDocument(id), DOCUMENT_TYPES)

                // No picture: the library keeps the one it has.
                await writeDocument(id, serializeDocument({...loaded, name: chosen}, loaded.type), null)

                set({
                    ...(get().currentId === id ? {name: chosen} : {}),
                    toast: {message: `Renamed to "${chosen}"`, undoable: false},
                })
                await get().refreshDocuments()
            } catch (error) {
                fail(error, 'save')
            }
        },

        copy: async (id) => {
            try {
                const loaded = parseAnyDocument(await readDocument(id), DOCUMENT_TYPES)
                const name = copyNameOf(`${loaded.name} copy`, get().documents)
                const copyId = newDocumentId()
                // A copy is a new document, made now, so it doesn't keep the original's date.
                const extras = {...loaded.extras}

                delete extras.createdAt

                await writeDocument(copyId, serializeDocument({name, content: loaded.content, extras}, loaded.type), null)
                await copyDocumentPicture(id, copyId)

                set({pickedId: copyId, toast: {message: `Copied as "${name}"`, undoable: false}})
                await get().refreshDocuments()
            } catch (error) {
                fail(error, 'save')
            }
        },

        showFile: async (id) => {
            try {
                await showDocumentFile(id)
            } catch (error) {
                fail(error, 'read')
            }
        },

        remove: async (ids) => {
            const state = get()
            const names = ids.map((id) => nameIn(state.documents, id))
            const removed: string[] = []

            try {
                for (const id of ids) {
                    await removeDocument(id)
                    removed.push(id)
                }
            } catch (error) {
                fail(error, 'delete')
            }

            if (removed.length === 0) {
                return
            }

            const openRemoved = state.currentId !== null && removed.includes(state.currentId)

            if (openRemoved) {
                openDocumentRemoved = state.currentId
            }

            set({
                currentId: openRemoved ? null : state.currentId,
                pickedId: state.pickedId !== null && removed.includes(state.pickedId) ? null : state.pickedId,
                ...(removed.length === ids.length
                    ? {
                          toast: {
                              message: `Removed ${namesLabel(names)}`,
                              undoable: false,
                              action: {label: 'Undo', run: () => void get().putBack(removed)},
                          },
                      }
                    : {}),
            })

            await Promise.all([get().refreshDocuments(), get().refreshRemoved()])
        },

        putBack: async (ids) => {
            try {
                for (const id of ids) {
                    await putBackDocument(id)

                    if (openDocumentRemoved === id && get().currentId === null) {
                        set({currentId: id})
                        openDocumentRemoved = null
                    }
                }

                const names = ids.map((id) => nameIn(get().removed, id))

                // Picked again, so Undo leaves the page as it was before the removal.
                set({pickedId: ids[0], toast: {message: `Put back ${namesLabel(names)}`, undoable: false}})
            } catch {
                set({
                    toast: {
                        message: `Couldn't put that ${libraryWords().noun} back. A saved one may already use its place, or its file was moved.`,
                        undoable: false,
                    },
                })
            }

            await Promise.all([get().refreshDocuments(), get().refreshRemoved()])
        },

        forget: async (id) => {
            try {
                await forgetRemovedDocument(id)
                await get().refreshRemoved()
            } catch (error) {
                fail(error, 'delete')
            }
        },

        forgetAllRemoved: async () => {
            const count = get().removed.length

            try {
                for (const document of get().removed) {
                    await forgetRemovedDocument(document.id)
                }

                set({toast: {message: `Forgot ${libraryCount(count)}`, undoable: false}})
            } catch (error) {
                fail(error, 'delete')
            }

            await get().refreshRemoved()
        },

        removed: [],

        refreshRemoved: async () => {
            const asked = ++removedListings

            try {
                const removed = await listRemovedDocuments()

                if (asked === removedListings) {
                    set({removed})
                }
            } catch {
                if (asked === removedListings) {
                    set({removed: []})
                }
            }
        },

        draftAvailable: false,

        refreshDraft: async () => {
            try {
                set({draftAvailable: (await readDraftText()) !== null})
            } catch {
                set({draftAvailable: false})
            }
        },

        flushDraft: async () => {
            const state = get()

            try {
                if (!hasUnsavedChanges(state)) {
                    await clearDraftText()
                    set({draftAvailable: false})
                    return
                }

                await writeDraftText(JSON.stringify({documentId: state.currentId, text: textOf(state)}))
                set({draftAvailable: true})
            } catch {
                // A draft that can't be written isn't worth a message mid-edit: the next change tries again.
            }
        },

        restoreDraft: async () => {
            try {
                const raw = await readDraftText()
                const stored = raw ? (JSON.parse(raw) as {documentId?: unknown; text?: unknown}) : null

                if (!stored || typeof stored.text !== 'string') {
                    set({draftAvailable: false})
                    return
                }

                const loaded = parseAnyDocument(stored.text, DOCUMENT_TYPES)
                const id = typeof stored.documentId === 'string' ? stored.documentId : null

                // Unsaved, so the saved content is left as it was: closing again still asks.
                set({
                    kind: loaded.type.kind,
                    content: loaded.content,
                    history: EMPTY_HISTORY,
                    name: loaded.name,
                    // Only claim the library entry if it still exists.
                    currentId: get().documents.some((document) => document.id === id) ? id : null,
                    extras: loaded.extras,
                    filePath: null,
                    draftAvailable: false,
                    page: 'editor',
                    documentInHand: true,
                    toast: {message: 'Picked up where you left off', undoable: false},
                })
            } catch (error) {
                fail(error, 'open')
            }
        },

        discardDraft: async () => {
            try {
                await clearDraftText()
            } finally {
                set({draftAvailable: false})
            }
        },
    }
})
