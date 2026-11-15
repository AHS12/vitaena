import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {parseDocument} from '../core/document/document-file'
import {useDocumentStore} from '../store/document-store'
import {cvType, DEFAULT_DESIGN} from './cv'
import {CvEditor} from './CvEditor'
import {renderModel} from './render-model'
import {sampleCv} from './sample'

vi.mock('./typst/engine', () => ({preview: async () => null, pdf: async () => new Uint8Array()}))
vi.mock('./typst/font-urls', () => ({fontUrl: (file: string) => file}))

afterEach(cleanup)

describe('CV files from version 1', () => {
    it('open with the new design choices at their defaults, keeping the rest', () => {
        const old = sampleCv()
        // Version 1 had only these four.
        const design = {template: old.design.template, accent: old.design.accent, fontSize: old.design.fontSize, paper: old.design.paper}
        const file = JSON.stringify({version: 1, generator: 'vitaena', kind: 'cv', createdAt: '2026-11-01T00:00:00Z', modifiedAt: '2026-11-01T00:00:00Z', name: 'Old', content: {...old, design: {...design, accent: '#7a1f4b'}}})
        const loaded = parseDocument(file, cvType)

        expect(loaded.content.design).toEqual({...DEFAULT_DESIGN, accent: '#7a1f4b'})
        expect(loaded.content.design.atsMode).toBe(false)
    })
})

describe('what a template is given about the design', () => {
    it('names the font family and turns margins and spacing into numbers', () => {
        const cv = sampleCv()
        const model = renderModel({...cv, design: {...cv.design, font: 'eb-garamond', margins: 'narrow', spacing: 'relaxed'}})

        expect(model.design).toMatchObject({font: 'EB Garamond', margin: 1.3, spacing: 1.2})
    })

    it('falls back to the first font for one it doesn\'t know', () => {
        const cv = sampleCv()

        expect(renderModel({...cv, design: {...cv.design, font: 'comic'}}).design.font).toBe('Inter')
    })
})

describe('the design panel', () => {
    beforeEach(() => {
        window.localStorage.clear()
        useDocumentStore.getState().startNew()
        useDocumentStore.getState().previewEdit(sampleCv())
    })

    it('starts folded in a narrow window, and opens from the preview bar', () => {
        render(<CvEditor />)

        expect(screen.queryByRole('radio', {name: /EB Garamond/})).toBeNull()
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))
        expect(screen.getByRole('radio', {name: /EB Garamond/})).toBeInTheDocument()
    })

    it('changes the font, as one step to undo', () => {
        render(<CvEditor />)
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))

        fireEvent.click(screen.getByRole('radio', {name: /EB Garamond/}))
        expect(useDocumentStore.getState().content.design.font).toBe('eb-garamond')

        useDocumentStore.getState().undo()
        expect(useDocumentStore.getState().content.design.font).toBe('inter')
    })

    it('sets margins and spacing from their choices', () => {
        render(<CvEditor />)
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))

        fireEvent.click(screen.getByRole('radio', {name: 'Narrow'}))
        fireEvent.click(screen.getByRole('radio', {name: 'Compact'}))

        expect(useDocumentStore.getState().content.design).toMatchObject({margins: 'narrow', spacing: 'compact'})
    })
})

describe('starting from a template on Home', () => {
    it('starts a new CV in the template picked', async () => {
        const {StartFromTemplate} = await import('./StartFromTemplate')

        useDocumentStore.getState().startNew()
        render(<StartFromTemplate />)
        fireEvent.click(screen.getByRole('button', {name: /^Modern/}))

        const state = useDocumentStore.getState()

        expect(state.content.design.template).toBe('modern')
        expect(state.content.person.name).toBe('')
        expect(state.page).toBe('editor')
    })
})
