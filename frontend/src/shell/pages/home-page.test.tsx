import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {HomePage} from './HomePage'

const fileOf = (name: string) =>
    JSON.stringify({version: 4, generator: 'vitaena', kind: 'cv', createdAt: '2026-11-01T00:00:00Z', modifiedAt: '2026-11-01T00:00:00Z', name, content: {}})

const LIBRARY = new Map([
    ['a', fileOf('Senior engineer')],
    ['b', fileOf('Graduate resume')],
    ['c', fileOf('Nurse')],
])

beforeEach(() => {
    fakeDesktop({
        ListDocuments: vi.fn(async () => [...LIBRARY.keys()].map((id) => ({id, savedAt: '2026-11-01T10:00:00Z', size: 1, hasPicture: false}))),
        ReadDocument: vi.fn(async (id: string) => [...new TextEncoder().encode(LIBRARY.get(id) ?? '')]),
        ReadDocumentsIndex: vi.fn(async () => null),
        WriteDocumentsIndex: vi.fn(async () => undefined),
        HasDraft: vi.fn(async () => false),
    })
})

afterEach(() => {
    cleanup()
    fakeDesktop()
})

describe('Home', () => {
    it('shows recent work first, then the ways to start, then every document', async () => {
        render(<HomePage start={<section aria-label="Start something new" />} />)

        await screen.findByRole('region', {name: 'Recent'})
        const order = screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))

        expect(order.indexOf('Recent')).toBeLessThan(order.indexOf('Start something new'))
        expect(order.indexOf('Start something new')).toBeLessThan(order.indexOf('All your documents'))
    })

    it('narrows the list of every document as you search', async () => {
        render(<HomePage />)
        const all = await screen.findByRole('region', {name: 'All your documents'})

        await waitFor(() => expect(within(all).getAllByRole('listitem')).toHaveLength(3))
        fireEvent.change(within(all).getByRole('searchbox', {name: 'Search your documents'}), {target: {value: 'nur'}})

        expect(within(all).getAllByRole('listitem')).toHaveLength(1)
        expect(within(all).getByRole('button', {name: /Nurse/})).toBeInTheDocument()
    })

    it('goes from Recent to the page of every document', async () => {
        render(<HomePage />)
        const recent = await screen.findByRole('region', {name: 'Recent'})

        fireEvent.click(await within(recent).findByRole('button', {name: 'See all 3 documents'}))

        expect(useDocumentStore.getState().page).toBe('documents')
    })
})
