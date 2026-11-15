/**
 * A CV made from a PDF's lines (see `read-pdf.ts`), by rules rather than by knowing which
 * maker drew it.
 *
 * - The largest text on the first page is the name; contact details are found by their
 *   shape before the first heading, or under a Contact heading.
 * - Headings are found by look: the lines that look like the known section names do.
 * - In a list of jobs or degrees, each one is found by its dates, and the lines around
 *   them are its title, organisation and place, wherever the template put them.
 *
 * Nothing is dropped: what the rules can't place goes into a hidden Not sorted section.
 */

import {DEFAULT_DESIGN, emptyEntry, newId, type Cv, type CvEntry, type CvPerson, type CvSection, type CvTagGroup} from '../cv'
import {joinItem, levelOfWords, withWordLevels} from '../levels'
import {findDates, withoutDates, type DateRange} from './dates'
import {knownHeading, type HeadingKind} from './headings'
import type {PdfLine} from './layout'
import {NOT_SORTED} from './not-sorted'
import type {PdfLayout} from './read-pdf'

export interface ImportedCv {
    readonly cv: Cv
    /** How many lines went into Not sorted. */
    readonly unsorted: number
}

export {NOT_SORTED}

const BULLET = /^(?:[•▪◦‣●■○◆►✓➢]\s*|[*–-]\s+)/
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/
const URL_LIKE = /^(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?$/i
const PHONE = /^\+?[\d\s().-]{7,}$/
const PAGE_NUMBER = /^(?:page\s+)?\d+\s*(?:\/|of)\s*\d+$|^page\s+\d+$/i
/** Labels in front of contact details, as in "Email: jane@example.com". */
const CONTACT_LABEL = /^(?:e-?mail|phone|mobile|tel(?:ephone)?|cell|address|location|web(?:site)?|linkedin|github|portfolio)\s*:\s*/i
/** A range of dates cut off at the end of a line. */
const OPEN_RANGE = /(?:19|20)\d{2}\s*[–—-]$/
/** Words a wrapped line ends on, so the next line carries on the same thing. */
const CARRIES_ON = /(?:,|\b(?:and|of|in|for|&|the|at|with|to|on))$/i

const isCaps = (text: string) => /\p{L}/u.test(text) && text === text.toUpperCase()
const words = (text: string) => text.split(/\s+/).filter(Boolean).length

/** "SENIOR SOFTWARE ENGINEER" as "Senior Software Engineer", for a name or headline. */
const titleCase = (text: string) => (isCaps(text) ? text.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase()) : text)

/** "WORK HISTORY" as "Work history", as the app writes headings. */
const sentenceCase = (text: string) => (isCaps(text) ? text.charAt(0) + text.slice(1).toLowerCase() : text)

/** The size most of the text is in. */
function bodySize(lines: readonly PdfLine[]): number {
    const weight = new Map<number, number>()

    for (const line of lines) {
        const size = Math.round(line.size * 2) / 2

        weight.set(size, (weight.get(size) ?? 0) + line.text.length)
    }

    return [...weight].reduce((best, entry) => (entry[1] > best[1] ? entry : best), [10, 0])[0]
}

/** Page numbers, and the small running header a later page repeats at its top. */
function isFurniture(line: PdfLine, body: number): boolean {
    return PAGE_NUMBER.test(line.text) || (line.page > 1 && line.y < 60 && line.size < body - 0.9)
}

interface Style {
    readonly size: number
    readonly bold: boolean
    readonly caps: boolean
}

const styleOf = (line: PdfLine): Style => ({size: line.size, bold: line.bold, caps: isCaps(line.text)})
const sameStyle = (a: Style, b: Style) => a.bold === b.bold && a.caps === b.caps && Math.abs(a.size - b.size) <= 0.4

/** Short, standing alone, and set apart by bold, capitals or size. */
function couldBeHeading(line: PdfLine, body: number): boolean {
    const text = line.text.replace(/:$/, '')

    return text.length <= 40 && words(text) <= 5 && !/[.,;@]|\d/.test(text) && line.runs.length === 1 && (line.bold || isCaps(text) || line.size > body + 0.9)
}

/**
 * Which lines are headings: those that look like the known section names do. A known
 * name in plain body text, such as a skill group called Languages, sets no look.
 */
function findHeadings(lines: readonly PdfLine[], body: number, header: readonly PdfLine[]): Set<PdfLine> {
    const candidates = lines.filter((line) => couldBeHeading(line, body) && !header.includes(line))
    const known = candidates.filter((line) => knownHeading(line.text.replace(/:$/, '')) !== null)
    const standOut = known.filter((line) => isCaps(line.text) || line.size > body + 0.5)
    const styles = (standOut.length > 0 ? standOut : known).map(styleOf)

    if (styles.length === 0) {
        return new Set(candidates.filter((line) => isCaps(line.text) && (line.bold || line.size > body)))
    }

    return new Set(candidates.filter((line) => styles.some((style) => sameStyle(style, styleOf(line)))))
}

/** A line's parts: its runs, cut again at the separators CVs put between details. */
function segmentsOf(line: PdfLine): {text: string; bold: boolean; afterTitle: boolean}[] {
    return line.runs.flatMap((run, index) =>
        run.text
            .split(/\s*[|·•●▪◦]\s*|\s+—\s+|\s*—\s*(?=\p{Lu})/u)
            .map((text, part) => ({text: text.trim(), bold: run.bold, afterTitle: index > 0 && part === 0 && /^\s*,/.test(run.text)}))
            .map((segment) => ({...segment, text: segment.text.replace(/^,\s*/, '').replace(/,$/, '').trim()}))
            .filter((segment) => segment.text !== ''),
    )
}

// ---------------------------------------------------------------- the person

interface Contact {
    email: string
    phone: string
    location: string
    links: string[]
}

/** Puts a detail where it belongs by its shape; false when it has no place. */
function placeDetail(text: string, contact: Contact): boolean {
    const detail = text.replace(CONTACT_LABEL, '').trim()
    const email = EMAIL.exec(detail)

    if (email) {
        contact.email ||= email[0]
        return true
    }

    if (PHONE.test(detail) && detail.replace(/\D/g, '').length >= 7) {
        contact.phone ||= detail
        return true
    }

    if (URL_LIKE.test(detail)) {
        contact.links.push(/^https?:\/\//i.test(detail) ? detail : `https://${detail}`)
        return true
    }

    if (!contact.location && detail.length <= 50 && /^\p{Lu}[\p{L} .'-]*(?:,\s*\p{L}[\p{L} .'-]*)*$/u.test(detail)) {
        contact.location = detail
        return true
    }

    return false
}

// ---------------------------------------------------------------- sections

interface RawSection {
    readonly title: string
    readonly kind: HeadingKind | null
    readonly lines: PdfLine[]
}

function textOf(lines: readonly PdfLine[]): string {
    let text = ''

    for (const line of lines) {
        const bullet = BULLET.test(line.text)
        const clean = line.text.replace(BULLET, '')

        text += text === '' ? (bullet ? `• ${clean}` : clean) : bullet ? `\n• ${clean}` : ` ${clean}`
    }

    return text
}

type Role = 'head' | 'bullet' | 'more' | 'summary'

/** What each line of a list of jobs or degrees is. */
function rolesOf(lines: readonly PdfLine[], body: number): Role[] {
    const roles: Role[] = []
    let bulletX = -1

    lines.forEach((line, index) => {
        const before = roles[index - 1]
        const dated = findDates(line.text) !== null
        const boldLed = line.runs[0].bold

        if (BULLET.test(line.text)) {
            roles.push('bullet')
            bulletX = line.x
        } else if ((before === 'bullet' || before === 'more') && line.x > bulletX + 2 && !dated && !boldLed) {
            roles.push('more')
        } else if (before === 'summary' && !/[.!?]$/.test(lines[index - 1].text) && !dated && !boldLed) {
            roles.push('summary')
        } else if (before !== undefined && !dated && !boldLed && line.size >= body - 0.3 && (/[.!?]$/.test(line.text) || line.text.length > 60)) {
            roles.push('summary')
        } else {
            roles.push('head')
        }
    })

    return roles
}

/**
 * Splits runs of heading lines into one per job. Where several jobs' lines meet with no
 * bullets between them, each job takes as many lines before its dates as the jobs with
 * bullets have.
 */
function splitHeads(runs: readonly PdfLine[][], linesBeforeDates: number): PdfLine[][] {
    return runs.flatMap((run) => {
        // A range cut at the end of a line, "Jan 2010 –" then "Dec 2014", is one set of dates.
        const anchors = run.flatMap((line, index) => (findDates(line.text) && !(index > 0 && OPEN_RANGE.test(run[index - 1].text)) ? [index] : []))

        if (anchors.length <= 1) {
            return [run]
        }

        const starts = anchors.map((anchor, index) => (index === 0 ? 0 : Math.max(anchor - linesBeforeDates, anchors[index - 1] + 1)))

        return starts.map((start, index) => run.slice(start, starts[index + 1]))
    })
}

/**
 * A job's or degree's heading lines as its title, organisation, place and dates.
 * `columnRight` is where the column's longest lines end, so a wrapped line can be told
 * from a short one.
 */
function entryHead(lines: readonly PdfLine[], columnRight: number): Pick<CvEntry, 'title' | 'org' | 'location' | 'start' | 'end' | 'current'> {
    const segments = lines.flatMap((line, lineIndex) => segmentsOf(line).map((segment) => ({...segment, lineIndex})))
    let dates: DateRange | null = null

    // A range cut in two at the end of a line, "Jan 2010 –" then "Dec 2014", is put back.
    for (let index = 0; index < segments.length - 1; index += 1) {
        if (OPEN_RANGE.test(segments[index].text) && findDates(segments[index + 1].text)?.index === 0) {
            segments.splice(index, 2, {...segments[index], text: `${segments[index].text} ${segments[index + 1].text}`})
        }
    }

    for (const segment of segments) {
        const found: DateRange | null = dates ? null : findDates(segment.text)

        if (found) {
            dates = found
            segment.text = withoutDates(segment.text, found)
        }
    }

    // A title or name wrapped onto the next line is put back together.
    const parts = segments.filter((segment) => segment.text !== '')

    for (let index = parts.length - 1; index > 0; index -= 1) {
        const [before, after] = [parts[index - 1], parts[index]]

        // Ending on "and", or running to the edge before a line that starts in lower case,
        // as a long name wraps. A short line before one in lower case is two things, such
        // as a role and a project called calendar-kit.
        const wrapped = lines[before.lineIndex].right >= columnRight - 0.25 * (columnRight - lines[before.lineIndex].x) && /^\p{Ll}/u.test(after.text)

        if (after.lineIndex === before.lineIndex + 1 && after.bold === before.bold && (CARRIES_ON.test(before.text) || wrapped)) {
            parts.splice(index - 1, 2, {...before, text: `${before.text} ${after.text}`.replace(/,\s*,/g, ',')})
        }
    }

    const titleAt = Math.max(0, parts.findIndex((part) => part.bold))
    const rest = parts.filter((_, index) => index !== titleAt).flatMap((part) => (part.afterTitle ? part.text.split(/\s*,\s*/) : [part.text])).filter(Boolean)

    let title = parts[titleAt]?.text ?? ''

    // "Designer, Northwind" or "Designer at Northwind" in one look, with no organisation
    // anywhere else.
    if (rest.length === 0) {
        const split = /^(.+?)(?:,\s+|\s+(?:at|@)\s+)(.+)$/.exec(title)

        if (split) {
            title = split[1]
            rest.push(split[2])
        }
    }

    return {
        title,
        org: rest[0] ?? '',
        location: rest.slice(1).join(', '),
        start: dates?.start ?? '',
        end: dates?.end ?? '',
        current: dates?.current ?? false,
    }
}

function entriesOf(lines: readonly PdfLine[], body: number, linesBeforeDates: number): CvEntry[] {
    const roles = rolesOf(lines, body)
    const columnRight = Math.max(...lines.map((line) => line.right))
    const groups: {head: PdfLine[]; body: {role: Role; line: PdfLine}[]}[] = []

    lines.forEach((line, index) => {
        const last = groups[groups.length - 1]

        if (roles[index] === 'head') {
            if (last && last.body.length === 0) {
                last.head.push(line)
            } else {
                groups.push({head: [line], body: []})
            }
        } else if (last) {
            last.body.push({role: roles[index], line})
        } else {
            groups.push({head: [], body: [{role: roles[index], line}]})
        }
    })

    return groups.flatMap((group) => {
        const heads = group.head.length > 0 ? splitHeads([group.head], linesBeforeDates) : [[]]

        return heads.map((head, index) => {
            const entry: CvEntry = {...emptyEntry(), ...entryHead(head, columnRight)}

            // The bullets and summary belong to the last job of the run.
            if (index < heads.length - 1) {
                return entry
            }

            const bullets: string[] = []
            const summary: string[] = []

            for (const {role, line} of group.body) {
                if (role === 'bullet') {
                    bullets.push(line.text.replace(BULLET, ''))
                } else if (role === 'more' && bullets.length > 0) {
                    bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${line.text}`
                } else {
                    summary.push(line.text)
                }
            }

            return {...entry, bullets, summary: summary.join(' ')}
        })
    })
}

/** Lines before the dates in jobs that have bullets after them: how this maker lays a job out. */
function learnLinesBeforeDates(sections: readonly RawSection[], body: number): number {
    const counts = new Map<number, number>()

    for (const section of sections) {
        const roles = rolesOf(section.lines, body)
        let run: number[] = []

        roles.forEach((role, index) => {
            if (role === 'head') {
                run.push(index)
                return
            }

            const anchors = run.filter((at) => findDates(section.lines[at].text))

            if (run.length > 0 && anchors.length === 1) {
                const before = run.indexOf(anchors[0])

                counts.set(before, (counts.get(before) ?? 0) + 1)
            }

            run = []
        })
    }

    return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best), [1, 0])[0]
}

const LABELLED = /^([^:,]{1,30}):\s*(.*)$/

function tagGroupsOf(lines: readonly PdfLine[]): CvTagGroup[] {
    const groups: {label: string; items: string[]; text: string}[] = []
    const current = () => groups[groups.length - 1] ?? (groups.push({label: '', items: [], text: ''}), groups[groups.length - 1])
    const start = (label: string, text = '') => groups.push({label, items: [], text})

    for (const line of lines) {
        const labelled = LABELLED.exec(line.text)
        const runs = line.runs

        if (labelled && !BULLET.test(line.text)) {
            start(labelled[1].trim(), labelled[2])
        } else if (runs.length === 1 && line.bold && !line.text.includes(',')) {
            start(line.text)
        } else if (runs.length > 1 && runs.some((run, index) => index > 0 && levelOfWords(run.text) > 0 && words(run.text) <= 3)) {
            // Names each followed by a level, as languages are: "Bangla  Native  English  Advanced".
            for (let index = 0; index < runs.length; index += 1) {
                const level = runs[index + 1] && levelOfWords(runs[index + 1].text) > 0 ? runs[index + 1].text : ''

                current().items.push(joinItem(runs[index].text, level))
                index += level ? 1 : 0
            }
        } else if (runs.length > 1 && !runs[0].text.includes(',') && runs.slice(1).some((run) => run.text.includes(','))) {
            start(runs[0].text, runs.slice(1).map((run) => run.text).join(', '))
        } else if (runs.length > 1 && !line.text.includes(',')) {
            // Each skill drawn on its own, as boxes are.
            current().items.push(...runs.map((run) => run.text))
        } else {
            const group = current()

            group.text = group.text ? `${group.text} ${line.text.replace(BULLET, '')}` : line.text.replace(BULLET, '')
        }
    }

    return groups
        .map((group) => {
            const items = [...group.items, ...group.text.split(/\s*[,;•·|]\s*/)].map((item) => item.replace(/\.$/, '').trim()).filter(Boolean)

            return {id: newId('group'), visible: true, label: group.label, items, ...withWordLevels(items)}
        })
        .filter((group) => group.items.length > 0 || group.label)
}

/** A section whose heading isn't known: entries if it has dates, a list if it reads like one, otherwise text. */
function guessKind(lines: readonly PdfLine[]): HeadingKind {
    if (lines.some((line) => findDates(line.text))) {
        return 'entries'
    }

    const listy = lines.filter((line) => LABELLED.test(line.text) || line.text.split(',').length >= 3).length

    return lines.length > 0 && listy >= lines.length / 2 ? 'tags' : 'text'
}

// ---------------------------------------------------------------- the CV

export function cvFromLayout(layout: PdfLayout): ImportedCv {
    const body = bodySize(layout.lines)
    const content = layout.lines.filter((line) => !isFurniture(line, body))
    // Each column read through every page: the main one first, then the side one.
    const streams = [content.filter((line) => line.column !== 'right'), content.filter((line) => line.column === 'right')]
    const firstPage = content.filter((line) => line.page === 1)
    const nameLine = firstPage.length > 0 ? firstPage.reduce((a, b) => (b.size > a.size ? b : a)) : undefined
    const nameStream = streams.find((stream) => nameLine && stream.includes(nameLine)) ?? []
    // A headline in capitals can look like a heading; under the name, it's the headline.
    const afterName = nameStream[nameStream.indexOf(nameLine!) + 1]
    const header = [nameLine, afterName && !knownHeading(afterName.text) ? afterName : undefined].filter((line): line is PdfLine => line !== undefined)
    const headings = findHeadings(content, body, header)
    const contact: Contact = {email: '', phone: '', location: '', links: []}
    const unsorted: string[] = []
    const sections: RawSection[] = []
    let headline = ''

    for (const stream of streams) {
        let section: RawSection | null = null

        stream.forEach((line, index) => {
            if (headings.has(line)) {
                section = {title: sentenceCase(line.text.replace(/:$/, '')), kind: knownHeading(line.text.replace(/:$/, '')), lines: []}
                sections.push(section)
            } else if (section) {
                section.lines.push(line)
            } else if (line === nameLine) {
                // The name, read below.
            } else if (stream[index - 1] === nameLine && !headline && line.text.length <= 80 && !EMAIL.test(line.text) && !findDates(line.text)) {
                headline = titleCase(line.text)
            } else {
                for (const segment of segmentsOf(line)) {
                    if (!placeDetail(segment.text, contact)) {
                        unsorted.push(segment.text)
                    }
                }
            }
        })
    }

    const linesBeforeDates = learnLinesBeforeDates(
        sections.filter((section) => (section.kind ?? guessKind(section.lines)) === 'entries'),
        body,
    )
    const cvSections: CvSection[] = []

    for (const section of sections) {
        const kind = section.kind ?? guessKind(section.lines)
        const base = {id: newId('section'), title: section.title, visible: true}

        if (kind === 'contact') {
            for (const segment of section.lines.flatMap(segmentsOf)) {
                if (!placeDetail(segment.text, contact)) {
                    unsorted.push(segment.text)
                }
            }
        } else if (kind === 'entries') {
            cvSections.push({...base, kind: 'entries', entries: entriesOf(section.lines, body, linesBeforeDates)})
        } else if (kind === 'tags') {
            cvSections.push({...base, kind: 'tags', groups: tagGroupsOf(section.lines)})
        } else if (kind === 'details') {
            const rows = section.lines.flatMap((line) => {
                const labelled = LABELLED.exec(line.text) ?? (line.runs.length === 2 ? [line.text, line.runs[0].text, line.runs[1].text] : null)

                if (!labelled) {
                    unsorted.push(line.text)
                    return []
                }

                return [{id: newId('row'), visible: true, kind: 'text' as const, label: labelled[1].trim(), value: labelled[2].trim()}]
            })

            cvSections.push({...base, kind: 'details', rows})
        } else {
            cvSections.push({...base, kind: 'text', text: textOf(section.lines)})
        }
    }

    if (unsorted.length > 0) {
        cvSections.push({id: newId('section'), kind: 'text', title: NOT_SORTED, visible: false, text: unsorted.join('\n')})
    }

    const person: CvPerson = {
        name: nameLine ? titleCase(nameLine.text) : '',
        headline,
        email: contact.email,
        phone: contact.phone,
        location: contact.location,
        links: contact.links.map((url) => ({id: newId('link'), label: '', url})),
        photo: '',
        hide: [],
    }
    const twoColumns = layout.lines.some((line) => line.column !== 'full')

    return {cv: {person, sections: cvSections, design: {...DEFAULT_DESIGN, template: twoColumns ? 'modern' : 'classic'}}, unsorted: unsorted.length}
}
