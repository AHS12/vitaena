// @vitest-environment node

/** Importing a real PDF from start to finish, and the PDFs that can't be imported. */

import {beforeAll, beforeEach, describe, expect, it} from 'vitest'
import type {TypstCompiler} from '@myriaddreamin/typst.ts'
import {useDocumentStore} from '../../store/document-store'
import type {Cv} from '../cv'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {templatePdf, typstCompiler} from '../../tests/typst'
import {importPdf, usePdfImport} from './import-pdf'

let compiler: TypstCompiler

beforeAll(async () => {
    // Node draws no frames; the import only waits for one so its dialog can show.
    globalThis.requestAnimationFrame ??= (draw: FrameRequestCallback) => setTimeout(() => draw(0), 0) as unknown as number
    compiler = await typstCompiler()
}, 60_000)

beforeEach(() => {
    usePdfImport.setState({file: null})
    useDocumentStore.getState().startNew()
})

async function pdfOf(source: string): Promise<Uint8Array> {
    compiler.addSource('/main.typ', source)

    return (await compiler.compile({mainFilePath: '/main.typ', format: 1})).result!
}

describe('importing a CV from a PDF', () => {
    it('opens the CV made from it as a new document named after the person', async () => {
        const pdf = await templatePdf(compiler, new URL('../templates/modern.typ', import.meta.url), '/cv.json', renderModel(sampleCv()))

        await importPdf(pdf, 'C:\\Users\\jane\\Downloads\\jane-cv.pdf')

        const state = useDocumentStore.getState()
        const cv = state.content as Cv

        expect(state).toMatchObject({kind: 'cv', name: 'Jane Doe', currentId: null, page: 'editor'})
        expect(cv.person.email).toBe('jane.doe@example.com')
        expect(cv.design.template).toBe('modern')
        expect(state.toast?.message).toMatch(/^Made a CV from jane-cv\.pdf\. Check it against your PDF/)
        expect(usePdfImport.getState().file).toBeNull()
    })

    it('says so when the PDF has no text, as a scan has none', async () => {
        await importPdf(await pdfOf('#rect(width: 4cm, height: 2cm, fill: gray)'), 'scan.pdf')

        expect(usePdfImport.getState()).toMatchObject({file: 'scan.pdf', step: {kind: 'no-text'}})
        expect(useDocumentStore.getState().name).not.toBe('scan')
    })

    it('says so when the file is not a PDF', async () => {
        await importPdf(new TextEncoder().encode('not a pdf at all'), 'notes.pdf')

        expect(usePdfImport.getState()).toMatchObject({file: 'notes.pdf', step: {kind: 'failed'}})
    })

    it('opens nothing once it is cancelled', async () => {
        const pdf = await templatePdf(compiler, new URL('../templates/classic.typ', import.meta.url), '/cv.json', renderModel(sampleCv()))
        const before = useDocumentStore.getState().content
        const running = importPdf(pdf, 'jane-cv.pdf')

        usePdfImport.getState().cancel()
        await running

        expect(useDocumentStore.getState().content).toBe(before)
        expect(usePdfImport.getState().file).toBeNull()
    })
})
