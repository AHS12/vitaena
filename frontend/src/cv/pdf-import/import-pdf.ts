/**
 * Importing a PDF: reading it with a dialog that shows how far it has got, then opening
 * the CV made from it as a new, unsaved document. The dialog reads its state from here.
 */

import {create} from 'zustand'
import {afterPaint} from '../../core/yield'
import {useDocumentStore} from '../../store/document-store'
import {cvType} from '../cv'

/** Where an import is: reading pages, making the CV, or stopped with something to say. */
export type ImportStep =
    | {readonly kind: 'reading'; readonly page: number; readonly pages: number}
    | {readonly kind: 'making'}
    | {readonly kind: 'no-text'}
    | {readonly kind: 'locked'}
    | {readonly kind: 'failed'; readonly reason: string}

interface ImportState {
    /** The PDF's file name while its dialog is open, or null. */
    readonly file: string | null
    readonly step: ImportStep
    cancel(): void
    close(): void
}

let running: AbortController | null = null

export const usePdfImport = create<ImportState>()((set) => ({
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
 * Makes a CV from a PDF and opens it. Asking about unsaved changes first is the
 * caller's job, as it is for opening a file.
 */
export async function importPdf(bytes: Uint8Array, path: string): Promise<void> {
    const file = fileNameOf(path)
    const controller = new AbortController()
    const set = (step: ImportStep) => {
        if (running === controller) {
            usePdfImport.setState({step})
        }
    }

    running?.abort()
    running = controller
    usePdfImport.setState({file, step: {kind: 'reading', page: 0, pages: 0}})

    try {
        await afterPaint()

        const [{readPdfLayout}, {cvFromLayout}] = await Promise.all([import('./read-pdf'), import('./parse')])
        const layout = await readPdfLayout(bytes, {signal: controller.signal, onPage: (page, pages) => set({kind: 'reading', page, pages})})

        if (layout.lines.length === 0) {
            set({kind: 'no-text'})
            return
        }

        set({kind: 'making'})
        await afterPaint()

        const {cv, unsorted} = cvFromLayout(layout)

        if (controller.signal.aborted) {
            return
        }

        const store = useDocumentStore.getState()
        const sorted = unsorted === 0 ? '' : ` ${unsorted === 1 ? 'One line is' : `${unsorted} lines are`} in Not sorted.`

        store.startNew(cvType.content.parse(cv), cvType.kind)
        store.setName(cv.person.name || file.replace(/\.pdf$/i, ''))
        store.notify(`Made a CV from ${file}. Check it against your PDF, the dates especially.${sorted}`)
        usePdfImport.setState({file: null})
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
