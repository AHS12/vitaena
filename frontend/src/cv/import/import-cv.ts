/**
 * Importing a CV from a PDF or a Word file: reading it with a dialog that shows how far it
 * has got, then opening the CV made from it as a new, unsaved document. The dialog reads
 * its state from here.
 */

import {create} from 'zustand'
import {squarePhoto} from '../../components/square-photo'
import {afterPaint} from '../../core/yield'
import {useDocumentStore} from '../../store/document-store'
import {biodataType, type Biodata} from '../../biodata/biodata'
import {cvType, type Cv} from '../cv'
import type {PdfPhoto} from './photo'

/** Where an import is: reading pages, making the CV, or stopped with something to say. */
export type ImportStep =
    | {readonly kind: 'reading'; readonly page: number; readonly pages: number}
    | {readonly kind: 'making'}
    | {readonly kind: 'no-text'}
    | {readonly kind: 'locked'}
    /** A Word file from before 2007, which only Word itself reads. */
    | {readonly kind: 'old-word'}
    | {readonly kind: 'failed'; readonly reason: string}

interface ImportState {
    /** The file's name while its dialog is open, or null. */
    readonly file: string | null
    readonly step: ImportStep
    cancel(): void
    close(): void
}

let running: AbortController | null = null

export const useCvImport = create<ImportState>()((set) => ({
    file: null,
    step: {kind: 'reading', page: 0, pages: 0},
    cancel: () => {
        running?.abort()
        running = null
        set({file: null})
    },
    close: () => set({file: null}),
}))

const fileNameOf = (path: string) => path.split(/[\\/]/).pop() ?? path

/** The photo from the PDF as the CV keeps one, or "" if it can't be drawn. */
function photoOf(photo: PdfPhoto | null | undefined): string {
    try {
        if (photo?.bitmap) {
            return squarePhoto(photo.bitmap, photo.width, photo.height)
        }

        if (photo?.rgba) {
            const canvas = document.createElement('canvas')

            canvas.width = photo.width
            canvas.height = photo.height
            canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(photo.rgba), photo.width, photo.height), 0, 0)

            return squarePhoto(canvas, photo.width, photo.height)
        }
    } catch {
        // A photo that can't be drawn is left out; the rest of the CV still comes in.
    }

    return ''
}

/** The photo added, in a template that shows one, as the PDF did. */
function withPhoto(cv: Cv, photo: string): Cv {
    if (!photo) {
        return cv
    }

    return {...cv, person: {...cv.person, photo}, design: {...cv.design, template: cv.design.template === 'modern' ? 'professional' : 'bold'}}
}

/** pdf.js says a PDF is locked or isn't one through the error's name. */
function stepFor(error: unknown): ImportStep {
    const name = error instanceof Error ? error.name : ''

    if (name === 'PasswordException') {
        return {kind: 'locked'}
    }

    if (name === 'InvalidPDFException' || name === 'FormatError') {
        return {kind: 'failed', reason: "It doesn't look like a PDF, or it's damaged."}
    }

    return {kind: 'failed', reason: error instanceof Error ? error.message : String(error)}
}

/** What reading a file made: a CV or a biodata, its name, and how many lines wait in Not sorted. */
export interface MadeFromFile {
    readonly kind: string
    readonly content: Cv | Biodata
    readonly name: string
    readonly unsorted: number
}

/** True for a Word file from before 2007, which only Word itself reads. */
export const isOldWord = (file: string): boolean => /\.doc$/i.test(file)

/**
 * Reads a PDF or Word file into a CV or a biodata, or gives null when it has no text,
 * as a scan has none. A locked or damaged PDF throws, as pdf.js does.
 */
export async function documentFromFile(
    bytes: Uint8Array,
    path: string,
    options: {readonly signal?: AbortSignal; onPage?(page: number, pages: number): void; onMaking?(): Promise<void>} = {},
): Promise<MadeFromFile | null> {
    const file = fileNameOf(path)
    const word = /\.docx$/i.test(file)
    const [{readPdfLayout}, {readDocxLayout}, {cvFromLayout, documentParts}, {biodataFromLayout, isBiodata}] = await Promise.all([
        import('./read-pdf'),
        import('./read-docx'),
        import('./parse'),
        import('./biodata-parse'),
    ])
    const layout = word ? await readDocxLayout(bytes) : await readPdfLayout(bytes, {signal: options.signal, onPage: options.onPage})

    if (layout.lines.length === 0) {
        return null
    }

    await options.onMaking?.()

    const parts = documentParts(layout)
    // A browser draws the photo; elsewhere, as in tests, there's no canvas to.
    const photo = typeof document === 'undefined' ? '' : photoOf(layout.photo)
    const made = isBiodata(layout, parts) ? biodataFromLayout(layout, parts) : cvFromLayout(layout)
    const fallback = file.replace(/\.(?:pdf|docx)$/i, '')

    if ('biodata' in made) {
        const content = biodataType.content.parse({...made.biodata, person: {...made.biodata.person, photo}})

        return {kind: biodataType.kind, content, name: content.person.name || fallback, unsorted: made.unsorted}
    }

    const cv = cvType.content.parse(withPhoto(made.cv, photo))

    return {kind: cvType.kind, content: cv, name: cv.person.name || fallback, unsorted: made.unsorted}
}

/**
 * Makes a CV from a PDF or Word file and opens it. Asking about unsaved changes first is
 * the caller's job, as it is for opening a file.
 */
export async function importCv(bytes: Uint8Array, path: string): Promise<void> {
    const file = fileNameOf(path)
    const controller = new AbortController()
    const set = (step: ImportStep) => {
        if (running === controller) {
            useCvImport.setState({step})
        }
    }

    running?.abort()
    running = controller
    useCvImport.setState({file, step: {kind: 'reading', page: 0, pages: 0}})

    if (isOldWord(file)) {
        set({kind: 'old-word'})
        return
    }

    try {
        await afterPaint()

        const made = await documentFromFile(bytes, path, {
            signal: controller.signal,
            onPage: (page, pages) => set({kind: 'reading', page, pages}),
            onMaking: async () => {
                set({kind: 'making'})
                await afterPaint()
            },
        })

        if (!made) {
            set({kind: 'no-text'})
            return
        }

        if (controller.signal.aborted) {
            return
        }

        const store = useDocumentStore.getState()
        const sorted = made.unsorted === 0 ? '' : ` ${made.unsorted === 1 ? 'One line is' : `${made.unsorted} lines are`} in Not sorted.`
        const original = /\.docx$/i.test(file) ? 'Word file' : 'PDF'

        store.startNew(made.content, made.kind)
        store.setName(made.name)
        store.notify(made.kind === biodataType.kind ? `Made a biodata from ${file}. Check it against your ${original}.${sorted}` : `Made a CV from ${file}. Check it against your ${original}, the dates especially.${sorted}`)

        useCvImport.setState({file: null})
    } catch (error) {
        if (!controller.signal.aborted) {
            set(stepFor(error))
        }
    } finally {
        if (running === controller) {
            running = null
        }
    }
}
