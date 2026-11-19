/**
 * The words the app writes on a document for the person, in each language a document can
 * be written in: section headings, labels, "Present", month names and digits. The
 * interface itself stays in English; these are only what goes on the page.
 *
 * Each table has the same keys, so a heading or label can be carried from one language to
 * another, and a test checks none is missing.
 */

import {bn} from './bn'
import {en} from './en'
import {hi} from './hi'
import {mr} from './mr'
import {ur} from './ur'

export const LANGUAGE_IDS = ['en', 'bn', 'hi', 'mr', 'ur'] as const

export type DocumentLanguage = (typeof LANGUAGE_IDS)[number]

export interface Labels {
    /** Section headings. */
    readonly sections: {
        readonly summary: string
        readonly experience: string
        readonly education: string
        readonly skills: string
        readonly projects: string
        readonly certifications: string
        readonly languages: string
        readonly volunteering: string
        readonly awards: string
        readonly publications: string
        readonly interests: string
        readonly personalDetails: string
        readonly custom: string
        readonly details: string
        readonly work: string
        readonly family: string
        readonly aboutMe: string
        readonly expectations: string
        readonly hobbies: string
        readonly contact: string
        readonly horoscope: string
        readonly religiousPractice: string
        readonly lifestyle: string
        readonly moreAboutMe: string
    }
    /** Labels in details sections, and relations in a family. */
    readonly rows: {
        readonly dateOfBirth: string
        readonly height: string
        readonly maritalStatus: string
        readonly religion: string
        readonly nationality: string
        readonly homeTown: string
        readonly currentCity: string
        readonly contactPerson: string
        readonly relation: string
        readonly phone: string
        readonly address: string
        readonly timeOfBirth: string
        readonly placeOfBirth: string
        readonly rashi: string
        readonly nakshatra: string
        readonly gotra: string
        readonly manglik: string
        readonly sect: string
        readonly prayer: string
        readonly fasting: string
        readonly religiousEducation: string
        readonly diet: string
        readonly smoking: string
        readonly drinking: string
        readonly languagesKnown: string
        readonly complexion: string
        readonly bloodGroup: string
        readonly weight: string
        readonly father: string
        readonly mother: string
        readonly brother: string
        readonly sister: string
    }
    /** Words in dates, ages and heights. */
    readonly page: {
        readonly present: string
        /** January to December, as dates on a CV write them: short where the language shortens them. */
        readonly monthsShort: readonly string[]
        readonly months: readonly string[]
        /** An age: "1 year", "30 years". */
        readonly years: (count: string, one: boolean) => string
        readonly cm: string
        /** A family table's column headings. */
        readonly name: string
        readonly work: string
        readonly note: string
    }
}

export interface LanguageInfo {
    readonly id: DocumentLanguage
    /** The language's name in English, for the interface. */
    readonly name: string
    /** Its name in itself, shown beside the English one. */
    readonly own: string
    /** What Typst is told, for line breaking and hyphenation. */
    readonly lang: string
    /** Written in Latin letters, so headings can be spaced out or set in capitals. */
    readonly latin: boolean
    /** Its own digits, 0 to 9, or null when it uses 0 to 9. */
    readonly digits: string | null
    /** Written right to left. */
    readonly rtl?: boolean
}

export const LANGUAGES: readonly LanguageInfo[] = [
    {id: 'en', name: 'English', own: 'English', lang: 'en', latin: true, digits: null},
    {id: 'bn', name: 'Bangla', own: 'বাংলা', lang: 'bn', latin: false, digits: '০১২৩৪৫৬৭৮৯'},
    {id: 'hi', name: 'Hindi', own: 'हिन्दी', lang: 'hi', latin: false, digits: '०१२३४५६७८९'},
    {id: 'mr', name: 'Marathi', own: 'मराठी', lang: 'mr', latin: false, digits: '०१२३४५६७८९'},
    {id: 'ur', name: 'Urdu', own: 'اردو', lang: 'ur', latin: false, digits: '۰۱۲۳۴۵۶۷۸۹', rtl: true},
]

const TABLES: Readonly<Record<DocumentLanguage, Labels>> = {en, bn, hi, mr, ur}

export const isLanguage = (value: string): value is DocumentLanguage => value in TABLES

export const languageInfo = (language: string): LanguageInfo => LANGUAGES.find((info) => info.id === language) ?? LANGUAGES[0]

export const labelsFor = (language: string): Labels => TABLES[isLanguage(language) ? language : 'en']

/** Every heading and label in two languages, as pairs: the same key's words in each. */
function pairs(from: Labels, to: Labels): [string, string][] {
    return (['sections', 'rows'] as const).flatMap((group) => Object.keys(from[group]).map((key) => [from[group][key as keyof Labels[typeof group]], to[group][key as keyof Labels[typeof group]]] as [string, string]))
}

/**
 * Carries a heading or label from one language to another when it's one of the app's
 * own, and leaves it as it is when the person wrote it themselves.
 */
export function translator(from: string, to: string): (text: string) => string {
    const known = new Map(pairs(labelsFor(from), labelsFor(to)).map(([source, target]) => [source.toLowerCase(), target]))

    return (text) => known.get(text.trim().toLowerCase()) ?? text
}

/** Every heading the app writes, in every language, lower case: what screening and import recognise. */
export const KNOWN_LABELS: readonly string[] = [...new Set(Object.values(TABLES).flatMap((table) => [...Object.values(table.sections), ...Object.values(table.rows)].map((text) => text.toLowerCase())))]

/** Digits 0 to 9 written in a language's own digits, when it has them and they're wanted. */
export function withDigits(text: string, language: string, native: boolean): string {
    const digits = languageInfo(language).digits

    return digits && native ? text.replace(/[0-9]/g, (digit) => digits[Number(digit)]) : text
}

/** Bangla, Devanagari and Arabic digits read as 0 to 9, so a date written either way can be understood. */
export const asLatinDigits = (text: string): string =>
    text
        .replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)))
        .replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)))
        .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))

/** Every language's month names but English, January first, for reading dates written in them. */
export const OTHER_MONTHS: readonly (readonly string[])[] = LANGUAGE_IDS.filter((language) => language !== 'en').map((language) => TABLES[language].page.months)
