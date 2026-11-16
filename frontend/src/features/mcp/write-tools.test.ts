import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {biodataType, type Biodata} from '../../biodata/biodata'
import {sampleBiodata} from '../../biodata/sample'
import {parseDocument, serializeDocument} from '../../core/document/document-file'
import {cvType, type Cv} from '../../cv/cv'
import {sampleCv} from '../../cv/sample'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {answer} from './bridge'
import {putBack, type Activity} from './changes'
import {heightOf} from './edit-ops'
import {BIODATA_FORMATS} from '../../biodata/biodata-export'
import {CV_FORMATS} from '../../cv/cv-export'
import {toolsWith} from './tools'

const TOOLS = toolsWith({cv: CV_FORMATS, biodata: BIODATA_FORMATS})

vi.mock('../../cv/thumbnail', () => ({cvThumbnail: async () => null, pageThumbnail: async () => null}))

const base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)))
const textOf = (bytes: number[]) => new TextDecoder().decode(Uint8Array.from(bytes))

let files: Map<string, string>
let app: Record<string, ReturnType<typeof vi.fn>>

beforeEach(() => {
    files = new Map([
        ['cv-1', serializeDocument({name: 'Jane Doe', content: sampleCv()}, cvType)],
        ['bio-1', serializeDocument({name: 'John Doe biodata', content: sampleBiodata()}, biodataType)],
    ])
    app = {
        ReadDocument: vi.fn(async (id: string) => {
            const text = files.get(id)

            if (text === undefined) {
                throw new Error('no such file')
            }

            return base64(text)
        }),
        WriteDocument: vi.fn(async (id: string, contents: number[]) => void files.set(id, textOf(contents))),
        ListDocuments: vi.fn(async () => [...files.keys()].map((id) => ({id, savedAt: '2026-11-16T10:00:00Z', size: 1, hasPicture: false}))),
        ReadDocumentsIndex: vi.fn(async () => {
            throw new Error('none')
        }),
        WriteDocumentsIndex: vi.fn(async () => undefined),
        KeepCopy: vi.fn(async (id: string) => `${id}~1.json`),
        ReadCopy: vi.fn(async () => base64(serializeDocument({name: 'Jane Doe', content: sampleCv()}, cvType))),
        RecordActivity: vi.fn(async () => undefined),
    }
    fakeDesktop(app)
})

afterEach(() => {
    fakeDesktop()
    useDocumentStore.setState({currentId: null, toast: null})
})

const call = (name: string, input: object) => answer(TOOLS, name, JSON.stringify(input), 'Claude')
const cvIn = (id: string): Cv => parseDocument(files.get(id) as string, cvType).content
const biodataIn = (id: string): Biodata => parseDocument(files.get(id) as string, biodataType).content

describe('edit_document on a saved document', () => {
    it('saves the changes after keeping a copy, and notes what it did', async () => {
        const before = files.get('cv-1')
        const reply = await call('edit_document', {
            id: 'cv-1',
            operations: [
                {op: 'set_field', field: 'headline', value: 'Staff Engineer'},
                {op: 'add_entry', section: 'experience', title: 'Staff Engineer', org: 'Northwind', start: '2025-01', current: true, bullets: ['Led **payments**', ' '], position: 0},
            ],
        })
        const cv = cvIn('cv-1')
        const experience = cv.sections.find((section) => section.title === 'Experience')

        expect(reply.isError).toBe(false)
        expect(reply.text).toMatch(/^Saved: set the headline; added "Staff Engineer, Northwind" to Experience\. A copy from before is kept/)
        expect(reply.text).toMatch(/Added: entry "Staff Engineer, Northwind", id entry-/)
        expect(cv.person.headline).toBe('Staff Engineer')
        expect(experience?.kind === 'entries' && experience.entries[0]).toMatchObject({title: 'Staff Engineer', org: 'Northwind', current: true, bullets: ['Led **payments**']})
        expect(textOf(app.KeepCopy.mock.calls[0][1])).toBe(before)
        expect(app.RecordActivity).toHaveBeenCalledWith({client: 'Claude', documentId: 'cv-1', documentName: 'Jane Doe', summary: 'made 2 changes', copy: 'cv-1~1.json'})
    })

    it('changes nothing when one step fails, and says which and why', async () => {
        const before = files.get('cv-1')
        const reply = await call('edit_document', {id: 'cv-1', operations: [{op: 'set_field', field: 'name', value: 'J'}, {op: 'add_entry', section: 'Hobbies', title: 'x'}]})

        expect(reply).toEqual({text: 'Operation 2 (add_entry): there\'s no section "Hobbies". Nothing was changed.', isError: true})
        expect(files.get('cv-1')).toBe(before)
        expect(app.WriteDocument).not.toHaveBeenCalled()
    })

    it('refuses dates in the wrong form, fields a kind lacks, and sections of the wrong kind', async () => {
        const entry = sampleCv().sections.find((section) => section.kind === 'entries')
        const entryId = entry?.kind === 'entries' ? entry.entries[0].id : ''

        expect((await call('edit_document', {id: 'cv-1', operations: [{op: 'update_entry', entry: entryId, start: 'March 2020'}]})).text).toContain('start must be a month as YYYY-MM')
        expect((await call('edit_document', {id: 'cv-1', operations: [{op: 'set_field', field: 'heading', value: 'x'}]})).text).toContain('a cv has no field heading')
        expect((await call('edit_document', {id: 'cv-1', operations: [{op: 'add_section', kind: 'family', title: 'Family'}]})).text).toContain("a cv can't have a section of family")
        expect((await call('edit_document', {id: 'cv-1', operations: [{op: 'set_text', section: 'Experience', text: 'x'}]})).text).toContain('"Experience" is a section of entries, not text')
    })

    it('keeps the levels of skills that stay when a group is set', async () => {
        const reply = await call('edit_document', {id: 'cv-1', operations: [{op: 'set_tags', section: 'Languages', items: ['English (Advanced)', 'French (Beginner)', 'Bangla (Native)']}]})
        const languages = cvIn('cv-1').sections.find((section) => section.title === 'Languages')
        const before = sampleCv().sections.find((section) => section.title === 'Languages')
        const levelOf = (group: {items: string[]; levels: number[]}, name: string) => group.levels[group.items.findIndex((item) => item.startsWith(name))]

        expect(reply.isError).toBe(false)
        expect(languages?.kind === 'tags' && before?.kind === 'tags' && levelOf(languages.groups[0], 'Bangla')).toBe(before?.kind === 'tags' && levelOf(before.groups[0], 'Bangla'))
        expect(languages?.kind === 'tags' && languages.groups[0].items).toEqual(['English (Advanced)', 'French (Beginner)', 'Bangla (Native)'])
    })

    it('understands dates and heights in a biodata, and its heading and family', async () => {
        const reply = await call('edit_document', {
            id: 'bio-1',
            operations: [
                {op: 'set_field', field: 'heading', value: 'With blessings'},
                {op: 'set_details', section: 'Personal details', rows: [{label: 'Date of birth', value: '1995-04-02'}, {label: 'Height', value: '5\'6"'}, {label: 'Hobbies', value: 'Cricket'}]},
                {op: 'set_family', section: 'Family', members: [{relation: 'Father', name: 'John Doe', work: 'Teacher'}]},
            ],
        })
        const biodata = biodataIn('bio-1')
        const details = biodata.sections.find((section) => section.title === 'Personal details')
        const family = biodata.sections.find((section) => section.kind === 'family')

        expect(reply.isError).toBe(false)
        expect(biodata.heading.text).toBe('With blessings')
        expect(details?.kind === 'details' && details.rows.map((row) => (row.kind === 'date' ? row.date : row.kind === 'height' ? row.cm : row.value))).toEqual(['1995-04-02', 168, 'Cricket'])
        expect(family?.kind === 'family' && family.members).toEqual([{id: expect.any(String), visible: true, relation: 'Father', name: 'John Doe', work: 'Teacher', note: ''}])
        expect((await call('edit_document', {id: 'bio-1', operations: [{op: 'set_details', section: 'Personal details', rows: [{label: 'Date of birth', value: 'April 1995'}]}]})).text).toContain('Date of birth is a date: give it as YYYY-MM-DD')
    })

    it('reads heights however people write them', () => {
        expect([heightOf('163 cm'), heightOf('163'), heightOf('5\'4"'), heightOf('5 ft 4 in'), heightOf('5′4″'), heightOf('tall')]).toEqual([163, 163, 163, 163, 163, null])
    })
})

describe('edit_document on the open document', () => {
    it('changes it in the editor as one step to undo, unsaved, with a message', async () => {
        const cv = sampleCv()
        useDocumentStore.setState({currentId: 'cv-1', kind: 'cv', name: 'Jane Doe', content: cv, savedContent: cv})

        const reply = await call('edit_document', {id: 'cv-1', operations: [{op: 'rename_section', section: 'Projects', title: 'Side projects'}]})
        const state = useDocumentStore.getState()

        expect(reply.text).toMatch(/^Changed in the editor, where it's open: renamed Projects to Side projects\. It isn't saved yet/)
        expect((state.content as Cv).sections.some((section) => section.title === 'Side projects')).toBe(true)
        expect(state.toast).toEqual({message: "Claude renamed Projects to Side projects in Jane Doe. It isn't saved yet.", undoable: true})
        expect(app.WriteDocument).not.toHaveBeenCalled()

        state.undo()
        expect(useDocumentStore.getState().content).toBe(cv)
    })
})

describe('set_design', () => {
    it('changes only what it is given, and refuses what the kind lacks', async () => {
        const reply = await call('set_design', {id: 'cv-1', template: 'modern', font: 'lato', atsMode: true})

        expect(reply.isError).toBe(false)
        expect(cvIn('cv-1').design).toMatchObject({template: 'modern', font: 'lato', atsMode: true, paper: 'a4'})
        expect((await call('set_design', {id: 'cv-1', template: 'heritage'})).text).toContain('There\'s no template "heritage" for a CV. They are: classic,')
        expect((await call('set_design', {id: 'bio-1', atsMode: true})).text).toBe('A biodata has no atsMode.')
        expect((await call('set_design', {id: 'cv-1', accent: 'blue'})).text).toContain('#rrggbb')
        expect((await call('set_design', {id: 'cv-1'})).text).toBe('Give at least one thing to change.')
    })
})

describe('making and copying documents', () => {
    it('makes a document, filled in, under a name not already taken', async () => {
        const reply = await call('create_document', {kind: 'cv', name: 'Jane Doe', template: 'minimal', operations: [{op: 'set_field', field: 'name', value: 'Jane Doe'}, {op: 'set_text', section: 'Summary', text: 'Engineer.'}]})
        const id = (reply.structured as {id: string}).id
        const made = parseDocument(files.get(id) as string, cvType)

        expect(reply.text).toMatch(/^Made the CV "Jane Doe 2", id .+, and saved it\. Then: set the name; rewrote Summary\./)
        expect(made.name).toBe('Jane Doe 2')
        expect(made.content.design.template).toBe('minimal')
        expect(made.content.sections[0]).toMatchObject({title: 'Summary', text: 'Engineer.'})
    })

    it('copies a document under a new name', async () => {
        const reply = await call('duplicate_document', {id: 'cv-1', name: 'Jane Doe – Northwind'})
        const id = (reply.structured as {id: string}).id

        expect(reply.text).toBe(`Saved a copy of "Jane Doe" as "Jane Doe – Northwind", id ${id}.`)
        expect(parseDocument(files.get(id) as string, cvType).content.sections).toEqual(sampleCv().sections)
        expect(app.RecordActivity).toHaveBeenCalledWith(expect.objectContaining({summary: 'copied "Jane Doe"', documentId: id}))
    })
})

describe('putting back a change', () => {
    it('writes the copy back, keeping what was there as a copy too', async () => {
        await call('edit_document', {id: 'cv-1', operations: [{op: 'set_field', field: 'name', value: 'Someone else'}]})
        const changed = files.get('cv-1')

        await putBack({at: '', client: 'Claude', documentId: 'cv-1', documentName: 'Jane Doe', summary: 'set the name', copy: 'cv-1~1.json'} satisfies Activity)

        expect(cvIn('cv-1').person.name).toBe('Jane Doe')
        expect(textOf(app.KeepCopy.mock.calls.at(-1)?.[1])).toBe(changed)
    })
})
