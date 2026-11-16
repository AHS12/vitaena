import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {sampleBiodata} from '../../biodata/sample'
import {biodataType} from '../../biodata/biodata'
import {serializeDocument} from '../../core/document/document-file'
import {cvType} from '../../cv/cv'
import {sampleCv} from '../../cv/sample'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {answer} from './bridge'
import {BIODATA_FORMATS} from '../../biodata/biodata-export'
import {CV_FORMATS} from '../../cv/cv-export'
import {toolsWith} from './tools'

const TOOLS = toolsWith({cv: CV_FORMATS, biodata: BIODATA_FORMATS})

vi.mock('../../cv/typst/engine', () => ({pdf: async () => new Uint8Array([1, 2, 3])}))
vi.mock('../../cv/pdf-text', () => ({pdfText: async () => ({pages: 3, text: 'Jane Doe\nSenior Software Engineer'})}))
vi.mock('../../biodata/pictures', () => ({pagePictures: async () => [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])]}))

const cvFile = serializeDocument({name: 'Jane Doe', content: sampleCv()}, cvType)
const biodataFile = serializeDocument({name: 'John Doe biodata', content: sampleBiodata()}, biodataType)

beforeEach(() => {
    fakeDesktop({
        ReadDocument: vi.fn(async (id: string) => {
            if (id === 'cv-1') {
                return btoa(String.fromCharCode(...new TextEncoder().encode(cvFile)))
            }

            if (id === 'bio-1') {
                return btoa(String.fromCharCode(...new TextEncoder().encode(biodataFile)))
            }

            throw new Error('no such file')
        }),
    })
})

afterEach(() => {
    fakeDesktop()
    useDocumentStore.setState({currentId: null})
})

const call = (name: string, input: object) => answer(TOOLS, name, JSON.stringify(input))

describe('read_document', () => {
    it("gives a CV's text and the ids an edit needs", async () => {
        const reply = await call('read_document', {id: 'cv-1'})
        const structured = reply.structured as {document: {person: {name: string}; sections: {id: string; title: string; entries?: {id: string; bullets: number}[]}[]}; text: string}
        const experience = structured.document.sections.find((section) => section.title === 'Experience')

        expect(reply.isError).toBe(false)
        expect(reply.text).toMatch(/^Jane Doe \(CV\), id cv-1, template classic\./)
        expect(structured.text).toContain('EXPERIENCE')
        expect(structured.document.person.name).toBe('Jane Doe')
        expect(experience?.entries?.[0]).toMatchObject({id: expect.any(String), bullets: expect.any(Number)})
    })

    it('gives everything as stored when asked for the full document, with pictures left out', async () => {
        const withPhoto = sampleCv()
        useDocumentStore.setState({currentId: 'open-1', kind: 'cv', name: 'Jane Doe', content: {...withPhoto, person: {...withPhoto.person, photo: 'data:image/jpeg;base64,AAAA'}}, savedContent: withPhoto})

        const reply = await call('read_document', {id: 'open-1', detail: 'full'})
        const structured = reply.structured as {open: boolean; unsaved: boolean; document: {person: {photo: string}; sections: {bullets?: unknown}[]}}

        expect(structured).toMatchObject({open: true, unsaved: true})
        expect(structured.document.person.photo).toBe('(a picture)')
        expect(reply.text).toContain('open in the editor with unsaved changes')
        expect(JSON.stringify(structured.document)).toContain('"bullets":["')
    })

    it('reads a biodata with its heading and family', async () => {
        const reply = await call('read_document', {id: 'bio-1'})

        expect(reply.isError).toBe(false)
        expect(reply.text).toContain('(biodata)')
        expect(reply.text).toContain('FAMILY')
        expect((reply.structured as {document: {sections: {kind: string; members?: unknown[]}[]}}).document.sections.find((section) => section.kind === 'family')?.members?.length).toBeGreaterThan(0)
    })

    it("says so when there's no such document", async () => {
        expect(await call('read_document', {id: 'nope'})).toEqual({text: 'There\'s no document with the id "nope". list_documents gives each one\'s id.', isError: true})
    })
})

describe('list_templates', () => {
    it('lists every template a kind can use, with what each suits', async () => {
        const reply = await call('list_templates', {kind: 'cv'})

        expect(reply.text).toContain('- Classic (id classic):')
        expect(reply.text).toContain('Suits: Academic CV.')
        expect((await call('list_templates', {kind: 'biodata'})).text).toContain('- Heritage (id heritage):')
    })
})

describe('check_document', () => {
    it("gives Check's advice, the pages and what a screening system reads", async () => {
        const reply = await call('check_document', {id: 'cv-1'})

        expect(reply.text).toMatch(/^Jane Doe \(CV\): 3 pages\.\n- (Warning|Tip|Good): /)
        expect(reply.text).toContain('3 pages is long for most jobs')
        expect(reply.text).toContain('What a screening system reads from the PDF:\nJane Doe')
        expect(reply.structured).toMatchObject({pages: 3, pdfText: expect.any(String)})
    })

    it("uses a biodata's own Check, with no screening text", async () => {
        const reply = await call('check_document', {id: 'bio-1'})

        expect(reply.isError).toBe(false)
        expect(reply.text).not.toContain('screening system')
    })
})

describe('preview_pages', () => {
    it('draws the pages asked for, as pictures', async () => {
        const reply = await call('preview_pages', {id: 'cv-1', pages: [2, 9]})

        expect(reply.text).toBe('Jane Doe (CV): page 2 of 3.')
        expect(reply.images).toEqual([{data: btoa('\u0002'), mimeType: 'image/jpeg'}])
    })

    it('draws the first pages by default, and says when none of those asked for exist', async () => {
        expect((await call('preview_pages', {id: 'cv-1'})).images).toHaveLength(3)
        expect((await call('preview_pages', {id: 'cv-1', pages: [7]})).text).toBe('Jane Doe (CV) has 3 pages, so none of those can be drawn.')
    })
})
