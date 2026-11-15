/**
 * The app's one type of document: a CV.
 *
 * A CV is the person, an ordered list of sections, and how it looks. Sections are one
 * list rather than a fixed field each, so reordering, hiding and adding a custom
 * section are all the same thing.
 */

import {z} from 'zod'
import type {DocumentType} from '../core/document/document-file'
import {cvFromV1} from './import-v1'
import {withWordLevels} from './levels'

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
    /** A square photo as a JPEG data URL, or "" for none. Kept small, inside the CV file. */
    photo: z.union([z.literal(''), z.string().regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/)]),
    /** Details kept but left off the page. */
    hide: z.array(z.enum(['email', 'phone', 'location', 'photo'])),
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
    /** Parts kept but left off the page. */
    hide: z.array(z.enum(['location', 'dates', 'summary'])),
})

const tagGroupSchema = z.object({
    id: z.string().min(1),
    visible: z.boolean(),
    label: z.string(),
    items: z.array(z.string()),
    /** Draw a level beside each item, as for languages. */
    showLevels: z.boolean(),
    /** Each item's level, 0 to 5 in half steps, in the items' order. 0 draws no level. */
    levels: z.array(z.number().min(0).max(5).multipleOf(0.5)),
})

/** A day as "1996-03-12", or "" when not given. */
const day = z.union([z.literal(''), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)])

const rowBase = {
    id: z.string().min(1),
    visible: z.boolean(),
    label: z.string(),
}

/**
 * One line of a details section, such as "Nationality: British". Most hold words; a date
 * or a height holds a value the app understands, so it can show an age or both units.
 */
const detailRowSchema = z.discriminatedUnion('kind', [
    z.object({...rowBase, kind: z.literal('text'), value: z.string()}),
    z.object({...rowBase, kind: z.literal('date'), date: day, show: z.enum(['date', 'age', 'both'])}),
    /** In centimetres, 0 when not given. */
    z.object({...rowBase, kind: z.literal('height'), cm: z.number().min(0).max(300), show: z.enum(['ft-in', 'cm', 'both'])}),
])

const sectionBase = {
    id: z.string().min(1),
    title: z.string(),
    visible: z.boolean(),
}

const sectionSchema = z.discriminatedUnion('kind', [
    z.object({...sectionBase, kind: z.literal('text'), text: z.string()}),
    z.object({...sectionBase, kind: z.literal('entries'), entries: z.array(entrySchema)}),
    z.object({...sectionBase, kind: z.literal('tags'), groups: z.array(tagGroupSchema)}),
    z.object({...sectionBase, kind: z.literal('details'), rows: z.array(detailRowSchema)}),
])

const designSchema = z.object({
    template: z.string().min(1),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    /** An id from CV_FONTS. An unknown one falls back to the first. */
    font: z.string().min(1),
    fontSize: z.number().min(8).max(13),
    paper: z.enum(['a4', 'us-letter']),
    margins: z.enum(['narrow', 'normal', 'wide']),
    spacing: z.enum(['compact', 'normal', 'relaxed']),
    /** One column whatever the template, for screening systems that read columns badly. */
    atsMode: z.boolean(),
    /** How levels on lists are drawn: the template's own way, or one picked here. */
    levelStyle: z.enum(['template', 'dots', 'bar', 'squares']),
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
export type CvDetailRow = z.infer<typeof detailRowSchema>
export type CvDesign = Cv['design']
export type EntryPart = CvEntry['hide'][number]
export type PersonPart = CvPerson['hide'][number]

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
    hide: [],
})

export const DEFAULT_DESIGN: CvDesign = {template: 'classic', accent: '#1f4e79', font: 'inter', fontSize: 10, paper: 'a4', margins: 'normal', spacing: 'normal', atsMode: false, levelStyle: 'template'}

/** A new CV: the sections most people need, empty, under the headings ATS parsers look for. */
export function emptyCv(): Cv {
    return {
        person: {name: '', headline: '', email: '', phone: '', location: '', links: [], photo: '', hide: []},
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
    version: 8,
    content: cvSchema,
    empty: emptyCv,
    migrations: {
        // Version 2 added the font, margins and spacing to the design.
        1: (content) => {
            const cv = content as {design?: Record<string, unknown>}

            return {...cv, design: {font: 'inter', margins: 'normal', spacing: 'normal', ...cv.design}}
        },
        // Version 3 added ATS mode.
        2: (content) => {
            const cv = content as {design?: Record<string, unknown>}

            return {...cv, design: {atsMode: false, ...cv.design}}
        },
        // Version 4 let a person and each entry keep details off the page.
        3: (content) => {
            const cv = content as {person?: Record<string, unknown>; sections?: {kind?: string; entries?: Record<string, unknown>[]}[]}

            return {
                ...cv,
                person: {hide: [], ...cv.person},
                sections: (cv.sections ?? []).map((section) => (section.kind === 'entries' ? {...section, entries: (section.entries ?? []).map((entry) => ({hide: [], ...entry}))} : section)),
            }
        },
        // Version 5 added a photo.
        4: (content) => {
            const cv = content as {person?: Record<string, unknown>}

            return {...cv, person: {photo: '', ...cv.person}}
        },
        // Version 6 added levels to list items. Groups whose every item already named one,
        // as "Bangla (Native)" did, show them, as the Professional template used to.
        5: (content) => {
            const cv = content as {sections?: {kind?: string; groups?: {items?: string[]}[]}[]}

            return {
                ...cv,
                sections: (cv.sections ?? []).map((section) =>
                    section.kind === 'tags'
                        ? {
                              ...section,
                              groups: (section.groups ?? []).map((group) => ({...group, ...withWordLevels(group.items ?? [])})),
                          }
                        : section,
                ),
            }
        },
        // Version 7 let the design pick how levels are drawn.
        6: (content) => {
            const cv = content as {design?: Record<string, unknown>}

            return {...cv, design: {levelStyle: 'template', ...cv.design}}
        },
        // Version 8 added details sections. Older files have none, so nothing changes.
        7: (content) => content,
    },
    // Loaded on use, so tests and the library list never pull in the layout engine.
    thumbnail: async (cv) => (await import('./thumbnail')).cvThumbnail(cv),
    adopt: (raw) => cvFromV1(raw),
}
