import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {sampleCv} from '../../cv/sample'
import {ExportTitleButton} from './ExportTitleButton'

vi.mock('../../cv/typst/engine', () => ({pdf: async () => new TextEncoder().encode('%PDF-fake')}))

let written: {path: string; text: string} | null = null

beforeEach(() => {
    written = null
    fakeDesktop({
        SaveFileDialog: vi.fn(async (_title: string, name: string) => `C:/CVs/${name}`),
        WriteFile: vi.fn(async (path: string, contents: number[]) => {
            written = {path, text: new TextDecoder().decode(new Uint8Array(contents))}
        }),
    })
    useDocumentStore.setState({name: 'Jane CV', toast: null})
    useDocumentStore.getState().previewEdit(sampleCv())
})

afterEach(() => {
    cleanup()
    fakeDesktop()
})

describe('the Export button', () => {
    it('opens a menu of every format, with what each is for', async () => {
        render(<ExportTitleButton />)

        fireEvent.click(screen.getByRole('button', {name: /^Export/}))

        // The divider is a menu item with nothing in it.
        const items = (await screen.findAllByRole('menuitem')).filter((item) => item.textContent)

        expect(items.map((item) => item.textContent)).toEqual([
            expect.stringMatching(/^PDFWhat to send/),
            expect.stringMatching(/^WordFor job portals/),
            expect.stringMatching(/^Plain textJust the words/),
            expect.stringMatching(/^Vitaena fileA backup of this CV/),
            expect.stringMatching(/^Export to a folder…/),
        ])
    })

    it('saves the format picked where the person chooses, and says so', async () => {
        render(<ExportTitleButton />)

        fireEvent.click(screen.getByRole('button', {name: /^Export/}))
        await act(async () => fireEvent.click(await screen.findByRole('menuitem', {name: /^Vitaena file/})))

        await waitFor(() => expect(written?.path).toBe('C:/CVs/Jane CV.json'))
        expect(JSON.parse(written!.text)).toMatchObject({generator: 'vitaena', kind: 'cv', name: 'Jane CV'})
        expect(useDocumentStore.getState().toast?.message).toBe('Exported Jane CV.json')
    })
})

describe('the one-column PDF for online forms', () => {
    it('is offered with a two-column template, and not with a one-column one', async () => {
        const cv = sampleCv()

        useDocumentStore.getState().previewEdit({...cv, design: {...cv.design, template: 'professional'}})
        const {unmount} = render(<ExportTitleButton />)

        fireEvent.click(screen.getByRole('button', {name: /^Export/}))
        expect(await screen.findByRole('menuitem', {name: /^PDF for online forms/})).toBeInTheDocument()
        unmount()

        useDocumentStore.getState().previewEdit({...cv, design: {...cv.design, template: 'classic'}})
        render(<ExportTitleButton />)
        fireEvent.click(screen.getByRole('button', {name: /^Export/}))
        await screen.findAllByRole('menuitem')
        expect(screen.queryByRole('menuitem', {name: /^PDF for online forms/})).toBeNull()
    })

    it('is saved with (ATS) in its name, beside the usual PDF', async () => {
        const cv = sampleCv()

        useDocumentStore.getState().previewEdit({...cv, design: {...cv.design, template: 'modern'}})
        render(<ExportTitleButton />)

        fireEvent.click(screen.getByRole('button', {name: /^Export/}))
        await act(async () => fireEvent.click(await screen.findByRole('menuitem', {name: /^PDF for online forms/})))

        await waitFor(() => expect(written?.path).toBe('C:/CVs/Jane CV (ATS).pdf'))
    })
})
