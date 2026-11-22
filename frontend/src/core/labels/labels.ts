/**
 * The words the app writes on a document for the person, in each language a document can
 * be written in: section headings, labels, "Present", month names and digits. The
 * interface itself stays in English; these are only what goes on the page.
 *
 * Each table has the same keys, so a heading or label can be carried from one language to
 * another, and a test checks none is missing.
 */

import {ar} from './ar'
import {bn} from './bn'
import {de} from './de'
import {en} from './en'
import {es} from './es'
import {fa} from './fa'
import {fr} from './fr'
import {hi} from './hi'
import {it} from './it'
import {ja} from './ja'
import {ko} from './ko'
import {mr} from './mr'
import {nl} from './nl'
import {pl} from './pl'
import {pt} from './pt'
import {ru} from './ru'
import {tr} from './tr'
import {uk} from './uk'
import {ur} from './ur'
import {zhHans} from './zh-hans'
import {zhHant} from './zh-hant'

export const LANGUAGE_IDS = ['en', 'bn', 'hi', 'mr', 'ur', 'ar', 'fa', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'tr', 'ru', 'uk'] as const

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
        readonly digitalSkills: string
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
        readonly visaStatus: string
        readonly drivingLicence: string
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
        /** The five skills of the European scale (CEFR), as Europass names them, and the words for a first language. */
        readonly cefr: {
            readonly listening: string
            readonly reading: string
            readonly interaction: string
            readonly production: string
            readonly writing: string
            /** Before the languages someone grew up with: "Mother tongue: Bangla". */
            readonly motherTongue: string
            /** Beside one of them, as its level: "Bangla (Native)". */
            readonly native: string
        }
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
    /** Written in letters with capitals, Latin or Cyrillic, so headings can be spaced out or set in capitals. */
    readonly latin: boolean
    /** Its own digits, 0 to 9, or null when it uses 0 to 9. */
    readonly digits: string | null
    /** Written right to left. */
    readonly rtl?: boolean
    /** The letters it's written in, when they aren't Latin: which script font Style offers. */
    readonly script?: 'bengali' | 'devanagari' | 'arabic' | 'cjk' | 'hangul'
    /**
     * Dates written year first, as East Asian languages write them: the word after the
     * year ("年") and after the day ("日"), and whether the parts are spaced.
     */
    readonly yearFirst?: {readonly year: string; readonly day: string; readonly spaced: boolean}
    /** Between the two dates of a range, when it isn't " – ". */
    readonly to?: string
    /** Between items in a list, when it isn't ", ": "، " in Arabic letters, "、" in Japanese. */
    readonly comma?: string
    /** How a day is written, when it isn't "{d} {m} {y}": "{d}. {m} {y}" in German, "{d} de {m} de {y}" in Spanish. */
    readonly day?: string
    /** Month names as a day says them, when they change there: "12 marca" in Polish, "12 марта" in Russian. */
    readonly dayMonths?: readonly string[]
}

export const LANGUAGES: readonly LanguageInfo[] = [
    {id: 'en', name: 'English', own: 'English', lang: 'en', latin: true, digits: null},
    {id: 'de', name: 'German', own: 'Deutsch', lang: 'de', latin: true, digits: null, day: '{d}. {m} {y}'},
    {id: 'fr', name: 'French', own: 'Français', lang: 'fr', latin: true, digits: null},
    {id: 'es', name: 'Spanish', own: 'Español', lang: 'es', latin: true, digits: null, day: '{d} de {m} de {y}'},
    {id: 'it', name: 'Italian', own: 'Italiano', lang: 'it', latin: true, digits: null},
    {id: 'pt', name: 'Portuguese', own: 'Português', lang: 'pt', latin: true, digits: null, day: '{d} de {m} de {y}'},
    {id: 'nl', name: 'Dutch', own: 'Nederlands', lang: 'nl', latin: true, digits: null},
    {
        id: 'pl',
        name: 'Polish',
        own: 'Polski',
        lang: 'pl',
        latin: true,
        digits: null,
        dayMonths: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'],
    },
    {id: 'tr', name: 'Turkish', own: 'Türkçe', lang: 'tr', latin: true, digits: null},
    {
        id: 'ru',
        name: 'Russian',
        own: 'Русский',
        lang: 'ru',
        latin: true,
        digits: null,
        day: '{d} {m} {y} г.',
        dayMonths: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    },
    {
        id: 'uk',
        name: 'Ukrainian',
        own: 'Українська',
        lang: 'uk',
        latin: true,
        digits: null,
        day: '{d} {m} {y} р.',
        dayMonths: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    },
    {id: 'bn', name: 'Bangla', own: 'বাংলা', lang: 'bn', latin: false, digits: '০১২৩৪৫৬৭৮৯', script: 'bengali'},
    {id: 'hi', name: 'Hindi', own: 'हिन्दी', lang: 'hi', latin: false, digits: '०१२३४५६७८९', script: 'devanagari'},
    {id: 'mr', name: 'Marathi', own: 'मराठी', lang: 'mr', latin: false, digits: '०१२३४५६७८९', script: 'devanagari'},
    {id: 'ur', name: 'Urdu', own: 'اردو', lang: 'ur', latin: false, digits: '۰۱۲۳۴۵۶۷۸۹', rtl: true, script: 'arabic', comma: '، '},
    {id: 'ar', name: 'Arabic', own: 'العربية', lang: 'ar', latin: false, digits: '٠١٢٣٤٥٦٧٨٩', rtl: true, script: 'arabic', comma: '، '},
    {id: 'ja', name: 'Japanese', own: '日本語', lang: 'ja', latin: false, digits: null, script: 'cjk', yearFirst: {year: '年', day: '日', spaced: false}, to: '～', comma: '、'},
    {id: 'zh-Hans', name: 'Chinese, simplified', own: '简体中文', lang: 'zh', latin: false, digits: null, script: 'cjk', yearFirst: {year: '年', day: '日', spaced: false}, comma: '，'},
    {id: 'zh-Hant', name: 'Chinese, traditional', own: '繁體中文', lang: 'zh', latin: false, digits: null, script: 'cjk', yearFirst: {year: '年', day: '日', spaced: false}, comma: '，'},
    {id: 'ko', name: 'Korean', own: '한국어', lang: 'ko', latin: false, digits: null, script: 'hangul', yearFirst: {year: '년', day: '일', spaced: true}, to: ' ~ '},
    {id: 'fa', name: 'Persian', own: 'فارسی', lang: 'fa', latin: false, digits: '۰۱۲۳۴۵۶۷۸۹', rtl: true, script: 'arabic', comma: '، '},
]

const TABLES: Readonly<Record<DocumentLanguage, Labels>> = {en, bn, hi, mr, ur, ar, fa, ja, 'zh-Hans': zhHans, 'zh-Hant': zhHant, ko, de, fr, es, it, pt, nl, pl, tr, ru, uk}

export const isLanguage = (value: string): value is DocumentLanguage => value in TABLES

/** A language as a choice in the interface: its own name, and the English one beside it. */
export const languageChoice = (info: LanguageInfo): {value: DocumentLanguage; label: string} => ({value: info.id, label: info.id === 'en' ? info.name : `${info.own} · ${info.name}`})

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

/**
 * Arabic's other month names: the Levant's and Iraq's, Algeria's and Tunisia's, and the
 * common ones spelt without hamzas, as they're often typed.
 */
const MORE_ARABIC_MONTHS: readonly (readonly string[])[] = [
    ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'],
    ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'],
]

const READ_BY_NAME = LANGUAGE_IDS.filter((language) => language !== 'en' && !languageInfo(language).yearFirst)

/**
 * Every language's month names but English, January first, for reading dates written in
 * them: in full, as a day says them ("marca"), and shortened, without the full stop
 * ("janv"). Languages that write months as numbers (1月) are read by their own pattern
 * instead.
 */
export const OTHER_MONTHS: readonly (readonly string[])[] = [
    ...READ_BY_NAME.map((language) => TABLES[language].page.months),
    ...READ_BY_NAME.flatMap((language) => {
        const day = languageInfo(language).dayMonths

        return day ? [day] : []
    }),
    ...READ_BY_NAME.map((language) => TABLES[language].page.monthsShort.map((name) => name.replace(/\.$/, ''))).filter((short, index) => short.join() !== TABLES[READ_BY_NAME[index]].page.months.join()),
    ...MORE_ARABIC_MONTHS,
]

/** A month and year as the language writes them: "Mar 2022", "মার্চ 2022", "2022年3月". */
export function monthAndYear(language: string, month: number, year: string): string {
    const name = labelsFor(language).page.monthsShort[month - 1]
    const first = languageInfo(language).yearFirst

    return first ? [`${year}${first.year}`, name].join(first.spaced ? ' ' : '') : `${name} ${year}`
}

/** A day as the language writes it: "12 March 1996", "12. März 1996", "1996年3月12日". */
export function dayMonthYear(language: string, day: number, month: number, year: number): string {
    const info = languageInfo(language)
    const name = (info.dayMonths ?? labelsFor(language).page.months)[month - 1]
    const first = info.yearFirst

    if (first) {
        return [`${year}${first.year}`, name, `${day}${first.day}`].join(first.spaced ? ' ' : '')
    }

    return (info.day ?? '{d} {m} {y}').replace('{d}', String(day)).replace('{m}', name).replace('{y}', String(year))
}

/** The comma between items in a list, in the language's own. */
export const commaIn = (language: string): string => languageInfo(language).comma ?? ', '

/** Two dates as a range: "Jan 2020 – Present", "2020年1月～現在". */
export const dateRange = (language: string, start: string, end: string): string => `${start}${languageInfo(language).to ?? ' – '}${end}`
