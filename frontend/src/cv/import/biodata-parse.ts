/**
 * A biodata made from a PDF's or Word file's lines, with the CV's rules for headings,
 * columns and dated entries (see `parse.ts`) and its own for what a biodata has: rows of
 * a label and a value, a family, and a line of the person's own above their name.
 */

import {DEFAULT_BIODATA_DESIGN, NO_SECOND, type Biodata, type BiodataSection} from '../../biodata/biodata'
import {asLatinDigits, labelsFor} from '../../core/labels/labels'
import {cmOf} from '../details'
import {newId, type DetailRow, type FamilyMember} from '../sections'
import type {PdfLine} from './layout'
import {NOT_SORTED} from './not-sorted'
import {BIODATA_TITLE, languageOfHeadings, detailRowsOf, documentParts, entriesOf, guessKind, JOBS, labelAndValue, tagGroupsOf, textOf, type DocumentParts} from './parse'
import type {PdfLayout} from './read-pdf'

export interface ImportedBiodata {
    readonly biodata: Biodata
    /** How many lines went into Not sorted. */
    readonly unsorted: number
}

/** Whether a document is a biodata: it says so near the top, or it lists a family. */
export function isBiodata(layout: PdfLayout, parts: DocumentParts): boolean {
    const top = layout.lines.filter((line) => line.page === 1).slice(0, 8)

    return top.some((line) => /\bbio-?\s?data\b/i.test(line.text)) || parts.sections.some((section) => section.kind === 'family')
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const pad = (value: number) => String(value).padStart(2, '0')

const BANGLA_MONTHS = labelsFor('bn').page.months

/** A day as written in a biodata, "12 March 1996", "12/03/1996" (day first), "1996-03-12" or "১২ মার্চ ১৯৯৬", as "1996-03-12". */
export function dayOf(written: string): string {
    // Bangla digits and month names read as 0 to 9 and English month names.
    const text = BANGLA_MONTHS.reduce((line, name, index) => line.replace(name, MONTHS[index]), asLatinDigits(written))
    const iso = /\b((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})\b/.exec(text)
    const numbers = /\b(\d{1,2})[/.-](\d{1,2})[/.-]((?:19|20)\d{2})\b/.exec(text)
    const dayFirst = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})\.?,?\s+((?:19|20)\d{2})\b/i.exec(text)
    const monthFirst = /\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+((?:19|20)\d{2})\b/i.exec(text)
    const month = (name: string) => MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1
    let parts: [number, number, number] | null = null

    if (iso) {
        parts = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    } else if (numbers) {
        parts = [Number(numbers[3]), Number(numbers[2]), Number(numbers[1])]
    } else if (dayFirst && month(dayFirst[2]) > 0) {
        parts = [Number(dayFirst[3]), month(dayFirst[2]), Number(dayFirst[1])]
    } else if (monthFirst && month(monthFirst[1]) > 0) {
        parts = [Number(monthFirst[3]), month(monthFirst[1]), Number(monthFirst[2])]
    }

    if (!parts) {
        return ''
    }

    const [year, monthNumber, day] = parts
    const date = new Date(year, monthNumber - 1, day)

    return date.getMonth() === monthNumber - 1 && date.getDate() === day ? `${year}-${pad(monthNumber)}-${pad(day)}` : ''
}

/** A height as written, "5′ 4″", "5 ft 4 in", "5'4"" or "163 cm", in centimetres and how it was shown; null if it isn't one. */
export function heightOf(written: string): {cm: number; show: 'ft-in' | 'cm' | 'both'} | null {
    const text = asLatinDigits(written).replace(/সেমি/g, 'cm')
    const imperial = /(\d)\s*(?:['′’]|ft\.?|feet|foot)\s*(?:(\d{1,2})\s*(?:["″”]|''|in\.?|inch(?:es)?)?)?/i.exec(text)
    const metric = /(\d{2,3}(?:\.\d)?)\s*cm\b/i.exec(text)

    if (metric) {
        return {cm: Math.round(Number(metric[1])), show: imperial ? 'both' : 'cm'}
    }

    return imperial ? {cm: cmOf(Number(imperial[1]), Number(imperial[2] ?? 0)), show: 'ft-in'} : null
}

/** A row as the biodata keeps it: a date or a height the app understands, or words. */
function rowOf(label: string, value: string): DetailRow {
    const base = {id: newId('row'), visible: true, label}

    if (/\b(?:date of birth|birth ?date|born|d\.?o\.?b)\b|জন্ম ?তারিখ/i.test(label)) {
        const date = dayOf(value)

        if (date) {
            return {...base, kind: 'date', date, show: /\(\s*\d+\s*(?:years?|yrs?|বছর)\s*\)/i.test(asLatinDigits(value)) ? 'both' : 'date'}
        }
    }

    if (/\bheight\b|উচ্চতা/i.test(label)) {
        const height = heightOf(value)

        if (height) {
            return {...base, kind: 'height', ...height}
        }
    }

    return {...base, kind: 'text', value}
}

/** Words a family table's header row has. */
const FAMILY_HEADER = /^(?:relation(?:ship)?|name|work|occupation|profession|job|note|notes|remarks|details|status)$/i

/** A family table's rows, or "Relation: name, work" rows, as members. */
function familyOf(lines: readonly PdfLine[], unsorted: string[]): FamilyMember[] {
    let columns: number[] | null = null
    const members: FamilyMember[] = []

    for (const line of lines) {
        if (line.runs.length >= 2 && line.runs.every((run) => FAMILY_HEADER.test(run.text))) {
            columns = line.runs.map((run) => run.x)
            continue
        }

        const member: FamilyMember = {id: newId('member'), visible: true, relation: '', name: '', work: '', note: ''}
        const labelled = line.runs.some((run) => run.text === ':' || /:$/.test(run.text)) || (line.runs.length === 1 && /:/.test(line.text)) ? labelAndValue(line) : null

        if (labelled) {
            // "Father: John Doe, retired civil engineer"
            const [name = '', work = '', ...note] = labelled[1].split(/\s*,\s*|\s+[–—-]\s+/)

            members.push({...member, relation: labelled[0], name, work, note: note.join(', ')})
        } else if (line.runs.length >= 2) {
            // A table row: each part to the column it starts under, or in order.
            const fields: (keyof Pick<FamilyMember, 'relation' | 'name' | 'work' | 'note'>)[] = ['relation', 'name', 'work', 'note']
            const filled = {...member}

            line.runs.forEach((run, index) => {
                const column = columns ? columns.reduce((best, x, at) => (Math.abs(x - run.x) < Math.abs(columns![best] - run.x) ? at : best), 0) : index
                const field = fields[Math.min(column, fields.length - 1)]

                filled[field] = filled[field] ? `${filled[field]}, ${run.text}` : run.text
            })

            members.push(filled)
        } else {
            unsorted.push(line.text)
        }
    }

    return members
}

/** Most of a section's lines are a label and a value, so it's a details section whatever its name. */
const mostlyRows = (lines: readonly PdfLine[]) => lines.length > 0 && lines.filter((line) => labelAndValue(line)).length >= lines.length / 2

export function biodataFromLayout(layout: PdfLayout, parts: DocumentParts = documentParts(layout)): ImportedBiodata {
    const unsorted: string[] = []
    const sections: BiodataSection[] = []
    const headerRows = parts.header.filter((line) => labelAndValue(line))

    // A biodata has no headline; a line read as one is kept to sort.
    if (parts.headline) {
        unsorted.push(parts.headline)
    }

    for (const line of parts.header.filter((found) => !labelAndValue(found) && !BIODATA_TITLE.test(found.text.trim()))) {
        unsorted.push(line.text)
    }

    if (headerRows.length > 0) {
        sections.push({id: newId('section'), kind: 'details', title: 'Contact', visible: true, rows: detailRowsOf(headerRows, unsorted).map(({label, value}) => rowOf(label, value))})
    }

    for (const section of parts.sections) {
        const base = {id: newId('section'), title: section.title, visible: true}
        const kind = section.kind === 'family' ? 'family' : section.kind === 'contact' || mostlyRows(section.lines) ? 'details' : (section.kind ?? guessKind(section.lines))

        if (kind === 'family') {
            sections.push({...base, kind: 'family', members: familyOf(section.lines, unsorted)})
        } else if (kind === 'details') {
            sections.push({...base, kind: 'details', rows: detailRowsOf(section.lines, unsorted).map(({label, value}) => rowOf(label, value))})
        } else if (kind === 'entries') {
            sections.push({...base, kind: 'entries', entries: entriesOf(section.lines, parts.body, parts.linesBeforeDates, JOBS.test(section.title))})
        } else if (kind === 'tags') {
            sections.push({...base, kind: 'tags', groups: tagGroupsOf(section.lines)})
        } else {
            sections.push({...base, kind: 'text', text: textOf(section.lines)})
        }
    }

    if (unsorted.length > 0) {
        sections.push({id: newId('section'), kind: 'text', title: NOT_SORTED, visible: false, text: unsorted.join('\n')})
    }

    // The line above the name is the person's own; a title saying "Biodata" isn't.
    const heading = parts.above
        .map((line) => line.text.trim())
        .filter((text) => !BIODATA_TITLE.test(text))
        .join(' ')

    return {
        biodata: {
            heading: {text: heading, image: ''},
            person: {name: parts.name, photo: '', fullPhoto: '', hide: []},
            sections,
            second: NO_SECOND,
            design: {...DEFAULT_BIODATA_DESIGN, language: languageOfHeadings(sections.map((section) => section.title))},
        },
        unsorted: unsorted.length,
    }
}
