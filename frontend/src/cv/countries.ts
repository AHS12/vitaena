/**
 * Where a CV is for: the places whose employers expect a CV of their own shape. What
 * differs is mostly what a CV says and leaves out (a photo, a date of birth), how dates
 * are written and the paper, more than how it looks. Picking a place sets those once,
 * with Undo, and Check then says what that place's employers would notice.
 *
 * Guides disagree on the details, so the app suggests and never forces; a job advert's
 * own instructions always win.
 */

import {labelsFor, type DocumentLanguage, type Labels} from '../core/labels/labels'
import type {Cv, CvDetailRow, CvSection} from './cv'
import {emptyDetailRow} from './details'
import {newId} from './sections'

export const COUNTRY_IDS = ['any', 'us', 'ca', 'uk-ie', 'au-nz', 'europass', 'dach', 'fr-south', 'nl-nordic', 'gulf', 'south-asia'] as const

export type CountryId = (typeof COUNTRY_IDS)[number]

/** How an entry's months are written: "Jan 2020", "01/2020", "01.2020" or "2020". */
export const DATE_STYLES = ['month-name', 'numeric-slash', 'numeric-dot', 'year'] as const

export type DateStyle = (typeof DATE_STYLES)[number]

/** How usual something is on a CV there: a photo, or a date of birth and the like. */
export type Expected = 'leave-out' | 'optional' | 'usual'

export interface Country {
    readonly id: CountryId
    /** As the list shows it. */
    readonly name: string
    /** As a sentence says it: "For the US", "German employers". */
    readonly short: string
    readonly employers: string
    readonly paper: 'a4' | 'us-letter'
    readonly dateStyle: DateStyle
    /** The language its CVs are usually written in, offered and never chosen for the person. */
    readonly language: DocumentLanguage | null
    /** Template ids that suit it, the best first. */
    readonly templates: readonly string[]
    /** Why those, in a line. */
    readonly why: string
    readonly photo: Expected
    /** A date of birth, nationality and marital status. */
    readonly personal: Expected
    /** Most pages its readers expect, or 0 for no limit. */
    readonly pages: number
    /** The rows a new CV's personal details start with, or none for no such section. */
    readonly rows: readonly (keyof Labels['rows'])[]
    /** Sections a new CV gets besides the usual four. */
    readonly sections: readonly (keyof Labels['sections'])[]
    /** Ends with a place, a date and a signature, as German CVs do. */
    readonly closing: boolean
}

export const COUNTRIES: readonly Country[] = [
    {
        id: 'any',
        name: 'Anywhere',
        short: 'anywhere',
        employers: 'Employers',
        paper: 'a4',
        dateStyle: 'month-name',
        language: null,
        templates: [],
        why: '',
        photo: 'optional',
        personal: 'optional',
        pages: 0,
        rows: [],
        sections: [],
        closing: false,
    },
    {
        id: 'us',
        name: 'United States',
        short: 'the US',
        employers: 'US employers',
        paper: 'us-letter',
        dateStyle: 'month-name',
        language: 'en',
        templates: ['harvard', 'classic', 'executive', 'compact', 'minimal'],
        why: 'US employers expect one page, plain and without a photo or personal details.',
        photo: 'leave-out',
        personal: 'leave-out',
        pages: 2,
        rows: [],
        sections: [],
        closing: false,
    },
    {
        id: 'ca',
        name: 'Canada',
        short: 'Canada',
        employers: 'Canadian employers',
        paper: 'us-letter',
        dateStyle: 'month-name',
        language: null,
        templates: ['harvard', 'classic', 'executive', 'minimal'],
        why: 'Canadian employers expect up to two pages, without a photo or personal details.',
        photo: 'leave-out',
        personal: 'leave-out',
        pages: 2,
        rows: [],
        sections: [],
        closing: false,
    },
    {
        id: 'uk-ie',
        name: 'United Kingdom and Ireland',
        short: 'the UK and Ireland',
        employers: 'UK and Irish employers',
        paper: 'a4',
        dateStyle: 'month-name',
        language: 'en',
        templates: ['classic', 'minimal', 'modern', 'executive'],
        why: 'Two pages of A4 is usual, without a photo, date of birth or marital status.',
        photo: 'leave-out',
        personal: 'leave-out',
        pages: 2,
        rows: [],
        sections: [],
        closing: false,
    },
    {
        id: 'au-nz',
        name: 'Australia and New Zealand',
        short: 'Australia and New Zealand',
        employers: 'Australian and New Zealand employers',
        paper: 'a4',
        dateStyle: 'month-name',
        language: 'en',
        templates: ['classic', 'modern', 'minimal', 'timeline'],
        why: 'Two or three pages of A4, usually without a photo, often naming referees.',
        photo: 'leave-out',
        personal: 'optional',
        pages: 3,
        rows: [],
        sections: [],
        closing: false,
    },
    {
        id: 'europass',
        name: 'Europe (Europass)',
        short: 'Europe',
        employers: 'European employers',
        paper: 'a4',
        dateStyle: 'numeric-slash',
        language: null,
        templates: ['european', 'classic', 'timeline', 'modern'],
        why: 'Laid out like a Europass CV: dates as 01/2020, languages on the European scale, digital skills.',
        photo: 'optional',
        personal: 'optional',
        pages: 0,
        rows: ['nationality'],
        sections: ['languages', 'digitalSkills'],
        closing: false,
    },
    {
        id: 'dach',
        name: 'Germany, Austria and Switzerland',
        short: 'Germany, Austria and Switzerland',
        employers: 'German-speaking employers',
        paper: 'a4',
        dateStyle: 'numeric-dot',
        language: 'de',
        templates: ['lebenslauf', 'timeline', 'professional', 'classic'],
        why: 'A tabular Lebenslauf: dates as 01.2020 in a left column, personal details, at most two pages, often a photo and a signed date at the end.',
        photo: 'usual',
        personal: 'usual',
        pages: 2,
        rows: ['dateOfBirth', 'placeOfBirth', 'nationality', 'maritalStatus'],
        sections: ['languages'],
        closing: true,
    },
    {
        id: 'fr-south',
        name: 'France and southern Europe',
        short: 'France and southern Europe',
        employers: 'Employers in France and southern Europe',
        paper: 'a4',
        dateStyle: 'numeric-slash',
        language: null,
        templates: ['professional', 'sidebar', 'bold', 'modern'],
        why: 'One or two pages of A4, often with a photo, and languages with their levels.',
        photo: 'usual',
        personal: 'optional',
        pages: 2,
        rows: ['nationality'],
        sections: ['languages'],
        closing: false,
    },
    {
        id: 'nl-nordic',
        name: 'Netherlands and the Nordics',
        short: 'the Netherlands and the Nordics',
        employers: 'Dutch and Nordic employers',
        paper: 'a4',
        dateStyle: 'numeric-slash',
        language: null,
        templates: ['minimal', 'classic', 'modern'],
        why: 'Short and plain: one or two pages, a photo if you like.',
        photo: 'optional',
        personal: 'optional',
        pages: 2,
        rows: [],
        sections: [],
        closing: false,
    },
    {
        id: 'gulf',
        name: 'Gulf (UAE, Saudi Arabia, Qatar)',
        short: 'the Gulf',
        employers: 'Gulf employers',
        paper: 'a4',
        dateStyle: 'month-name',
        language: null,
        templates: ['professional', 'sidebar', 'classic'],
        why: 'Two or three pages, a photo common, with nationality, visa status and driving licence near the top.',
        photo: 'usual',
        personal: 'usual',
        pages: 3,
        rows: ['nationality', 'visaStatus', 'drivingLicence', 'dateOfBirth', 'maritalStatus'],
        sections: [],
        closing: false,
    },
    {
        id: 'south-asia',
        name: 'South Asia (Bangladesh, India, Pakistan, Nepal)',
        short: 'South Asia',
        employers: 'South Asian employers',
        paper: 'a4',
        dateStyle: 'month-name',
        language: null,
        templates: ['professional', 'classic', 'sidebar'],
        why: 'Two or three pages of A4, often with a photo, personal details and a signed date at the end.',
        photo: 'usual',
        personal: 'usual',
        pages: 3,
        rows: ['dateOfBirth', 'nationality', 'maritalStatus'],
        sections: [],
        closing: true,
    },
]

export const countryOf = (id: string): Country => COUNTRIES.find((country) => country.id === id) ?? COUNTRIES[0]

export const isCountry = (value: string): value is CountryId => (COUNTRY_IDS as readonly string[]).includes(value)

/** A CV with one of Check's fixes for its place made: its photo hidden, or the place's paper. */
export function withFix(cv: Cv, fix: 'hide-photo' | 'paper'): Cv {
    return fix === 'hide-photo' ? {...cv, person: {...cv.person, hide: [...new Set([...cv.person.hide, 'photo' as const])]}} : {...cv, design: {...cv.design, paper: countryOf(cv.design.country).paper}}
}

/** Template ids in the order a list shows them for the place: those that suit it first. */
export function templatesFor(ids: readonly string[], id: string): {suited: string[]; rest: string[]} {
    const country = countryOf(id)
    const suited = country.templates.filter((template) => ids.includes(template))

    return {suited, rest: ids.filter((template) => !suited.includes(template))}
}

/**
 * A CV set for a place: its paper and date style, and, for a new CV, the sections its
 * CVs usually have, in the CV's language. A CV with work in it keeps its sections, and
 * its photo is never touched: Check offers to hide it.
 */
export function forCountry(cv: Cv, id: CountryId, fresh: boolean): Cv {
    const country = countryOf(id)

    if (id === 'any') {
        return {...cv, design: {...cv.design, country: id}}
    }

    const design = {...cv.design, country: id, paper: country.paper, dateStyle: country.dateStyle}

    if (!fresh) {
        return {...cv, design}
    }

    // A place whose CVs end with place, date and signature starts with the line on.
    const closing = country.closing ? {...cv.closing, show: true} : cv.closing

    const {sections, rows} = labelsFor(cv.design.language)
    const has = (title: string) => cv.sections.some((section) => section.title === title)
    // A date of birth is shown as a date: an age is for a biodata.
    const row = (key: keyof Labels['rows']): CvDetailRow => {
        const made = emptyDetailRow(key === 'dateOfBirth' ? 'date' : 'text', rows[key])

        return made.kind === 'date' ? {...made, show: 'date'} : made
    }
    const details: CvSection[] = country.rows.length > 0 && !has(sections.personalDetails) ? [{id: newId('section'), kind: 'details', title: sections.personalDetails, visible: true, rows: country.rows.map(row)}] : []
    const added: CvSection[] = country.sections.filter((key) => !has(sections[key])).map((key) => ({id: newId('section'), kind: 'tags', title: sections[key], visible: true, groups: []}))
    // Personal details sit near the top, as these places write them, after any summary.
    const at = cv.sections[0]?.kind === 'text' ? 1 : 0

    return {...cv, sections: [...cv.sections.slice(0, at), ...details, ...cv.sections.slice(at), ...added], closing, design}
}
