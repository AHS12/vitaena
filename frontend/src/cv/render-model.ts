/**
 * What a template is given: the CV with hidden things left out and dates already
 * written as words, so every template says them the same way and none has to know
 * about months.
 *
 * Keeping this in TypeScript, not Typst, means the rules ATS parsers care about are
 * tested once here rather than in each template.
 */

import type {Cv, CvEntry} from './cv'
import {ENGLISH, type Section, type Writing} from './sections'
import {fontById, fontFamilies} from './fonts'
import {parseRich, type Span} from './rich'
import {levelOfWords, splitItem} from './levels'
import {commaIn, dateRange, dayMonthYear, labelsFor, languageInfo, monthAndYear} from '../core/labels/labels'
import {detailValue, numbersIn} from './details'

export interface RenderEntry {
    readonly title: string
    readonly org: string
    readonly location: string
    readonly dates: string
    readonly summary: readonly Span[]
    readonly bullets: readonly (readonly Span[])[]
}

/** One item of a list, split for templates that show a level, such as languages. */
export interface RenderTagItem {
    readonly name: string
    /** What was written in brackets after the name, such as "Native", or "". */
    readonly note: string
    /** 0.5 to 5 when set or named by the note, else 0. */
    readonly level: number
}

export interface RenderTagGroup {
    readonly label: string
    /** The items as one line, for templates that write them out. */
    readonly items: string
    /** Draw each item's level, as dots or a bar. */
    readonly levels: boolean
    readonly list: readonly RenderTagItem[]
}

/** One line of a details section, its value already written out: "12 March 1996 (30 years)". */
export interface RenderDetail {
    /** The row's id, so a biodata can find its second label. */
    readonly id: string
    /** "" when the row has no label, and only its value is shown. */
    readonly label: string
    readonly value: string
}

/** Where a section sits in a two-column template; one-column templates ignore it. */
export type Column = 'main' | 'side'

/** A section of a kind every type shares, as a template is given it. */
export type SectionBody =
    | {readonly kind: 'text'; readonly title: string; readonly paragraphs: readonly (readonly Span[])[]}
    | {readonly kind: 'entries'; readonly title: string; readonly entries: readonly RenderEntry[]}
    | {readonly kind: 'tags'; readonly title: string; readonly groups: readonly RenderTagGroup[]}
    | {readonly kind: 'details'; readonly title: string; readonly rows: readonly RenderDetail[]}

export type RenderSection = {readonly column: Column} & SectionBody

export type ContactKind = 'email' | 'phone' | 'location' | 'linkedin' | 'github' | 'web'

export interface RenderModel {
    readonly name: string
    readonly headline: string
    /** Contact details as plain text, in the order they're shown, with what each is for icons. */
    readonly contact: readonly {readonly text: string; readonly url: string; readonly kind: ContactKind}[]
    /** The photo as a data URL, or "" for none. The engine hands it to the template as a file. */
    readonly photo: string
    readonly sections: readonly RenderSection[]
    /** The line the CV ends with, "Berlin, 19.11.2026", or "" for none. */
    readonly closing: string
    /** The signature under it as a data URL, or "" for a line to sign on. */
    readonly signature: string
    /** Words a template writes itself, in the CV's language. */
    /** Words the template writes itself: the Contact heading, and the comma between a job and its employer. */
    readonly words: {readonly contact: string; readonly comma: string}
    readonly design: {
        readonly accent: string
        /** The font's family name, as Typst knows it. */
        readonly font: string
        /** The families a template sets, the font first, then those for other scripts. */
        readonly fonts: readonly string[]
        /** The language, as Typst's lang takes it: "en", "bn". */
        readonly lang: string
        /** Written in Latin letters, so headings may be spaced out or set in capitals. */
        readonly latin: boolean
        /** Written right to left, as Urdu is. */
        readonly rtl: boolean
        /** Written in Chinese characters, kana or Hangul, which read better with looser lines. */
        readonly cjk: boolean
        readonly fontSize: number
        readonly paper: string
        /** Page margins, in centimetres. */
        readonly margin: number
        /** How much room between blocks, around 1. */
        readonly spacing: number
        readonly atsMode: boolean
        /** "template" for the template's own way, else "dots", "bar" or "squares". */
        readonly levelStyle: string
    }
}

/** What a template is told about the document's language. */
export const pageLanguage = (language: string): {lang: string; latin: boolean; rtl: boolean; cjk: boolean} => {
    const info = languageInfo(language)

    return {lang: info.lang, latin: info.latin, rtl: info.rtl ?? false, cjk: info.script === 'cjk' || info.script === 'hangul'}
}

/** Page margins in centimetres, and room between blocks, for the design's choices. */
export const MARGINS = {narrow: 1.3, normal: 1.8, wide: 2.4} as const
export const SPACING = {compact: 0.8, normal: 1, relaxed: 1.2} as const

/** "2023-01" as "Jan 2023", "01/2023", "01.2023" or "2023", by the design's date style, in its language. */
export function monthText(value: string, writing: Writing = ENGLISH): string {
    const match = /^(\d{4})-(\d{2})$/.exec(value)

    if (!match) {
        return ''
    }

    const [, year, month] = match
    const style = writing.dateStyle ?? 'month-name'
    const text = style === 'year' ? year : style === 'numeric-slash' ? `${month}/${year}` : style === 'numeric-dot' ? `${month}.${year}` : monthAndYear(writing.language, Number(month), year)

    return numbersIn(text, writing)
}

/** An entry's dates in one consistent form: "Jan 2020 – Present", "2019 – Mar 2021", "Jun 2018". */
export function datesText(entry: Pick<CvEntry, 'start' | 'end' | 'current'>, writing: Writing = ENGLISH): string {
    const start = monthText(entry.start, writing)
    const end = entry.current ? labelsFor(writing.language).page.present : monthText(entry.end, writing)

    if (start && end) {
        return start === end ? start : dateRange(writing.language, start, end)
    }

    return start || end
}

/**
 * A day as the closing line writes it, in the design's date style: "19.11.2026",
 * "19/11/2026", or by name, "19 November 2026".
 */
export function dayText(value: string, writing: Writing = ENGLISH): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

    if (!match) {
        return ''
    }

    const [, year, month, day] = match
    const style = writing.dateStyle ?? 'month-name'
    const text = style === 'numeric-dot' ? `${day}.${month}.${year}` : style === 'numeric-slash' ? `${day}/${month}/${year}` : dayMonthYear(writing.language, Number(day), Number(month), Number(year))

    return numbersIn(text, writing)
}

/** "2026-11-19" for a day, as a closing line's date is kept. */
const isoDay = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** The closing line: place and date, the date today's unless one is fixed. */
export function closingText(cv: Pick<Cv, 'closing' | 'design'>, today: Date): string {
    const {closing} = cv

    return closing.show ? [closing.place.trim(), dayText(closing.date || isoDay(today), cv.design)].filter(Boolean).join(', ') : ''
}

const trimmed = (value: string): string => value.trim()

/** A link as people read it, without the scheme: "linkedin.com/in/jane". */
const linkText = (url: string): string => url.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')

const asUrl = (url: string): string => (/^[a-z][a-z0-9+.-]*:/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`)

const linkKind = (url: string): ContactKind => (/linkedin\./i.test(url) ? 'linkedin' : /github\./i.test(url) ? 'github' : 'web')

/** "Bangla (Native)" as its name, its note and, when the note names one, a level. */
export function tagItem(text: string, level?: number): RenderTagItem {
    const {name, note} = splitItem(text)

    return {name, note, level: level ?? levelOfWords(note)}
}

/** Sections that belong beside the main story in a two-column template. */
const SIDE_TITLES = /skill|language|interest|hobb|strength|project|award|honou?r|tool|technolog|competenc|volunt|reference|certific|course|training|দক্ষতা|ভাষা|আগ্রহ|শখ|প্রকল্প|পুরস্কার|স্বেচ্ছাসেবা|সনদ|প্রশিক্ষণ|कौशल|भाषा|रुचि|शौक|परियोजना|पुरस्कार|प्रमाणपत्र|स्वयंसेवा|छंद|आवडी|प्रकल्प|مہارت|زبان|دلچسپ|مشاغل|منصوب|اعزاز|اسناد|رضاکار|مهارات|لغات|هوايات|اهتمامات|مشاريع|جوائز|شهادات|دورات|تطوع|مهارت|علایق|سرگرمی|پروژه|افتخارات|گواهینامه|داوطلب|スキル|語学|趣味|興味|プロジェクト|資格|受賞|ボランティア|技能|语言|語言|兴趣|興趣|爱好|嗜好|项目|專案|证书|證照|荣誉|榮譽|志愿|志工|기술|어학|취미|관심|프로젝트|자격|수상|봉사|kenntnis|fähigkeit|sprach|kompetenz|interesse|hobby|projekt|zertifik|auszeichnung|ehrenamt|weiterbildung|compétence|langue|intérêt|loisir|projet|distinction|bénévol|habilidad|idioma|interes|aficion|proyecto|premio|voluntar|competenz|lingue|progett|premi|volontar|competência|projeto|passatempo|distinç|vaardighed|talen|projecten|prijzen|vrijwillig|umiejętn|języki|zainteresowan|projekty|nagrody|certyfikat|wolontariat|yetenek|beceri|diller|ilgi|hobi|proje|ödül|sertifika|gönüllü|навык|язык|интерес|увлечен|проект|наград|сертифик|волонт|навичк|мови|інтерес|захоплен|проєкт|нагород|сертифік/i

const columnOf = (kind: Cv['sections'][number]['kind'], title: string): Column => (kind === 'tags' || kind === 'details' || (kind === 'entries' && SIDE_TITLES.test(title) && !/experience|education|অভিজ্ঞতা|শিক্ষা|अनुभव|शिक्षा|शैक्षणिक|تجربہ|تعلیم|خبرة|خبرات|تعليم|مؤهلات|سوابق|تجربه|تحصیلات|職歴|職務経歴|学歴|工作经历|工作經歷|教育|学历|學歷|경력|학력|berufserfahrung|erfahrung|beruflich|expérience|experiencia|esperienz|experiência|werkervaring|ervaring|doświadczenie|deneyim|опыт|досвід|ausbildung|bildung|studium|formation|formación|educación|istruzione|formazione|formação|educação|opleiding|wykształcenie|edukacja|eğitim|образование|освіта/i.test(title)) ? 'side' : 'main')

/**
 * A section as a template is given it: hidden parts left out, and null when nothing in
 * it shows. A family section is a biodata's own, and its render model handles it.
 */
export function sectionBody(section: Section, today: Date, writing: Writing = ENGLISH): SectionBody | null {
    if (!section.visible) {
        return null
    }

    const title = section.title.trim()

    if (section.kind === 'text') {
        const paragraphs = section.text
            .split('\n')
            .map(trimmed)
            .filter(Boolean)
            .map(parseRich)

        return paragraphs.length > 0 ? {kind: 'text', title, paragraphs} : null
    }

    if (section.kind === 'entries') {
        const entries = section.entries
            .filter((entry) => entry.visible && (entry.title.trim() || entry.org.trim()))
            .map((entry) => ({
                title: entry.title.trim(),
                org: entry.org.trim(),
                location: entry.hide.includes('location') ? '' : entry.location.trim(),
                dates: entry.hide.includes('dates') ? '' : datesText(entry, writing),
                summary: entry.hide.includes('summary') ? [] : parseRich(entry.summary.trim()),
                bullets: entry.bullets.map(trimmed).filter(Boolean).map(parseRich),
            }))

        return entries.length > 0 ? {kind: 'entries', title, entries} : null
    }

    if (section.kind === 'details') {
        const rows = section.rows.filter((row) => row.visible).map((row) => ({id: row.id, label: row.label.trim(), value: detailValue(row, today, writing)})).filter((row) => row.value)

        return rows.length > 0 ? {kind: 'details', title, rows} : null
    }

    if (section.kind === 'tags') {
        const groups = section.groups
            .filter((group) => group.visible)
            .map((group) => {
                const kept = group.items.map((item, index) => ({text: trimmed(item), level: group.levels[index] ?? 0})).filter((item) => item.text)
                const items = kept.map((item) => item.text)
                // A level set by hand wins; else one the item's own words name.
                const list = kept.map((item) => tagItem(item.text, group.showLevels ? item.level || undefined : 0))

                return {label: group.label.trim(), items: items.join(commaIn(writing.language)), levels: group.showLevels, list}
            })
            .filter((group) => group.items)

        return groups.length > 0 ? {kind: 'tags', title, groups} : null
    }

    return null
}

/** `today` is the day ages are worked out on. */
export function renderModel(cv: Cv, today: Date = new Date()): RenderModel {
    const {person} = cv
    const contact = [
        person.phone.trim() && !person.hide.includes('phone') ? {text: person.phone.trim(), url: `tel:${person.phone.replace(/[^\d+]/g, '')}`, kind: 'phone' as const} : null,
        person.email.trim() && !person.hide.includes('email') ? {text: person.email.trim(), url: `mailto:${person.email.trim()}`, kind: 'email' as const} : null,
        person.location.trim() && !person.hide.includes('location') ? {text: person.location.trim(), url: '', kind: 'location' as const} : null,
        // A link is written out in full, so a parser that drops links still has the address.
        ...person.links.filter((link) => link.url.trim()).map((link) => ({text: linkText(link.url), url: asUrl(link.url), kind: linkKind(link.url)})),
    ].filter((item) => item !== null)

    const sections = cv.sections.flatMap((section) => {
        const body = section.visible ? sectionBody(section, today, cv.design) : null

        return body ? [{...body, column: columnOf(section.kind, body.title)}] : []
    })

    return {
        name: person.name.trim(),
        headline: person.headline.trim(),
        contact,
        photo: person.photo && !person.hide.includes('photo') ? person.photo : '',
        sections,
        closing: closingText(cv, today),
        signature: cv.closing.show ? cv.closing.signature : '',
        words: {contact: labelsFor(cv.design.language).sections.contact, comma: commaIn(cv.design.language)},
        design: {
            accent: cv.design.accent,
            font: fontById(cv.design.font).family,
            fonts: fontFamilies(cv.design.font, cv.design.scriptFont, cv.design.language),
            ...pageLanguage(cv.design.language),
            fontSize: cv.design.fontSize,
            paper: cv.design.paper,
            margin: MARGINS[cv.design.margins],
            spacing: SPACING[cv.design.spacing],
            atsMode: cv.design.atsMode,
            levelStyle: cv.design.levelStyle,
        },
    }
}
