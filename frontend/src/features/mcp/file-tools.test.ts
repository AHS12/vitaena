import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {BIODATA_FORMATS} from '../../biodata/biodata-export'
import {parseDocument, serializeDocument} from '../../core/document/document-file'
import {CV_FORMATS} from '../../cv/cv-export'
import {cvType} from '../../cv/cv'
import {sampleCv} from '../../cv/sample'
import {fakeDesktop} from '../../platform/shell'
import {answer} from './bridge'
import {toolsWith} from './tools'

vi.mock('../../cv/thumbnail', () => ({cvThumbnail: async () => null, pageThumbnail: async () => null}))
vi.mock('../../cv/typst/engine', () => ({pdf: async () => new TextEncoder().encode('%PDF-fake')}))
vi.mock('../../cv/import/import-cv', () => ({
    isOldWord: (file: string) => file.endsWith('.doc'),
    documentFromFile: vi.fn(async (bytes: Uint8Array) => {
        if (bytes.length === 0) {
            return null
        }

        if (bytes[0] === 9) {
            throw Object.assign(new Error('locked'), {name: 'PasswordException'})
        }

        return {kind: 'cv', content: sampleCv(), name: 'Jane Doe', unsorted: 2}
    }),
}))

const TOOLS = toolsWith({cv: CV_FORMATS, biodata: BIODATA_FORMATS})
const base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)))

let files: Map<string, string>
let app: Record<string, ReturnType<typeof vi.fn>>

beforeEach(() => {
    files = new Map([['cv-1', serializeDocument({name: 'Jane Doe', content: sampleCv()}, cvType)]])
    app = {
        ReadDocument: vi.fn(async (id: string) => base64(files.get(id) ?? '')),
        WriteDocument: vi.fn(async (id: string, contents: number[]) => void files.set(id, new TextDecoder().decode(Uint8Array.from(contents)))),
        ListDocuments: vi.fn(async () => [...files.keys()].map((id) => ({id, savedAt: '2026-11-16T10:00:00Z', size: 1, hasPicture: false}))),
        ReadDocumentsIndex: vi.fn(async () => {
            throw new Error('none')
        }),
        WriteDocumentsIndex: vi.fn(async () => undefined),
        RecordActivity: vi.fn(async () => undefined),
        SaveFiles: vi.fn(async (folder: string, saved: {name: string}[]) => saved.map((file) => `${folder || 'C:\\Users\\Jane\\Downloads'}\\${file.name}`)),
        ReadImportFile: vi.fn(async (path: string) => (path.includes('scan') ? '' : path.includes('locked') ? btoa('\t') : btoa('%PDF'))),
    }
    fakeDesktop(app)
})

afterEach(() => fakeDesktop())

const call = (name: string, input: object) => answer(TOOLS, name, JSON.stringify(input), 'Claude')

describe('export_document', () => {
    it('saves a file in Downloads by default, named after the document', async () => {
        const reply = await call('export_document', {id: 'cv-1', format: 'pdf'})

        expect(reply.text).toBe('Saved Jane Doe as PDF:\n- C:\\Users\\Jane\\Downloads\\Jane Doe.pdf')
        expect(app.SaveFiles).toHaveBeenCalledWith('', [{name: 'Jane Doe.pdf', data: [...new TextEncoder().encode('%PDF-fake')]}])
    })

    it('saves into a folder the person named, as text when the format is text', async () => {
        await call('export_document', {id: 'cv-1', format: 'text', folder: 'D:\\Jobs'})

        expect(app.SaveFiles.mock.calls[0][0]).toBe('D:\\Jobs')
        expect(new TextDecoder().decode(Uint8Array.from(app.SaveFiles.mock.calls[0][1][0].data))).toContain('EXPERIENCE')
    })

    it('names the formats a kind has when asked for another', async () => {
        expect((await call('export_document', {id: 'cv-1', format: 'png'})).text).toBe("A CV can't be exported as \"png\". It can be: pdf, pdf-ats, docx, text, vitaena.")
    })
})

describe('import_file', () => {
    it('makes and saves a document from the file, saying how many lines wait in Not sorted', async () => {
        const reply = await call('import_file', {path: 'C:\\Users\\Jane\\cv.pdf'})
        const id = (reply.structured as {id: string}).id

        expect(reply.text).toMatch(/^Made the CV "Jane Doe 2", id .+, from cv\.pdf\. 2 lines wait in Not sorted\./)
        expect(parseDocument(files.get(id) as string, cvType).name).toBe('Jane Doe 2')
        expect(app.RecordActivity).toHaveBeenCalledWith(expect.objectContaining({summary: 'imported cv.pdf'}))
    })

    it('says plainly why a file can\'t be imported', async () => {
        expect((await call('import_file', {path: 'C:\\cv.doc'})).text).toContain('before 2007 (.doc)')
        expect((await call('import_file', {path: 'C:\\scan.pdf'})).text).toContain('It has no text to read')
        expect((await call('import_file', {path: 'C:\\locked.pdf'})).text).toBe('The PDF is locked with a password. Ask the person to save a copy without one.')
    })
})
