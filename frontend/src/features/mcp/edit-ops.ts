/**
 * The changes an assistant can make to a document, as small named steps. They're
 * applied in order to a copy, and the result is checked against the document's own
 * schema, so either all of them happen or none do.
 *
 * The input is one flat object with an `op` and the fields that op uses, rather than a
 * union of shapes, because Gemini and others reject unions in a tool's schema.
 */

import {z} from 'zod'
import {cmOf} from '../../cv/details'
import {emptyGroup, newSection} from '../../cv/editor/edit-ops'
import {levelsFor} from '../../cv/levels'
import {emptyEntry, newId, type DetailRow, type Entry, type FamilyMember, type Section, type SectionKind, type TagGroup} from '../../cv/sections'
import type {Content} from '../../store/document-types'

export const OPS = [
    'set_field',
    'set_links',
    'add_section',
    'rename_section',
    'remove_section',
    'move_section',
    'set_text',
    'add_entry',
    'update_entry',
    'remove_entry',
    'move_entry',
    'set_tags',
    'remove_group',
    'set_details',
    'set_family',
    'set_visible',
    'set_closing',
] as const

export type Op = (typeof OPS)[number]

const MONTH = /^(\d{4}-(0[1-9]|1[0-2]))?$/
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export const operationSchema = z.object({
    op: z.enum(OPS).describe('What to do. Each op uses some of the fields below, as its description in edit_document says.'),
    section: z.string().optional().describe("A section's id, or its exact title."),
    entry: z.string().optional().describe("An entry's id."),
    group: z.string().optional().describe("A group's id, in a section of tags."),
    row: z.string().optional().describe("A row's id, in a section of details."),
    member: z.string().optional().describe("A family member's id."),
    position: z.number().int().min(0).optional().describe('Where to put it, counting from 0. Default: at the end.'),
    field: z.enum(['name', 'headline', 'email', 'phone', 'location', 'heading']).optional().describe('For set_field.'),
    value: z.string().optional().describe('For set_field.'),
    kind: z.enum(['text', 'entries', 'tags', 'details', 'family']).optional().describe('For add_section.'),
    title: z.string().optional().describe("A section's title, or an entry's role, degree or project."),
    org: z.string().optional().describe("An entry's company, school or client."),
    location: z.string().optional(),
    start: z.string().optional().describe('A month as YYYY-MM, or "".'),
    end: z.string().optional().describe('A month as YYYY-MM, or "" when current or not given.'),
    current: z.boolean().optional().describe('True while it goes on: shown as "Present".'),
    summary: z.string().optional().describe("A line under an entry's title."),
    bullets: z.array(z.string()).optional().describe("An entry's bullets, replacing those it has."),
    text: z.string().optional().describe("A text section's text. Paragraphs are separated by a blank line."),
    label: z.string().optional().describe("A group's label, such as Languages, or none."),
    items: z.array(z.string()).optional().describe('A group\'s items, replacing those it has. A level in words goes in brackets: "English (Fluent)".'),
    rows: z
        .array(z.object({label: z.string(), value: z.string()}))
        .optional()
        .describe('A details section\'s rows, replacing those it has. A date of birth is YYYY-MM-DD; a height is "163 cm" or "5\'4\\"".'),
    members: z
        .array(z.object({relation: z.string(), name: z.string(), work: z.string().optional(), note: z.string().optional()}))
        .optional()
        .describe("A family section's members, replacing those it has."),
    links: z.array(z.object({label: z.string(), url: z.string()})).optional().describe("A CV's links, replacing those it has."),
    visible: z.boolean().optional().describe('For set_visible: whether it shows on the page.'),
})

export type Operation = z.infer<typeof operationSchema>

/** What each op does and needs, for the tool's description. */
export const OPS_HELP = [
    'set_field: field, value. A CV has name, headline, email, phone, location; a biodata has name and heading (the line above the name, in the person\'s own words).',
    'set_links: links (a CV\'s web links, such as LinkedIn).',
    'add_section: kind, title, position. Kinds: text, entries (jobs, schools, projects), tags (skills, languages), details (label and value rows), family (biodata only).',
    'rename_section, remove_section, move_section: section, then title or position.',
    'set_text: section, text.',
    'add_entry: section, then title, org, location, start, end, current, summary, bullets, position.',
    'update_entry: entry, then only the fields to change.',
    'remove_entry, move_entry: entry, then position.',
    'set_tags: section, then group (or a label to find or make one), items, label.',
    'remove_group: group.',
    'set_details: section, rows.',
    'set_family: section, members.',
    'set_visible: one of section, entry, group, row or member, then visible.',
    'set_closing: a CV’s closing line, as German and South Asian CVs end: visible to show or hide it, location for the place, value for a fixed day as YYYY-MM-DD or "" for the day it’s printed. A signature picture is added by the person in the app.',
]

export class OperationError extends Error {}

/** What applying a list of operations made, and what it changed, in words. */
export interface Applied {
    readonly content: Content
    readonly changes: readonly string[]
    /** Ids of what was added, so the assistant can change it next. */
    readonly added: readonly {readonly what: string; readonly id: string}[]
}

/** A document while it's being changed: its sections, loosely. The schema checks the rest after. */
interface Doc {
    sections: Section[]
    person: Record<string, unknown>
    heading?: Record<string, unknown>
    closing?: Record<string, unknown>
    [key: string]: unknown
}

const PERSON_FIELDS: Readonly<Record<string, readonly string[]>> = {
    cv: ['name', 'headline', 'email', 'phone', 'location'],
    biodata: ['name', 'heading'],
}

const SECTION_KINDS: Readonly<Record<string, readonly SectionKind[]>> = {
    cv: ['text', 'entries', 'tags', 'details'],
    biodata: ['text', 'entries', 'tags', 'details', 'family'],
}

function need<T>(value: T | undefined, name: string): T {
    if (value === undefined) {
        throw new OperationError(`it needs ${name}`)
    }

    return value
}

const placed = <T>(list: readonly T[], item: T, position: number | undefined): T[] => {
    const at = position === undefined ? list.length : Math.min(position, list.length)

    return [...list.slice(0, at), item, ...list.slice(at)]
}

const moved = <T>(list: readonly T[], from: number, position: number): T[] => {
    const rest = list.filter((_, index) => index !== from)

    return placed(rest, list[from], position)
}

function checkMonth(value: string | undefined, name: string): void {
    if (value !== undefined && !MONTH.test(value)) {
        throw new OperationError(`${name} must be a month as YYYY-MM, or "", not "${value}"`)
    }
}

/** A height in centimetres from "163 cm", "163", "5'4\"", "5 ft 4 in" or "5'4". */
export function heightOf(value: string): number | null {
    const text = value.trim().toLowerCase()
    const cm = /^(\d+(?:\.\d+)?)\s*(cm)?$/.exec(text)

    if (cm) {
        return Math.round(Number(cm[1]))
    }

    const feet = /^(\d)\s*(?:'|′|ft|feet|foot)\s*(?:(\d{1,2})\s*(?:"|″|in|inches)?)?$/.exec(text)

    return feet ? cmOf(Number(feet[1]), Number(feet[2] ?? 0)) : null
}

/** Applies the operations in order. Throws OperationError naming the first one that can't be done. */
export function applyOperations(content: Content, kind: string, operations: readonly Operation[]): Applied {
    let doc = structuredClone(content) as unknown as Doc
    const changes: string[] = []
    const added: {what: string; id: string}[] = []

    const findSection = (key: string | undefined): {section: Section; index: number} => {
        const wanted = need(key, 'a section').trim()
        let index = doc.sections.findIndex((section) => section.id === wanted)

        if (index < 0) {
            const byTitle = doc.sections.flatMap((section, at) => (section.title.trim().toLowerCase() === wanted.toLowerCase() ? [at] : []))

            if (byTitle.length > 1) {
                throw new OperationError(`more than one section is called "${wanted}": use its id`)
            }

            index = byTitle[0] ?? -1
        }

        if (index < 0) {
            throw new OperationError(`there's no section "${wanted}"`)
        }

        return {section: doc.sections[index], index}
    }

    const sectionOfKind = <K extends SectionKind>(key: string | undefined, wanted: K): Extract<Section, {kind: K}> => {
        const {section} = findSection(key)

        if (section.kind !== wanted) {
            throw new OperationError(`"${section.title}" is a section of ${section.kind}, not ${wanted}`)
        }

        return section as Extract<Section, {kind: K}>
    }

    const replaceSection = (section: Section) => {
        doc = {...doc, sections: doc.sections.map((candidate) => (candidate.id === section.id ? section : candidate))}
    }

    const findEntry = (id: string | undefined): {section: Extract<Section, {kind: 'entries'}>; entry: Entry; index: number} => {
        const wanted = need(id, 'an entry')

        for (const section of doc.sections) {
            if (section.kind === 'entries') {
                const index = section.entries.findIndex((entry) => entry.id === wanted)

                if (index >= 0) {
                    return {section, entry: section.entries[index], index}
                }
            }
        }

        throw new OperationError(`there's no entry "${wanted}"`)
    }

    const entryFields = (operation: Operation): Partial<Entry> => {
        checkMonth(operation.start, 'start')
        checkMonth(operation.end, 'end')

        const fields: Partial<Entry> = {}

        for (const key of ['title', 'org', 'location', 'start', 'end', 'summary'] as const) {
            if (operation[key] !== undefined) {
                fields[key] = operation[key]
            }
        }

        if (operation.current !== undefined) {
            fields.current = operation.current
        }

        if (operation.bullets !== undefined) {
            fields.bullets = operation.bullets.map((bullet) => bullet.trim()).filter(Boolean)
        }

        return fields
    }

    const named = (entry: Entry): string => `"${[entry.title, entry.org].filter(Boolean).join(', ') || 'an entry'}"`

    operations.forEach((operation, number) => {
        try {
            switch (operation.op) {
                case 'set_field': {
                    const field = need(operation.field, 'field')
                    const value = need(operation.value, 'value')

                    if (!PERSON_FIELDS[kind]?.includes(field)) {
                        throw new OperationError(`a ${kind} has no field ${field}: it has ${PERSON_FIELDS[kind]?.join(', ')}`)
                    }

                    doc = field === 'heading' ? {...doc, heading: {...doc.heading, text: value}} : {...doc, person: {...doc.person, [field]: value}}

                    changes.push(`set the ${field}`)
                    break
                }

                case 'set_closing': {
                    if (kind !== 'cv') {
                        throw new OperationError(`a ${kind} has no closing line`)
                    }

                    if (operation.value !== undefined && operation.value !== '' && !DAY.test(operation.value)) {
                        throw new OperationError(`the day must be YYYY-MM-DD or "", not "${operation.value}"`)
                    }

                    const closing = {
                        ...doc.closing,
                        ...(operation.visible !== undefined ? {show: operation.visible} : {}),
                        ...(operation.location !== undefined ? {place: operation.location} : {}),
                        ...(operation.value !== undefined ? {date: operation.value} : {}),
                    }

                    doc = {...doc, closing}
                    changes.push(operation.visible === false ? 'took off the closing line' : 'set the closing line')
                    break
                }

                case 'set_links': {
                    if (kind !== 'cv') {
                        throw new OperationError(`a ${kind} has no links`)
                    }

                    const links = need(operation.links, 'links').map((link) => ({id: newId('link'), label: link.label, url: link.url}))
                    doc = {...doc, person: {...doc.person, links}}
                    changes.push('set the links')
                    break
                }

                case 'add_section': {
                    const sectionKind = need(operation.kind, 'kind')
                    const title = need(operation.title, 'title').trim()

                    if (!SECTION_KINDS[kind]?.includes(sectionKind)) {
                        throw new OperationError(`a ${kind} can't have a section of ${sectionKind}`)
                    }

                    const section = newSection(title, sectionKind)
                    // An assistant fills a section itself, so it starts with nothing in it.
                    const empty: Section =
                        section.kind === 'entries' ? {...section, entries: []} : section.kind === 'details' ? {...section, rows: []} : section.kind === 'family' ? {...section, members: []} : section.kind === 'tags' ? {...section, groups: []} : section

                    doc = {...doc, sections: placed(doc.sections, empty, operation.position)}
                    added.push({what: `section "${title}"`, id: empty.id})
                    changes.push(`added the section ${title}`)
                    break
                }

                case 'rename_section': {
                    const {section} = findSection(operation.section)
                    const title = need(operation.title, 'title').trim()

                    replaceSection({...section, title})
                    changes.push(`renamed ${section.title} to ${title}`)
                    break
                }

                case 'remove_section': {
                    const {section} = findSection(operation.section)

                    doc = {...doc, sections: doc.sections.filter((candidate) => candidate.id !== section.id)}
                    changes.push(`removed the section ${section.title}`)
                    break
                }

                case 'move_section': {
                    const {section, index} = findSection(operation.section)

                    doc = {...doc, sections: moved(doc.sections, index, need(operation.position, 'position'))}
                    changes.push(`moved ${section.title}`)
                    break
                }

                case 'set_text': {
                    const section = sectionOfKind(operation.section, 'text')

                    replaceSection({...section, text: need(operation.text, 'text').trim()})
                    changes.push(`rewrote ${section.title}`)
                    break
                }

                case 'add_entry': {
                    const section = sectionOfKind(operation.section, 'entries')
                    const entry = {...emptyEntry(), ...entryFields(operation)}

                    replaceSection({...section, entries: placed(section.entries, entry, operation.position)})
                    added.push({what: `entry ${named(entry)}`, id: entry.id})
                    changes.push(`added ${named(entry)} to ${section.title}`)
                    break
                }

                case 'update_entry': {
                    const {section, entry} = findEntry(operation.entry)
                    const fields = entryFields(operation)

                    if (Object.keys(fields).length === 0) {
                        throw new OperationError('it changes nothing: give the fields to change')
                    }

                    const changed = {...entry, ...fields}

                    replaceSection({...section, entries: section.entries.map((candidate) => (candidate.id === entry.id ? changed : candidate))})
                    changes.push(`changed ${named(changed)} in ${section.title}`)
                    break
                }

                case 'remove_entry': {
                    const {section, entry} = findEntry(operation.entry)

                    replaceSection({...section, entries: section.entries.filter((candidate) => candidate.id !== entry.id)})
                    changes.push(`removed ${named(entry)} from ${section.title}`)
                    break
                }

                case 'move_entry': {
                    const {section, entry, index} = findEntry(operation.entry)

                    replaceSection({...section, entries: moved(section.entries, index, need(operation.position, 'position'))})
                    changes.push(`moved ${named(entry)} in ${section.title}`)
                    break
                }

                case 'set_tags': {
                    const section = sectionOfKind(operation.section, 'tags')
                    const items = need(operation.items, 'items')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    const label = operation.label?.trim()
                    let group: TagGroup | undefined

                    if (operation.group !== undefined) {
                        group = section.groups.find((candidate) => candidate.id === operation.group)

                        if (!group) {
                            throw new OperationError(`there's no group "${operation.group}" in ${section.title}`)
                        }
                    } else if (label !== undefined) {
                        group = section.groups.find((candidate) => candidate.label.trim().toLowerCase() === label.toLowerCase())
                    } else if (section.groups.length === 1) {
                        group = section.groups[0]
                    } else if (section.groups.length > 1) {
                        throw new OperationError(`${section.title} has more than one group: give a group's id, or a label`)
                    }

                    const before = group ?? {...emptyGroup(), label: label ?? ''}
                    const after: TagGroup = {...before, label: label ?? before.label, items, levels: levelsFor(items, before)}

                    replaceSection({...section, groups: group ? section.groups.map((candidate) => (candidate.id === after.id ? after : candidate)) : [...section.groups, after]})

                    if (!group) {
                        added.push({what: `group "${after.label || section.title}"`, id: after.id})
                    }

                    changes.push(`set ${after.label || section.title}`)
                    break
                }

                case 'remove_group': {
                    const wanted = need(operation.group, 'group')
                    const section = doc.sections.find((candidate) => candidate.kind === 'tags' && candidate.groups.some((group) => group.id === wanted))

                    if (!section || section.kind !== 'tags') {
                        throw new OperationError(`there's no group "${wanted}"`)
                    }

                    replaceSection({...section, groups: section.groups.filter((group) => group.id !== wanted)})
                    changes.push(`removed a group from ${section.title}`)
                    break
                }

                case 'set_details': {
                    const section = sectionOfKind(operation.section, 'details')
                    const rows = need(operation.rows, 'rows').map(({label, value}): DetailRow => {
                        const existing = section.rows.find((row) => row.label.trim().toLowerCase() === label.trim().toLowerCase())
                        const base = {id: existing?.id ?? newId('row'), visible: existing?.visible ?? true, label: label.trim()}

                        if (existing?.kind === 'date') {
                            if (value.trim() !== '' && !DAY.test(value.trim())) {
                                throw new OperationError(`${label} is a date: give it as YYYY-MM-DD, not "${value}"`)
                            }

                            return {...base, kind: 'date', date: value.trim(), show: existing.show}
                        }

                        if (existing?.kind === 'height') {
                            const cm = value.trim() === '' ? 0 : heightOf(value)

                            if (cm === null) {
                                throw new OperationError(`${label} is a height: give it as "163 cm" or "5'4\\"", not "${value}"`)
                            }

                            return {...base, kind: 'height', cm, show: existing.show}
                        }

                        return {...base, kind: 'text', value: value.trim()}
                    })

                    replaceSection({...section, rows})
                    changes.push(`set ${section.title}`)
                    break
                }

                case 'set_family': {
                    const section = sectionOfKind(operation.section, 'family')
                    const members = need(operation.members, 'members').map(
                        (member): FamilyMember => ({id: newId('member'), visible: true, relation: member.relation.trim(), name: member.name.trim(), work: member.work?.trim() ?? '', note: member.note?.trim() ?? ''}),
                    )

                    replaceSection({...section, members})
                    changes.push(`set ${section.title}`)
                    break
                }

                case 'set_visible': {
                    const visible = need(operation.visible, 'visible')
                    const shown = visible ? 'showed' : 'hid'

                    if (operation.entry !== undefined) {
                        const {section, entry} = findEntry(operation.entry)

                        replaceSection({...section, entries: section.entries.map((candidate) => (candidate.id === entry.id ? {...candidate, visible} : candidate))})
                        changes.push(`${shown} ${named(entry)}`)
                    } else if (operation.group !== undefined || operation.row !== undefined || operation.member !== undefined) {
                        const id = operation.group ?? operation.row ?? operation.member
                        let found = false

                        doc = {
                            ...doc,
                            sections: doc.sections.map((section) => {
                                const flip = <T extends {id: string; visible: boolean}>(list: readonly T[]): T[] =>
                                    list.map((item) => {
                                        if (item.id !== id) {
                                            return item
                                        }

                                        found = true
                                        return {...item, visible}
                                    })

                                return section.kind === 'tags'
                                    ? {...section, groups: flip(section.groups)}
                                    : section.kind === 'details'
                                      ? {...section, rows: flip(section.rows)}
                                      : section.kind === 'family'
                                        ? {...section, members: flip(section.members)}
                                        : section
                            }),
                        }

                        if (!found) {
                            throw new OperationError(`there's nothing with the id "${id}"`)
                        }

                        changes.push(`${shown} a part of a section`)
                    } else {
                        const {section} = findSection(operation.section)

                        replaceSection({...section, visible})
                        changes.push(`${shown} ${section.title}`)
                    }

                    break
                }
            }
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error)

            throw new OperationError(`Operation ${number + 1} (${operation.op}): ${detail}. Nothing was changed.`)
        }
    })

    return {content: doc as unknown as Content, changes, added}
}
