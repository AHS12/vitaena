import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {parseDocument} from '../core/document/document-file'
import {useDocumentStore} from '../store/document-store'
import {cvType, DEFAULT_DESIGN, emptyCv} from './cv'
import {CvEditor} from './CvEditor'
import {useEditorStore} from './editor/editor-store'
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

describe('CV files from version 5', () => {
    it('show levels on lists whose every item names one, and leave other lists as they were', () => {
        const old = sampleCv()
        const group = (id: string, items: string[]) => ({id, visible: true, label: '', items})
        const sections = [{id: 's', kind: 'tags', title: 'Languages', visible: true, groups: [group('a', ['Bangla (Native)', 'English (Advanced)']), group('b', ['Go', 'SQL'])]}]
        const file = JSON.stringify({version: 5, generator: 'vitaena', kind: 'cv', createdAt: '2026-11-01T00:00:00Z', modifiedAt: '2026-11-01T00:00:00Z', name: 'Old', content: {...old, sections}})
        const section = parseDocument(file, cvType).content.sections[0]

        expect(section.kind === 'tags' && section.groups.map((item) => [item.showLevels, item.levels])).toEqual([
            [true, [5, 4]],
            [false, [0, 0]],
        ])
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
        useEditorStore.setState({designTab: 'templates'})
    })

    it('starts folded in a narrow window, and opens from the preview bar', () => {
        render(<CvEditor />)

        expect(screen.queryByRole('tab', {name: 'Templates'})).toBeNull()
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))
        expect(screen.getByRole('tab', {name: 'Templates', selected: true})).toBeInTheDocument()
    })

    it('changes the font, as one step to undo', () => {
        render(<CvEditor />)
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))
        fireEvent.click(screen.getByRole('tab', {name: 'Style'}))

        fireEvent.click(screen.getByRole('radio', {name: /EB Garamond/}))
        expect(useDocumentStore.getState().content.design.font).toBe('eb-garamond')

        useDocumentStore.getState().undo()
        expect(useDocumentStore.getState().content.design.font).toBe('inter')
    })

    it('offers ATS mode in the preview bar for two-column templates, and only those', () => {
        render(<CvEditor />)

        expect(screen.queryByRole('radiogroup', {name: 'Layout'})).toBeNull()

        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))
        fireEvent.click(screen.getByRole('radio', {name: /^Professional/}))
        fireEvent.click(screen.getByRole('radio', {name: 'One column (ATS)'}))

        expect(useDocumentStore.getState().content.design).toMatchObject({template: 'professional', atsMode: true})
        expect(screen.getByRole('radio', {name: 'One column (ATS)'})).toHaveAttribute('aria-checked', 'true')
    })

    it('turns ATS mode on from the Check tab\'s warning about columns', () => {
        useDocumentStore.getState().previewEdit({...sampleCv(), design: {...sampleCv().design, template: 'modern'}})
        render(<CvEditor />)

        fireEvent.click(screen.getByRole('tab', {name: 'Check'}))
        fireEvent.click(screen.getByRole('button', {name: 'Turn on ATS mode'}))

        expect(useDocumentStore.getState().content.design.atsMode).toBe(true)
        useEditorStore.setState({tab: 'content'})
    })

    it('shows templates with example content while the CV has only a name', () => {
        useDocumentStore.getState().previewEdit({...emptyCv(), person: {...emptyCv().person, name: 'Rahim Uddin'}})
        render(<CvEditor />)
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))

        expect(screen.getByText('Shown with example content until your CV has some of its own.')).toBeInTheDocument()
    })

    it('shows templates with the CV itself once it has content', () => {
        render(<CvEditor />)
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))

        expect(screen.queryByText(/Shown with example content/)).toBeNull()
    })

    it('sets margins and spacing from their choices', () => {
        render(<CvEditor />)
        fireEvent.click(screen.getByRole('button', {name: 'Show the design'}))
        fireEvent.click(screen.getByRole('tab', {name: 'Style'}))

        fireEvent.click(screen.getByRole('radio', {name: 'Narrow'}))
        fireEvent.click(screen.getByRole('radio', {name: 'Compact'}))

        expect(useDocumentStore.getState().content.design).toMatchObject({margins: 'narrow', spacing: 'compact'})
    })
})

describe('filling a new CV with the example', () => {
    it('keeps the template and style already chosen', () => {
        useDocumentStore.getState().startNew({...emptyCv(), design: {...DEFAULT_DESIGN, template: 'professional', accent: '#2563eb'}})
        render(<CvEditor />)

        fireEvent.click(screen.getByRole('button', {name: 'Fill with an example'}))

        expect(useDocumentStore.getState().content.person.name).toBe('Jane Doe')
        expect(useDocumentStore.getState().content.design).toMatchObject({template: 'professional', accent: '#2563eb'})
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
