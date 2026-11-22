/**
 * The sections a document is made of, shared by every type made of sections: a CV and a
 * biodata. Each type says which kinds it allows; a section of a kind means the same in
 * both, so the editor and the render model handle it once.
 */

import {z} from 'zod'
import {LANGUAGE_IDS} from '../core/labels/labels'

let counter = 0

/** An id unique within this session and, with the time in it, across files. */
export const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

/** A month as "2023-01", or "" when not given. */
const month = z.union([z.literal(''), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)])

/** A day as "1996-03-12", or "" when not given. */
const day = z.union([z.literal(''), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)])

export const entrySchema = z.object({
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

export const tagGroupSchema = z.object({
    id: z.string().min(1),
    visible: z.boolean(),
    label: z.string(),
    items: z.array(z.string()),
    /** Draw a level beside each item, as for languages. */
    showLevels: z.boolean(),
    /** Each item's level, 0 to 5 in half steps, in the items' order. 0 draws no level. */
    levels: z.array(z.number().min(0).max(5).multipleOf(0.5)),
})

const rowBase = {
    id: z.string().min(1),
    visible: z.boolean(),
    label: z.string(),
}

/**
 * One line of a details section, such as "Nationality: British". Most hold words; a date
 * or a height holds a value the app understands, so it can show an age or both units.
 */
export const detailRowSchema = z.discriminatedUnion('kind', [
    z.object({...rowBase, kind: z.literal('text'), value: z.string()}),
    z.object({...rowBase, kind: z.literal('date'), date: day, show: z.enum(['date', 'age', 'both'])}),
    /** In centimetres, 0 when not given. */
    z.object({...rowBase, kind: z.literal('height'), cm: z.number().min(0).max(300), show: z.enum(['ft-in', 'cm', 'both'])}),
])

/** One of the family, as a biodata lists them: "Brother · John Doe · Engineer · Married". */
export const familyMemberSchema = z.object({
    id: z.string().min(1),
    visible: z.boolean(),
    relation: z.string(),
    name: z.string(),
    work: z.string(),
    note: z.string(),
})

const sectionBase = {
    id: z.string().min(1),
    title: z.string(),
    visible: z.boolean(),
}

/**
 * How a document writes its own words, part of its design: the language of the headings,
 * labels, dates and "Present" the app writes, its digits, and the font for other scripts.
 */
export const writingFields = {
    language: z.enum(LANGUAGE_IDS),
    /** Numbers the app writes, in the language's own digits or as 0 to 9. */
    digits: z.enum(['latin', 'native']),
    /** The font for Bangla letters: "" for the one that suits the main font, else an id from SCRIPT_FONTS. */
    scriptFont: z.string(),
}

/** What a document's design says about writing, as the functions that write dates take it. */
export interface Writing {
    readonly language: string
    readonly digits: 'latin' | 'native'
    /** How an entry's months are written; a biodata, which has no say, writes them by name. */
    readonly dateStyle?: 'month-name' | 'numeric-slash' | 'numeric-dot' | 'year'
}

export const ENGLISH: Writing = {language: 'en', digits: 'latin'}

export const textSection = z.object({...sectionBase, kind: z.literal('text'), text: z.string()})
export const entriesSection = z.object({...sectionBase, kind: z.literal('entries'), entries: z.array(entrySchema)})
export const tagsSection = z.object({...sectionBase, kind: z.literal('tags'), groups: z.array(tagGroupSchema)})
export const detailsSection = z.object({...sectionBase, kind: z.literal('details'), rows: z.array(detailRowSchema)})
export const familySection = z.object({...sectionBase, kind: z.literal('family'), members: z.array(familyMemberSchema)})

export type Entry = z.infer<typeof entrySchema>
export type TagGroup = z.infer<typeof tagGroupSchema>
export type DetailRow = z.infer<typeof detailRowSchema>
export type FamilyMember = z.infer<typeof familyMemberSchema>

/** A section of any kind any type allows. */
export type Section =
    | z.infer<typeof textSection>
    | z.infer<typeof entriesSection>
    | z.infer<typeof tagsSection>
    | z.infer<typeof detailsSection>
    | z.infer<typeof familySection>

export type SectionKind = Section['kind']

/** Any document made of sections, as the editor's shared parts see it. */
export interface Sectioned {
    readonly sections: readonly Section[]
}

export const emptyEntry = (): Entry => ({
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

export const emptyFamilyMember = (relation = ''): FamilyMember => ({id: newId('member'), visible: true, relation, name: '', work: '', note: ''})
