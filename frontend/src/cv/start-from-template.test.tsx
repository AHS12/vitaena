import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useDocumentStore} from '../store/document-store'
import {StartFromTemplate} from './StartFromTemplate'

// The pictures are Typst's job, tested on their own.
vi.mock('./typst/engine', () => ({whenIdle: async () => undefined, svg: async () => ''}))

beforeEach(() => {
    window.localStorage.clear()
    useDocumentStore.getState().startNew()
    useDocumentStore.setState({page: 'home'})
})
afterEach(cleanup)

const panel = () => screen.getByRole('tabpanel')

describe("Home's ways to start", () => {
    it('opens on CVs and resumes, and shows the biodata templates on their own tab', () => {
        render(<StartFromTemplate />)

        expect(screen.getByRole('tab', {name: 'CVs and resumes', selected: true})).toBeInTheDocument()
        expect(within(panel()).getByRole('button', {name: /^Modern/})).toBeInTheDocument()

        fireEvent.click(screen.getByRole('tab', {name: 'Biodata'}))

        expect(within(panel()).getAllByRole('button').map((button) => button.textContent?.split(/One|Two|Clean,/)[0])).toEqual(['Blank', 'Heritage', 'Clean', 'Portrait'])
        expect(within(panel()).queryByRole('button', {name: /^Modern/})).toBeNull()
    })

    it('remembers the tab last picked', () => {
        const {unmount} = render(<StartFromTemplate />)

        fireEvent.click(screen.getByRole('tab', {name: 'Biodata'}))
        unmount()
        render(<StartFromTemplate />)

        expect(screen.getByRole('tab', {name: 'Biodata', selected: true})).toBeInTheDocument()
    })

    it('moves between tabs with the arrow keys', () => {
        render(<StartFromTemplate />)

        fireEvent.keyDown(screen.getByRole('tab', {name: 'CVs and resumes'}), {key: 'ArrowRight'})

        expect(screen.getByRole('tab', {name: 'Biodata', selected: true})).toHaveFocus()
    })

    it('starts a biodata in the template picked, with its border', () => {
        render(<StartFromTemplate />)

        fireEvent.click(screen.getByRole('tab', {name: 'Biodata'}))
        fireEvent.click(within(panel()).getByRole('button', {name: /^Heritage/}))

        const state = useDocumentStore.getState()

        expect(state.kind).toBe('biodata')
        expect(state.content.design).toMatchObject({template: 'heritage', border: true})
    })
})
