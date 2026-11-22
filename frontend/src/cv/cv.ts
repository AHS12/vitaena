/**
 * A CV: the app's first type of document.
 *
 * A CV is the person, an ordered list of sections, and how it looks. Sections are one
 * list rather than a fixed field each, so reordering, hiding and adding a custom
 * section are all the same thing.
 */

import {z} from 'zod'
import type {DocumentType} from '../core/document/document-file'
import {COUNTRY_IDS, DATE_STYLES} from './countries'
import {cvFromV1} from './import-v1'
import {withWordLevels} from './levels'
import {labelsFor, type DocumentLanguage} from '../core/labels/labels'
import {detailsSection, emptyEntry, entriesSection, newId, tagsSection, textSection, writingFields, type DetailRow, type Entry, type TagGroup} from './sections'

export {emptyEntry, newId}

/** The kinds of section a CV can have. */
const sectionSchema = z.discriminatedUnion('kind', [textSection, entriesSection, tagsSection, detailsSection])

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
    /** Where it's for, which Check gives advice for: an id from COUNTRIES. */
    country: z.enum(COUNTRY_IDS),
    /** How entries' months are written: "Jan 2020", "01/2020", "01.2020" or "2020". */
    dateStyle: z.enum(DATE_STYLES),
    ...writingFields,
})

const cvSchema = z.object({
    person: personSchema,
    sections: z.array(sectionSchema),
    design: designSchema,
})

export type Cv = z.infer<typeof cvSchema>
export type CvPerson = Cv['person']
export type CvSection = Cv['sections'][number]
export type CvEntry = Entry
export type CvTagGroup = TagGroup
export type CvDetailRow = DetailRow
export type CvDesign = Cv['design']
export type EntryPart = CvEntry['hide'][number]
export type PersonPart = CvPerson['hide'][number]

/** A CV's numbers are 0 to 9 unless chosen otherwise, as employers read them. */
export const DEFAULT_DESIGN: CvDesign = {template: 'classic', accent: '#1f4e79', font: 'inter', fontSize: 10, paper: 'a4', margins: 'normal', spacing: 'normal', atsMode: false, levelStyle: 'template', country: 'any', dateStyle: 'month-name', language: 'en', digits: 'latin', scriptFont: ''}

/** A new CV: the sections most people need, empty, under the headings ATS parsers look for, in its language. */
export function emptyCv(language: DocumentLanguage = 'en'): Cv {
    const {sections} = labelsFor(language)

    return {
        person: {name: '', headline: '', email: '', phone: '', location: '', links: [], photo: '', hide: []},
        sections: [
            {id: newId('section'), kind: 'text', title: sections.summary, visible: true, text: ''},
            {id: newId('section'), kind: 'entries', title: sections.experience, visible: true, entries: []},
            {id: newId('section'), kind: 'entries', title: sections.education, visible: true, entries: []},
            {id: newId('section'), kind: 'tags', title: sections.skills, visible: true, groups: []},
        ],
        design: {...DEFAULT_DESIGN, language},
    }
}

export const cvType: DocumentType<Cv> = {
    kind: 'cv',
    noun: 'CV',
    version: 10,
    content: cvSchema,
    empty: () => emptyCv(),
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
        // Version 9 added the document's language, its digits and a font for Bangla.
        8: (content) => {
            const cv = content as {design?: Record<string, unknown>}

            return {...cv, design: {language: 'en', digits: 'latin', scriptFont: '', ...cv.design}}
        },
        // Version 10 added where a CV is for, and how its dates are written.
        9: (content) => {
            const cv = content as {design?: Record<string, unknown>}

            return {...cv, design: {country: 'any', dateStyle: 'month-name', ...cv.design}}
        },
    },
    // Loaded on use, so tests and the library list never pull in the layout engine.
    thumbnail: async (cv) => (await import('./thumbnail')).cvThumbnail(cv),
    adopt: (raw) => cvFromV1(raw),
}
