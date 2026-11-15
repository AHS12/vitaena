/**
 * What a template is given: the CV with hidden things left out and dates already
 * written as words, so every template says them the same way and none has to know
 * about months.
 *
 * Keeping this in TypeScript, not Typst, means the rules ATS parsers care about are
 * tested once here rather than in each template.
 */

import type {Cv, CvEntry} from './cv'
import {fontById} from './fonts'

export interface RenderEntry {
    readonly title: string
    readonly org: string
    readonly location: string
    readonly dates: string
    readonly summary: string
    readonly bullets: readonly string[]
}

export interface RenderTagGroup {
    readonly label: string
    readonly items: string
}

export type RenderSection =
    | {readonly kind: 'text'; readonly title: string; readonly text: string}
    | {readonly kind: 'entries'; readonly title: string; readonly entries: readonly RenderEntry[]}
    | {readonly kind: 'tags'; readonly title: string; readonly groups: readonly RenderTagGroup[]}

export interface RenderModel {
    readonly name: string
    readonly headline: string
    /** Contact details as plain text, in the order they're shown. */
    readonly contact: readonly {readonly text: string; readonly url: string}[]
    readonly sections: readonly RenderSection[]
    readonly design: {
        readonly accent: string
        /** The font's family name, as Typst knows it. */
        readonly font: string
        readonly fontSize: number
        readonly paper: string
        /** Page margins, in centimetres. */
        readonly margin: number
        /** How much room between blocks, around 1. */
        readonly spacing: number
    }
}

const MARGINS = {narrow: 1.3, normal: 1.8, wide: 2.4} as const
const SPACING = {compact: 0.8, normal: 1, relaxed: 1.2} as const

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
const linkText = (url: string): string => url.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '')

const asUrl = (url: string): string => (/^[a-z][a-z0-9+.-]*:/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`)

export function renderModel(cv: Cv): RenderModel {
    const {person} = cv
    const contact = [
        person.email.trim() ? {text: person.email.trim(), url: `mailto:${person.email.trim()}`} : null,
        person.phone.trim() ? {text: person.phone.trim(), url: `tel:${person.phone.replace(/[^\d+]/g, '')}`} : null,
        person.location.trim() ? {text: person.location.trim(), url: ''} : null,
        // A link is written out in full, so a parser that drops links still has the address.
        ...person.links.filter((link) => link.url.trim()).map((link) => ({text: linkText(link.url), url: asUrl(link.url)})),
    ].filter((item) => item !== null)

    const sections: RenderSection[] = []

    for (const section of cv.sections) {
        if (!section.visible) {
            continue
        }

        const title = section.title.trim()

        if (section.kind === 'text') {
            if (section.text.trim()) {
                sections.push({kind: 'text', title, text: section.text.trim()})
            }
        } else if (section.kind === 'entries') {
            const entries = section.entries
                .filter((entry) => entry.visible && (entry.title.trim() || entry.org.trim()))
                .map((entry) => ({
                    title: entry.title.trim(),
                    org: entry.org.trim(),
                    location: entry.location.trim(),
                    dates: datesText(entry),
                    summary: entry.summary.trim(),
                    bullets: entry.bullets.map(trimmed).filter(Boolean),
                }))

            if (entries.length > 0) {
                sections.push({kind: 'entries', title, entries})
            }
        } else {
            const groups = section.groups
                .filter((group) => group.visible)
                .map((group) => ({label: group.label.trim(), items: group.items.map(trimmed).filter(Boolean).join(', ')}))
                .filter((group) => group.items)

            if (groups.length > 0) {
                sections.push({kind: 'tags', title, groups})
            }
        }
    }

    return {
        name: person.name.trim(),
        headline: person.headline.trim(),
        contact,
        sections,
        design: {
            accent: cv.design.accent,
            font: fontById(cv.design.font).family,
            fontSize: cv.design.fontSize,
            paper: cv.design.paper,
            margin: MARGINS[cv.design.margins],
            spacing: SPACING[cv.design.spacing],
        },
    }
}
