import {cleanup, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {z} from 'zod'
import type {DocumentType} from '../../core/document/document-file'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {DOCUMENT_TYPES, type Content} from '../../store/document-types'
import {emptyCv} from '../../cv/cv'
import {DocumentsPage} from './DocumentsPage'
import {HomePage} from './HomePage'

// A second type, so the app can be seen holding two. The real second type comes later.
const noteType = {
    kind: 'note',
    noun: 'note',
    version: 1,
    content: z.object({text: z.string()}),
    empty: () => ({text: ''}),
} as unknown as DocumentType<Content>

const fileOf = (name: string, kind: string, content: unknown, version = kind === 'cv' ? 7 : 1) =>
    JSON.stringify({version, generator: 'vitaena', kind, createdAt: '2026-11-01T00:00:00Z', modifiedAt: '2026-11-01T00:00:00Z', name, content})

let saved: Map<string, string>

beforeEach(() => {
    ;(DOCUMENT_TYPES as DocumentType<Content>[]).push(noteType)
    saved = new Map([
        ['cv', fileOf('Senior engineer', 'cv', emptyCv())],
        ['note', fileOf('Shopping', 'note', {text: 'Milk'})],
        ['newer', fileOf('From the future', 'recipe', {})],
    ])
    fakeDesktop({
        ListDocuments: vi.fn(async () => [...saved.keys()].map((id) => ({id, savedAt: '2026-11-01T10:00:00Z', size: 1, hasPicture: false}))),
        ReadDocument: vi.fn(async (id: string) => [...new TextEncoder().encode(saved.get(id) ?? '')]),
        WriteDocument: vi.fn(async (id: string, contents: number[]) => void saved.set(id, new TextDecoder().decode(new Uint8Array(contents)))),
        ReadDocumentsIndex: vi.fn(async () => null),
        WriteDocumentsIndex: vi.fn(async () => undefined),
        ListRemovedDocuments: vi.fn(async () => []),
        HasDraft: vi.fn(async () => false),
    })
    useDocumentStore.setState({page: 'home', pickedId: null, currentId: null, toast: null, documents: []})
})

afterEach(() => {
    cleanup()
    fakeDesktop()
    ;(DOCUMENT_TYPES as DocumentType<Content>[]).splice(1)
})

describe('a library holding two types of document', () => {
    it('calls them documents on Home, and marks each with its type', async () => {
        render(<HomePage />)

        const all = await screen.findByRole('region', {name: 'All your documents'})

        await waitFor(() => expect(within(all).getByText('Shopping')).toBeInTheDocument())
        expect(within(all).getByText('Shopping').parentElement).toHaveTextContent('Note')
        expect(within(all).getByText('Senior engineer').parentElement).toHaveTextContent('CV')
        expect(screen.getByRole('button', {name: /See all 3 documents/})).toBeInTheDocument()
    })

    it('offers to show one type at a time on the documents page', async () => {
        useDocumentStore.setState({page: 'documents'})
        render(<DocumentsPage />)

        await waitFor(() => expect(document.querySelectorAll('[data-document-id]')).toHaveLength(3))
        expect(document.querySelector('.library-page__type')).toHaveTextContent('Every type')
        expect(screen.getByRole('button', {name: /^Shopping/})).toHaveTextContent('Note')
    })

    it('opens each document as its own type, and saves it as that type', async () => {
        await useDocumentStore.getState().refreshDocuments()
        await useDocumentStore.getState().open('note')

        expect(useDocumentStore.getState().kind).toBe('note')
        expect(useDocumentStore.getState().content).toEqual({text: 'Milk'})

        await useDocumentStore.getState().save()

        expect(JSON.parse(saved.get('note') ?? '{}')).toMatchObject({kind: 'note', content: {text: 'Milk'}})

        await useDocumentStore.getState().open('cv')

        expect(useDocumentStore.getState().kind).toBe('cv')
    })

    it('starts a new document of the type asked for', () => {
        useDocumentStore.getState().startNew(undefined, 'note')

        expect(useDocumentStore.getState()).toMatchObject({kind: 'note', content: {text: ''}, name: 'Untitled note', currentId: null})
    })

    it('says a document of a type it does not know is from a newer version', async () => {
        await useDocumentStore.getState().open('newer')

        expect(useDocumentStore.getState().toast?.message).toMatch(/is a recipe, which this version of .* can't open/)
    })
})
