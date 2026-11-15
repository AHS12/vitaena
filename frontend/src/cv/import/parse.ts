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

/** A title saying what the document is, which is neither the person's name nor their heading. */
export const BIODATA_TITLE = /^(?:marriage\s+|matrimonial\s+)?bio-?\s?data(?:\s+for\s+marriage)?$/i

const BULLET = /^(?:[•▪◦‣●■○◆►✓➢]\s*|[*–-]\s+)/
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/
const URL_LIKE = /^(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?$/i
const PHONE = /^\+?[\d\s().-]{7,}$/
const PAGE_NUMBER = /^(?:page\s+)?\d+\s*(?:\/|of)\s*\d+$|^page\s+\d+$/i
const LABEL_WORDS = 'e-?mail|phone|mobile|tel(?:ephone)?|cell|address|location|web(?:site)?|linkedin|github|portfolio'
/** Labels in front of contact details, as in "Email: jane@example.com". */
const CONTACT_LABEL = new RegExp(String.raw`^(?:${LABEL_WORDS})\s*:\s*`, 'i')
/** A label on a line of its own above its detail, as sidebars set them, or a link's words, as "Email me". */
const LABEL_ALONE = new RegExp(String.raw`^(?:${LABEL_WORDS}|contact|my website)(?:\s+me)?\s*:?$`, 'i')
/** A label that says the detail is where someone lives, whatever its shape. */
const PLACE_LABEL = /^(?:address|location)\s*:\s*/i
/** Words in a job title. */
const ROLE = /\b(?:engineer|developer|programmer|manager|director|head|lead|officer|assistant|associate|intern|consultant|specialist|coordinator|administrator|analyst|designer|architect|scientist|researcher|technician|supervisor|operative|operator|nurse|doctor|physician|teacher|lecturer|professor|tutor|instructor|accountant|auditor|editor|writer|producer|representative|executive|advis[eo]r|agent|clerk|chef|cook|driver|therapist|pharmacist|founder|owner|partner|volunteer|trainee|apprentice|fellow|secretary|receptionist|cashier|attendant|mechanic|electrician|plumber|carpenter|worker|controller|planner|buyer|recruiter|strategist|marketer|photographer|artist|translator|interpreter|lawyer|solicitor|attorney|president|chair|captain|mentor|coach|maintainer|speaker)s?\b/i
/** Words in a degree or qualification. */
const DEGREE = /\b(?:bsc|ba|msc|ma|mphil|phd|dphil|mba|beng|meng|llb|llm|md|bachelor|master|doctorate|diploma|certificate|degree|gcses?|a-?levels?|hn[cd]|associate)\b/i
/** Words in the name of a school. */
const SCHOOL = /\b(?:university|college|school|institute|academy|polytechnic|conservatoire)\b/i
/** How a company's name may end, which isn't a place after a comma. */
const COMPANY_ENDING = /^(?:inc|ltd|llc|llp|plc|gmbh|ag|sa|bv|co|corp|limited|pty)\.?$/i
/** A range of dates cut off at the end of a line. */
const OPEN_RANGE = /(?:19|20)\d{2}\s*[–—-]$/
/** Words a wrapped line ends on, so the next line carries on the same thing. */
const CARRIES_ON = /(?:,|\b(?:and|of|in|for|&|the|at|with|to|on))$/i

const isCaps = (text: string) => /\p{L}/u.test(text) && text === text.toUpperCase()
const words = (text: string) => text.split(/\s+/).filter(Boolean).length

/** "SENIOR SOFTWARE ENGINEER" as "Senior Software Engineer", for a name or headline. */
export const titleCase = (text: string) => (isCaps(text) ? text.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase()) : text)

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

    return text.length <= 40 && words(text) <= 5 && !/[.,;@]|\d/.test(text) && line.runs.every((run) => run.bold === line.bold && run.size === line.size) && (line.bold || isCaps(text) || line.size > body + 0.9)
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

export interface Contact {
    email: string
    phone: string
    location: string
    links: string[]
}

/** Puts a detail where it belongs by its shape; false when it has no place. */
function placeDetail(text: string, contact: Contact): boolean {
    const detail = text.replace(CONTACT_LABEL, '').trim()
    const email = EMAIL.exec(detail)

    if (LABEL_ALONE.test(text.trim())) {
        return true
    }

    if (PLACE_LABEL.test(text) && !contact.location) {
        contact.location = detail
        return true
    }

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

/** A web address as compared: no scheme, no www, no slash at the end. */
const bareAddress = (url: string) => url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase()

/**
 * Where the document's links go: an email address when none was written out, and web
 * addresses not already among the links, as a link reading "LinkedIn" has.
 */
function addLinks(targets: readonly string[], contact: Contact): void {
    for (const target of targets) {
        const email = /^mailto:([^?]+)/i.exec(target)

        if (email) {
            contact.email ||= decodeURIComponent(email[1])
        } else if (/^https?:\/\//i.test(target) && !contact.links.some((link) => bareAddress(link) === bareAddress(target))) {
            contact.links.push(target)
        }
    }
}

// ---------------------------------------------------------------- sections


export function textOf(lines: readonly PdfLine[]): string {
    let text = ''

    for (const line of lines) {
        const bullet = BULLET.test(line.text)
        const clean = line.text.replace(BULLET, '')

        text += text === '' ? (bullet ? `• ${clean}` : clean) : bullet ? `\n• ${clean}` : ` ${clean}`
    }

    return text
}

type Role = 'head' | 'bullet' | 'more' | 'summary'

/** Where a line's words start, past any dates in a margin before them. */
function textX(line: PdfLine): number {
    const words = line.runs.find((run) => {
        const dates = findDates(run.text)

        return !dates || withoutDates(run.text, dates) !== ''
    })

    return (words ?? line.runs[0]).x
}

/** Whether a line runs on to the next: it reaches near the column's edge without ending a sentence. */
const runsOn = (line: PdfLine, columnRight: number) => !/[.!?;:]$/.test(line.text) && line.right >= columnRight - 0.15 * (columnRight - line.x)

/** What each line of a list of jobs or degrees is. */
function rolesOf(lines: readonly PdfLine[], body: number): Role[] {
    const roles: Role[] = []
    const left = Math.min(...lines.map(textX))
    const columnRight = Math.max(...lines.map((line) => line.right))
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
        } else if (line.x > left + 6 && !dated && !boldLed) {
            // A list whose bullets are drawn as shapes, as a browser's are: indented lines,
            // each new one starting where the last ended a sentence or stopped short.
            const previous = lines[index - 1]

            roles.push((before === 'bullet' || before === 'more') && Math.abs(previous.x - line.x) < 2 && runsOn(previous, columnRight) ? 'more' : 'bullet')
            bulletX = line.x
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
function entryHead(lines: readonly PdfLine[], columnRight: number, jobs: boolean): Pick<CvEntry, 'title' | 'org' | 'location' | 'start' | 'end' | 'current'> {
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

    // "Designer, Northwind" in one look, with no organisation after it on its line; "Designer
    // at Northwind" too, under jobs, where "First Aid at Work" isn't likely.
    if (!parts.some((part) => part.afterTitle)) {
        const split = (jobs ? /^(.+?)(?:,\s+|\s+(?:at|@)\s+)(.+)$/ : /^(.+?),\s+(.+)$/).exec(title)

        if (split) {
            title = split[1]
            rest.unshift(...split[2].split(/\s*,\s*/))
        }
    }

    // "Northwind Logistics, Leeds": a company and the place it is.
    if (rest.length === 1) {
        const place = /^(.+),\s+(\p{Lu}[\p{L}.' -]{1,30})$/u.exec(rest[0])

        if (place && !COMPANY_ENDING.test(place[2])) {
            rest.splice(0, 1, place[1], place[2])
        }
    }

    // "Riverbank Energy, Bristol — Data Analyst": the company first, the role after it.
    const swapWith = rest.findIndex((part) => (ROLE.test(part) && !ROLE.test(title)) || (DEGREE.test(part) && SCHOOL.test(title) && !DEGREE.test(title)))

    if (swapWith >= 0) {
        const role = rest.splice(swapWith, 1)[0]

        rest.unshift(title)
        title = role
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

/** Section names about jobs, where "Role at Company" means a role at a company. */
export const JOBS = /experience|employment|work|career|positions|volunteer|leadership/i

export function entriesOf(lines: readonly PdfLine[], body: number, linesBeforeDates: number, jobs: boolean): CvEntry[] {
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
            const entry: CvEntry = {...emptyEntry(), ...entryHead(head, columnRight, jobs)}

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

export const LABELLED = /^([^:,]{1,30}):\s*(.*)$/

export function tagGroupsOf(lines: readonly PdfLine[]): CvTagGroup[] {
    const groups: {label: string; items: string[]; text: string}[] = []
    const current = () => groups[groups.length - 1] ?? (groups.push({label: '', items: [], text: ''}), groups[groups.length - 1])
    const start = (label: string, text = '') => groups.push({label, items: [], text})
    let listRunsOn = false

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
        } else if (!line.text.includes(',') && !listRunsOn) {
            // One skill a line, as a column lists them.
            current().items.push(line.text.replace(BULLET, ''))
        } else {
            const group = current()

            group.text = group.text ? `${group.text} ${line.text.replace(BULLET, '')}` : line.text.replace(BULLET, '')
        }

        // A list with commas may wrap mid-skill, "Performance" then "tuning, Code review".
        listRunsOn = line.text.includes(',') && !/[.;]$/.test(line.text)
    }

    return groups
        .map((group) => {
            const items = [...group.items, ...group.text.split(/\s*[,;•·|]\s*/)]
                .map((item) => item.replace(/\.$/, '').trim())
                .filter(Boolean)
                .map((item) => {
                    // "Spanish — Fluent" or "Spanish: Fluent", written as the app writes levels.
                    const level = /^(.+?)(?:\s+[—–-]\s+|\s*:\s*)(.+)$/.exec(item)

                    return level && levelOfWords(level[2]) > 0 ? joinItem(level[1], level[2]) : item
                })

            return {id: newId('group'), visible: true, label: group.label, items, ...withWordLevels(items)}
        })
        .filter((group) => group.items.length > 0 || group.label)
}

/** A section whose heading isn't known: entries if it has dates, a list if it reads like one, otherwise text. */
export function guessKind(lines: readonly PdfLine[]): HeadingKind {
    if (lines.some((line) => findDates(line.text))) {
        return 'entries'
    }

    const listy = lines.filter((line) => LABELLED.test(line.text) || line.text.split(',').length >= 3).length

    return lines.length > 0 && listy >= lines.length / 2 ? 'tags' : 'text'
}

// ---------------------------------------------------------------- the CV

/** A details row's label and value: "Label: value", or a label and a value apart, with or without a colon between. */
export function labelAndValue(line: PdfLine): [label: string, value: string] | null {
    const runs = line.runs.filter((run) => run.text !== ':')

    if (runs.length === 2 && !BULLET.test(line.text)) {
        return [runs[0].text.replace(/\s*:$/, ''), runs[1].text.replace(/^:\s*/, '')]
    }

    const labelled = LABELLED.exec(line.text)

    return labelled && !BULLET.test(line.text) ? [labelled[1].trim(), labelled[2].trim()] : null
}

/** Lines of a details section as rows of words; what isn't a row goes to `unsorted`. */
export function detailRowsOf(lines: readonly PdfLine[], unsorted: string[]): {label: string; value: string}[] {
    return lines.flatMap((line) => {
        const row = labelAndValue(line)

        if (!row) {
            unsorted.push(line.text)
            return []
        }

        return [{label: row[0], value: row[1]}]
    })
}

/** What every document read from a PDF or Word file has, before it becomes a CV or a biodata. */
export interface DocumentParts {
    /** The size most of the text is in. */
    readonly body: number
    readonly name: string
    readonly headline: string
    /** Lines above the name in its column, as a biodata's own heading line. */
    readonly above: readonly PdfLine[]
    /** Other lines before the first heading, which hold contact details. */
    readonly header: readonly PdfLine[]
    readonly sections: readonly RawSection[]
    /** How many heading lines a job has before its dates, in this document's layout. */
    readonly linesBeforeDates: number
    readonly twoColumns: boolean
}

export interface RawSection {
    readonly title: string
    readonly kind: HeadingKind | null
    readonly lines: PdfLine[]
}

/** The name, what's around it, and the sections under their headings, in reading order. */
export function documentParts(layout: PdfLayout): DocumentParts {
    const body = bodySize(layout.lines)
    const content = layout.lines.filter((line) => !isFurniture(line, body))
    // Each column read through every page: the main one first, then the side one.
    const streams = [content.filter((line) => line.column !== 'right'), content.filter((line) => line.column === 'right')]
    // The name is the largest text on the first page, unless that's a title saying "Biodata".
    const firstPage = content.filter((line) => line.page === 1 && !BIODATA_TITLE.test(line.text.trim()))
    const nameLine = firstPage.length > 0 ? firstPage.reduce((a, b) => (b.size > a.size ? b : a)) : undefined

    // The column with the name is the main one, read first, even when it is on the right.
    if (nameLine?.column === 'right') {
        streams.reverse()
    }

    const nameStream = streams.find((stream) => nameLine && stream.includes(nameLine)) ?? []
    // A headline in capitals can look like a heading; under the name, it's the headline.
    const afterName = nameStream[nameStream.indexOf(nameLine!) + 1]
    const nameAndHeadline = [nameLine, afterName && !knownHeading(afterName.text) ? afterName : undefined].filter((line): line is PdfLine => line !== undefined)
    const headings = findHeadings(content, body, nameAndHeadline)
    const sections: RawSection[] = []
    const above: PdfLine[] = []
    const header: PdfLine[] = []
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
            } else if (nameLine && stream === nameStream && line.page === 1 && line.y < nameLine.y) {
                above.push(line)
            } else {
                header.push(line)
            }
        })
    }

    return {
        body,
        name: nameLine ? titleCase(nameLine.text) : '',
        headline,
        above,
        header,
        sections,
        linesBeforeDates: learnLinesBeforeDates(
            sections.filter((section) => (section.kind ?? guessKind(section.lines)) === 'entries'),
            body,
        ),
        twoColumns: layout.lines.some((line) => line.column !== 'full'),
    }
}

/** Contact details from lines, by their shape; what has no place goes to `unsorted`. */
export function contactFrom(lines: readonly PdfLine[], contact: Contact, unsorted: string[]): void {
    for (const segment of lines.flatMap(segmentsOf)) {
        if (!placeDetail(segment.text, contact)) {
            unsorted.push(segment.text)
        }
    }
}

export const emptyContact = (): Contact => ({email: '', phone: '', location: '', links: []})

export function cvFromLayout(layout: PdfLayout): ImportedCv {
    const parts = documentParts(layout)
    const contact = emptyContact()
    const unsorted: string[] = []
    const cvSections: CvSection[] = []

    contactFrom([...parts.above, ...parts.header], contact, unsorted)

    for (const section of parts.sections) {
        const kind = section.kind ?? guessKind(section.lines)
        const base = {id: newId('section'), title: section.title, visible: true}

        if (kind === 'contact') {
            contactFrom(section.lines, contact, unsorted)
        } else if (kind === 'entries') {
            cvSections.push({...base, kind: 'entries', entries: entriesOf(section.lines, parts.body, parts.linesBeforeDates, JOBS.test(section.title))})
        } else if (kind === 'tags') {
            cvSections.push({...base, kind: 'tags', groups: tagGroupsOf(section.lines)})
        } else if (kind === 'details') {
            cvSections.push({...base, kind: 'details', rows: detailRowsOf(section.lines, unsorted).map(({label, value}) => ({id: newId('row'), visible: true, kind: 'text' as const, label, value}))})
        } else {
            // A family, which a CV doesn't list, comes in as text like any other.
            cvSections.push({...base, kind: 'text', text: textOf(section.lines)})
        }
    }

    // Last, so a link written out in a Contact section isn't added twice.
    addLinks(layout.links ?? [], contact)

    if (unsorted.length > 0) {
        cvSections.push({id: newId('section'), kind: 'text', title: NOT_SORTED, visible: false, text: unsorted.join('\n')})
    }

    const person: CvPerson = {
        name: parts.name,
        headline: parts.headline,
        email: contact.email,
        phone: contact.phone,
        location: contact.location,
        links: contact.links.map((url) => ({id: newId('link'), label: '', url})),
        photo: '',
        hide: [],
    }

    return {cv: {person, sections: cvSections, design: {...DEFAULT_DESIGN, template: parts.twoColumns ? 'modern' : 'classic'}}, unsorted: unsorted.length}
}
