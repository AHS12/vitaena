/**
 * Importing a CV from a PDF or a Word file: reading it with a dialog that shows how far it
 * has got, then opening the CV made from it as a new, unsaved document. The dialog reads
 * its state from here.
 */

import {create} from 'zustand'
import {squarePhoto} from '../../components/square-photo'
import {afterPaint} from '../../core/yield'
import {useDocumentStore} from '../../store/document-store'
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

    if (/\.doc$/i.test(file)) {
        set({kind: 'old-word'})
        return
    }

    try {
        await afterPaint()

        const word = /\.docx$/i.test(file)
        const [{readPdfLayout}, {readDocxLayout}, {cvFromLayout}] = await Promise.all([import('./read-pdf'), import('./read-docx'), import('./parse')])
        const layout = word ? await readDocxLayout(bytes) : await readPdfLayout(bytes, {signal: controller.signal, onPage: (page, pages) => set({kind: 'reading', page, pages})})

        if (layout.lines.length === 0) {
            set({kind: 'no-text'})
            return
        }

        set({kind: 'making'})
        await afterPaint()

        const made = cvFromLayout(layout)
        // A browser draws the photo; elsewhere, as in tests, there's no canvas to.
        const cv = typeof document === 'undefined' ? made.cv : withPhoto(made.cv, photoOf(layout.photo))
        const {unsorted} = made

        if (controller.signal.aborted) {
            return
        }

        const store = useDocumentStore.getState()
        const sorted = unsorted === 0 ? '' : ` ${unsorted === 1 ? 'One line is' : `${unsorted} lines are`} in Not sorted.`

        store.startNew(cvType.content.parse(cv), cvType.kind)
        store.setName(cv.person.name || file.replace(/\.(?:pdf|docx)$/i, ''))
        store.notify(`Made a CV from ${file}. Check it against your ${word ? 'Word file' : 'PDF'}, the dates especially.${sorted}`)
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
