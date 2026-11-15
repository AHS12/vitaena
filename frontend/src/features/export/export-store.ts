/**
 * Exporting: which dialog is open, the formats the app offers, and an export of many
 * documents while it runs.
 */

import {create} from 'zustand'
import {parseAnyDocument} from '../../core/document/document-file'
import {yieldIfBusy} from '../../core/yield'
import {readDocument} from '../../platform/documents'
import {type Content} from '../../store/document-store'
import {DOCUMENT_TYPES} from '../../store/document-types'
import {exportFiles, uniqueNames, type ExportFile, type ExportFormat} from './formats'
import {existingFiles, writeFiles} from './platform'

/** How far an export of many has got. It has `finished` once it has. */
export interface ExportRun {
    readonly done: number
    readonly total: number
    /** The document being exported now. */
    readonly current: string | null
    /** Names of the documents that couldn't be read or written. */
    readonly failed: readonly string[]
    readonly folder: string
    readonly finished: boolean
    readonly stopped: boolean
}

interface ExportStore {
    /** What each type of document can be exported to, by its `kind`, from the feature. */
    formats: Readonly<Record<string, readonly ExportFormat<Content>[]>>

    dialog: 'one' | 'many' | null
    /** The documents an export of many starts with ticked. */
    picked: readonly string[]
    openOne(): void
    openMany(picked?: readonly string[]): void
    close(): void

    run: ExportRun | null
    /** Exports each document, as the formats picked, into folder. */
    exportMany(documents: readonly {id: string; name: string}[], formats: readonly string[], folder: string): Promise<void>
    stop(): void
    clearRun(): void
}

/** A saved document to export. */
export interface ExportedDocument {
    readonly id: string
    readonly name: string
    /** Its file's `kind`, which says what it can be exported as. */
    readonly kind: string | null
}

/** The formats a type of document can be exported as. */
export const formatsOf = (kind: string | null): readonly ExportFormat<Content>[] => (kind === null ? [] : (useExportStore.getState().formats[kind] ?? []))

/** Every format any type offers, each once, so one choice covers documents of several types. */
export function everyFormat(formats: Readonly<Record<string, readonly ExportFormat<Content>[]>>): readonly ExportFormat<Content>[] {
    const seen = new Set<string>()

    return Object.values(formats)
        .flat()
        .filter((format) => !seen.has(format.id) && Boolean(seen.add(format.id)))
}

/** The formats picked that a document's type has. */
const pickedFor = (kind: string | null, formatIds: readonly string[]) => formatsOf(kind).filter((format) => formatIds.includes(format.id))

/** Set by Stop, and read between documents. Not state: nothing draws it. */
let stopping = false

export const useExportStore = create<ExportStore>((set) => ({
    formats: {},

    dialog: null,
    picked: [],
    openOne: () => set({dialog: 'one'}),
    openMany: (picked = []) => set({dialog: 'many', picked}),
    close: () => set({dialog: null}),

    run: null,

    exportMany: async (documents, formatIds, folder) => {
        const names = uniqueNames(documents.map((document) => document.name))
        const failed: string[] = []
        let done = 0

        stopping = false
        set({run: {done, total: documents.length, current: null, failed, folder, finished: false, stopped: false}})

        for (const [index, document] of documents.entries()) {
            if (stopping) {
                break
            }

            set({run: {done, total: documents.length, current: document.name, failed, folder, finished: false, stopped: false}})

            // Lets the progress draw before a long run of documents blocks the page.
            await yieldIfBusy()

            try {
                const loaded = parseAnyDocument(await readDocument(document.id), DOCUMENT_TYPES)
                const files: ExportFile[] = await exportFiles(pickedFor(loaded.type.kind, formatIds), names[index], loaded.content)

                await writeFiles(folder, files)
            } catch {
                failed.push(document.name)
            }

            done += 1
        }

        set({run: {done, total: documents.length, current: null, failed, folder, finished: true, stopped: stopping}})
    },

    stop: () => {
        stopping = true
    },

    clearRun: () => set({run: null}),
}))

/** The files an export of these documents would write that are in folder already. */
export async function filesAlreadyThere(documents: readonly ExportedDocument[], formatIds: readonly string[], folder: string): Promise<string[]> {
    const names = uniqueNames(documents.map((document) => document.name)).flatMap((name, index) =>
        pickedFor(documents[index].kind, formatIds).map((format) => `${name}${format.suffix ?? ''}.${format.extension}`),
    )

    return existingFiles(folder, names)
}
