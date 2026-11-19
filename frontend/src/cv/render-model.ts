/**
 * What a template is given: the CV with hidden things left out and dates already
 * written as words, so every template says them the same way and none has to know
 * about months.
 *
 * Keeping this in TypeScript, not Typst, means the rules ATS parsers care about are
 * tested once here rather than in each template.
 */

import type {Cv, CvEntry} from './cv'
import type {Section} from './sections'
import {fontById, fontFamilies} from './fonts'
import {parseRich, type Span} from './rich'
import {levelOfWords, splitItem} from './levels'
import {detailValue} from './details'

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
    readonly design: {
        readonly accent: string
        /** The font's family name, as Typst knows it. */
        readonly font: string
        /** The families a template sets, the font first, then those for other scripts. */
        readonly fonts: readonly string[]
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

/** Page margins in centimetres, and room between blocks, for the design's choices. */
export const MARGINS = {narrow: 1.3, normal: 1.8, wide: 2.4} as const
export const SPACING = {compact: 0.8, normal: 1, relaxed: 1.2} as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2023-01" as "Jan 2023". */
export function monthText(value: string): string {
    const match = /^(\d{4})-(\d{2})$/.exec(value)

    return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : ''
}

/** An entry's dates in one consistent form: "Jan 2020 – Present", "2019 – Mar 2021", "Jun 2018". */
export function datesText(entry: Pick<CvEntry, 'start' | 'end' | 'current'>): string {
    const start = monthText(entry.start)
    const end = entry.current ? 'Present' : monthText(entry.end)

    if (start && end) {
        return start === end ? start : `${start} – ${end}`
    }

    return start || end
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
const SIDE_TITLES = /skill|language|interest|hobb|strength|project|award|honou?r|tool|technolog|competenc|volunt|reference|certific|course|training/i

const columnOf = (kind: Cv['sections'][number]['kind'], title: string): Column => (kind === 'tags' || kind === 'details' || (kind === 'entries' && SIDE_TITLES.test(title) && !/experience|education/i.test(title)) ? 'side' : 'main')

/**
 * A section as a template is given it: hidden parts left out, and null when nothing in
 * it shows. A family section is a biodata's own, and its render model handles it.
 */
export function sectionBody(section: Section, today: Date): SectionBody | null {
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
                dates: entry.hide.includes('dates') ? '' : datesText(entry),
                summary: entry.hide.includes('summary') ? [] : parseRich(entry.summary.trim()),
                bullets: entry.bullets.map(trimmed).filter(Boolean).map(parseRich),
            }))

        return entries.length > 0 ? {kind: 'entries', title, entries} : null
    }

    if (section.kind === 'details') {
        const rows = section.rows.filter((row) => row.visible).map((row) => ({label: row.label.trim(), value: detailValue(row, today)})).filter((row) => row.value)

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

                return {label: group.label.trim(), items: items.join(', '), levels: group.showLevels, list}
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
        const body = section.visible ? sectionBody(section, today) : null

        return body ? [{...body, column: columnOf(section.kind, body.title)}] : []
    })

    return {
        name: person.name.trim(),
        headline: person.headline.trim(),
        contact,
        photo: person.photo && !person.hide.includes('photo') ? person.photo : '',
        sections,
        design: {
            accent: cv.design.accent,
            font: fontById(cv.design.font).family,
            fonts: fontFamilies(cv.design.font),
            fontSize: cv.design.fontSize,
            paper: cv.design.paper,
            margin: MARGINS[cv.design.margins],
            spacing: SPACING[cv.design.spacing],
            atsMode: cv.design.atsMode,
            levelStyle: cv.design.levelStyle,
        },
    }
}
