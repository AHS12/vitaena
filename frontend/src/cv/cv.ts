/**
 * The app's one type of document: a CV.
 *
 * A CV is the person, an ordered list of sections, and how it looks. Sections are one
 * list rather than a fixed field each, so reordering, hiding and adding a custom
 * section are all the same thing.
 */

import {z} from 'zod'
import type {DocumentType} from '../core/document/document-file'

/** A month as "2023-01", or "" when not given. */
const month = z.union([z.literal(''), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)])

const linkSchema = z.object({
    id: z.string().min(1),
    label: z.string(),
    url: z.string(),
})

const personSchema = z.object({
    name: z.string(),
    headline: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    links: z.array(linkSchema),
})

const entrySchema = z.object({
    id: z.string().min(1),
    visible: z.boolean(),
    /** The role, degree or project name. */
    title: z.string(),
    /** The company, school or client. */
    org: z.string(),
    location: z.string(),
    start: month,
    end: month,
    current: z.boolean(),
    summary: z.string(),
    bullets: z.array(z.string()),
})

const tagGroupSchema = z.object({
    id: z.string().min(1),
    visible: z.boolean(),
    label: z.string(),
    items: z.array(z.string()),
})

const sectionBase = {
    id: z.string().min(1),
    title: z.string(),
    visible: z.boolean(),
}

const sectionSchema = z.discriminatedUnion('kind', [
    z.object({...sectionBase, kind: z.literal('text'), text: z.string()}),
    z.object({...sectionBase, kind: z.literal('entries'), entries: z.array(entrySchema)}),
    z.object({...sectionBase, kind: z.literal('tags'), groups: z.array(tagGroupSchema)}),
])

const designSchema = z.object({
    template: z.string().min(1),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    fontSize: z.number().min(8).max(13),
    paper: z.enum(['a4', 'us-letter']),
})

const cvSchema = z.object({
    person: personSchema,
    sections: z.array(sectionSchema),
    design: designSchema,
})

export type Cv = z.infer<typeof cvSchema>
export type CvPerson = Cv['person']
export type CvSection = Cv['sections'][number]
export type CvEntry = z.infer<typeof entrySchema>
export type CvTagGroup = z.infer<typeof tagGroupSchema>
export type CvDesign = Cv['design']

let counter = 0

/** An id unique within this session and, with the time in it, across files. */
export const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export const emptyEntry = (): CvEntry => ({
    id: newId('entry'),
    visible: true,
    title: '',
    org: '',
    location: '',
    start: '',
    end: '',
    current: false,
    summary: '',
    bullets: [],
})

export const DEFAULT_DESIGN: CvDesign = {template: 'classic', accent: '#1f4e79', fontSize: 10, paper: 'a4'}

/** A new CV: the sections most people need, empty, under the headings ATS parsers look for. */
export function emptyCv(): Cv {
    return {
        person: {name: '', headline: '', email: '', phone: '', location: '', links: []},
        sections: [
            {id: newId('section'), kind: 'text', title: 'Summary', visible: true, text: ''},
            {id: newId('section'), kind: 'entries', title: 'Experience', visible: true, entries: []},
            {id: newId('section'), kind: 'entries', title: 'Education', visible: true, entries: []},
            {id: newId('section'), kind: 'tags', title: 'Skills', visible: true, groups: []},
        ],
        design: {...DEFAULT_DESIGN},
    }
}

export const cvType: DocumentType<Cv> = {
    kind: 'cv',
    noun: 'CV',
    version: 1,
    content: cvSchema,
    empty: emptyCv,
    // Loaded on use, so tests and the library list never pull in the layout engine.
    thumbnail: async (cv) => (await import('./thumbnail')).cvThumbnail(cv),
}
