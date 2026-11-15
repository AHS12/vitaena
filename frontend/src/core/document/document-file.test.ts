import {describe, expect, it} from 'vitest'
import {z} from 'zod'
import {APP} from '../app'
import {countOf, DocumentFileError, kindOf, parseAnyDocument, parseDocument, serializeDocument, type DocumentType} from './document-file'

interface Card {
    readonly title: string
    readonly done: boolean
}

const cardType: DocumentType<Card> = {
    kind: 'card',
    noun: 'card',
    version: 2,
    content: z.object({title: z.string(), done: z.boolean()}),
    empty: () => ({title: '', done: false}),
    // Version 1 had no done flag.
    migrations: {1: (content) => ({done: false, ...(content as object)})},
}

const fileOf = (fields: Record<string, unknown>) =>
    JSON.stringify({
        version: 2,
        generator: APP.id,
        kind: 'card',
        createdAt: '2026-01-01T00:00:00.000Z',
        modifiedAt: '2026-01-02T00:00:00.000Z',
        name: 'Shopping',
        content: {title: 'Milk', done: true},
        ...fields,
    })

describe('the document file', () => {
    it('gives back the name and content it was saved with', () => {
        const text = serializeDocument({name: 'Shopping', content: {title: 'Milk', done: true}}, cardType)
        const loaded = parseDocument(text, cardType)

        expect(loaded.name).toBe('Shopping')
        expect(loaded.content).toEqual({title: 'Milk', done: true})
    })

    it('records when it was saved, and keeps when it was first made', () => {
        const first = serializeDocument({name: 'A', content: cardType.empty(), now: new Date('2026-01-01T00:00:00Z')}, cardType)
        const opened = parseDocument(first, cardType)
        const again = JSON.parse(serializeDocument({...opened, now: new Date('2026-03-01T00:00:00Z')}, cardType))

        expect(again.createdAt).toBe('2026-01-01T00:00:00.000Z')
        expect(again.modifiedAt).toBe('2026-03-01T00:00:00.000Z')
    })

    it('writes back keys it does not understand', () => {
        const opened = parseDocument(fileOf({colour: 'red'}), cardType)
        const saved = JSON.parse(serializeDocument(opened, cardType))

        expect(saved.colour).toBe('red')
    })

    it('upgrades content from an older version', () => {
        const loaded = parseDocument(fileOf({version: 1, content: {title: 'Old'}}), cardType)

        expect(loaded.content).toEqual({title: 'Old', done: false})
    })

    it('refuses a file from a newer version of the app', () => {
        expect(() => parseDocument(fileOf({version: 3}), cardType)).toThrow(/newer version/)
    })

    it('refuses a file another app wrote', () => {
        expect(() => parseDocument(fileOf({generator: 'some-other-app'}), cardType)).toThrow(DocumentFileError)
    })

    it('refuses a file that is not JSON', () => {
        expect(() => parseDocument('not json', cardType)).toThrow(/isn't valid JSON/)
    })

    it('refuses another type of document, and says which it is', () => {
        expect(() => parseDocument(fileOf({kind: 'list'}), cardType)).toThrow(/is a list, not a card/)
    })

    it('names the part of the content that is wrong', () => {
        expect(() => parseDocument(fileOf({content: {title: 'Milk', done: 'yes'}}), cardType)).toThrow(/done/)
    })

    it('gives a document with no name a plain one', () => {
        expect(parseDocument(fileOf({name: undefined}), cardType).name).toBe('Untitled card')
    })
})

interface Note {
    readonly text: string
}

const noteType: DocumentType<Note> = {
    kind: 'note',
    noun: 'note',
    plural: 'notes',
    version: 1,
    content: z.object({text: z.string()}),
    empty: () => ({text: ''}),
}

const types = [cardType, noteType] as readonly DocumentType<Card | Note>[]

describe('a file of one of several types', () => {
    it('is read as the type its kind names', () => {
        const loaded = parseAnyDocument(fileOf({kind: 'note', version: 1, content: {text: 'Call home'}}), types)

        expect(loaded.type).toBe(noteType)
        expect(loaded.content).toEqual({text: 'Call home'})
    })

    it('is upgraded by its own type', () => {
        const loaded = parseAnyDocument(fileOf({version: 1, content: {title: 'Milk'}}), types)

        expect(loaded.type).toBe(cardType)
        expect(loaded.content).toEqual({title: 'Milk', done: false})
    })

    it('of a kind this build does not know is taken to be from a newer version', () => {
        expect(() => parseAnyDocument(fileOf({kind: 'recipe'}), types)).toThrow(/is a recipe, which this version of .* can't open/)
    })

    it('that is not from this app is refused as the first type', () => {
        expect(() => parseAnyDocument('{"title": "Milk"}', types)).toThrow(DocumentFileError)
        expect(() => parseAnyDocument('not json', types)).toThrow(/isn't valid JSON/)
    })

    it('says its kind without being read', () => {
        expect(kindOf(fileOf({kind: 'note'}))).toBe('note')
        expect(kindOf('{"kind": "note"}')).toBeNull()
        expect(kindOf('not json')).toBeNull()
    })
})

describe('counting documents', () => {
    it('uses the plural a type gives', () => {
        expect(countOf(1, cardType)).toBe('1 card')
        expect(countOf(3, cardType)).toBe('3 cards')
        expect(countOf(2, {noun: 'biodata', plural: 'biodata'})).toBe('2 biodata')
    })
})
