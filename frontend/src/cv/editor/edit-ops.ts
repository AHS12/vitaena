/**
 * Changes to a document, as pure functions: each takes one and gives back a new one. The
 * section changes work on any document made of sections; the rest are a CV's own.
 */

import {moveItem} from '../../core/list'
import {type Cv, type CvPerson, type CvSection, type CvTagGroup} from '../cv'
import {emptyEntry, emptyFamilyMember, newId, type DetailRow, type Entry, type FamilyMember, type Section, type SectionKind, type Sectioned, type TagGroup} from '../sections'
import type {SectionChoice} from './AddSection'
import {emptyDetailRow} from '../details'
import {labelsFor, type Labels} from '../../core/labels/labels'

export const updatePerson = (cv: Cv, change: Partial<CvPerson>): Cv => ({...cv, person: {...cv.person, ...change}})

/** Changes one section, in any document made of sections. */
export const updateSection = <D extends Sectioned>(doc: D, id: string, update: (section: Section) => Section): D => ({
    ...doc,
    sections: doc.sections.map((section) => (section.id === id ? update(section) : section)),
})

export const updateEntries = <D extends Sectioned>(doc: D, sectionId: string, update: (entries: Entry[]) => Entry[]): D =>
    updateSection(doc, sectionId, (section) => (section.kind === 'entries' ? {...section, entries: update(section.entries)} : section))

export const updateEntry = <D extends Sectioned>(doc: D, sectionId: string, entryId: string, change: Partial<Entry>): D =>
    updateEntries(doc, sectionId, (entries) => entries.map((entry) => (entry.id === entryId ? {...entry, ...change} : entry)))

export const updateGroups = <D extends Sectioned>(doc: D, sectionId: string, update: (groups: TagGroup[]) => TagGroup[]): D =>
    updateSection(doc, sectionId, (section) => (section.kind === 'tags' ? {...section, groups: update(section.groups)} : section))

export const updateGroup = <D extends Sectioned>(doc: D, sectionId: string, groupId: string, change: Partial<TagGroup>): D =>
    updateGroups(doc, sectionId, (groups) => groups.map((group) => (group.id === groupId ? {...group, ...change} : group)))

export const updateRows = <D extends Sectioned>(doc: D, sectionId: string, update: (rows: DetailRow[]) => DetailRow[]): D =>
    updateSection(doc, sectionId, (section) => (section.kind === 'details' ? {...section, rows: update(section.rows)} : section))

/** Changes one row. The change names fields of the row's own kind; a date row has no `cm`. */
export const updateRow = <D extends Sectioned>(doc: D, sectionId: string, rowId: string, change: Partial<DetailRow>): D =>
    updateRows(doc, sectionId, (rows) => rows.map((row) => (row.id === rowId ? ({...row, ...change} as DetailRow) : row)))

export const updateMembers = <D extends Sectioned>(doc: D, sectionId: string, update: (members: FamilyMember[]) => FamilyMember[]): D =>
    updateSection(doc, sectionId, (section) => (section.kind === 'family' ? {...section, members: update(section.members)} : section))

export const updateMember = <D extends Sectioned>(doc: D, sectionId: string, memberId: string, change: Partial<FamilyMember>): D =>
    updateMembers(doc, sectionId, (members) => members.map((member) => (member.id === memberId ? {...member, ...change} : member)))

export const moveSection = <D extends Sectioned>(doc: D, from: number, to: number): D => ({...doc, sections: moveItem(doc.sections, from, to)})

export const removeSection = <D extends Sectioned>(doc: D, id: string): D => ({...doc, sections: doc.sections.filter((section) => section.id !== id)})

export const emptyGroup = (): CvTagGroup => ({id: newId('group'), visible: true, label: '', items: [], showLevels: false, levels: []})

/** The sections a person can add, under headings ATS parsers recognise. */
export const SECTION_CHOICES: readonly {readonly key: keyof Labels['sections']; readonly kind: CvSection['kind']}[] = [
    {key: 'summary', kind: 'text'},
    {key: 'experience', kind: 'entries'},
    {key: 'education', kind: 'entries'},
    {key: 'skills', kind: 'tags'},
    {key: 'projects', kind: 'entries'},
    {key: 'certifications', kind: 'entries'},
    {key: 'languages', kind: 'tags'},
    {key: 'volunteering', kind: 'entries'},
    {key: 'awards', kind: 'entries'},
    {key: 'publications', kind: 'entries'},
    {key: 'interests', kind: 'tags'},
    {key: 'personalDetails', kind: 'details'},
]

export function newSection(title: string, kind: SectionKind): Section {
    const base = {id: newId('section'), title, visible: true}

    if (kind === 'text') {
        return {...base, kind, text: ''}
    }

    if (kind === 'entries') {
        return {...base, kind, entries: [emptyEntry()]}
    }

    if (kind === 'details') {
        return {...base, kind, rows: [emptyDetailRow()]}
    }

    if (kind === 'family') {
        return {...base, kind, members: [emptyFamilyMember()]}
    }

    return {...base, kind, groups: [emptyGroup()]}
}

/**
 * "Add a section" for a CV: the usual sections, each once, then a custom one of each kind.
 * The menu is in English, as the interface is; the headings are in the CV's language.
 */
export function cvSectionChoices(language = 'en'): SectionChoice[] {
    const english = labelsFor('en').sections
    const words = labelsFor(language).sections
    const label = (key: keyof Labels['sections']) => (words[key] === english[key] ? english[key] : `${english[key]} · ${words[key]}`)

    return [
        ...SECTION_CHOICES.map((choice) => ({id: english[choice.key], label: label(choice.key), title: words[choice.key], once: true, make: () => newSection(words[choice.key], choice.kind)})),
        {id: 'custom-text', label: 'Custom: a paragraph', group: 'custom', make: () => newSection(words.custom, 'text')},
        {id: 'custom-list', label: 'Custom: a list of entries', group: 'custom', make: () => newSection(words.custom, 'entries')},
        {id: 'custom-details', label: 'Custom: labels and values', group: 'custom', make: () => newSection(words.custom, 'details')},
    ]
}

export const CV_SECTION_CHOICES: readonly SectionChoice[] = cvSectionChoices()

/** Words for an entry's two name fields that suit its section. */
export function entryWords(sectionTitle: string): {title: string; titleExample: string; org: string; orgExample: string} {
    const title = sectionTitle.toLowerCase()

    if (/educat|school|stud|degree|qualif/.test(title)) {
        return {title: 'Degree', titleExample: 'BSc in Computer Science', org: 'School', orgExample: 'University of Dhaka'}
    }

    if (/project/.test(title)) {
        return {title: 'Project', titleExample: 'Open-source maintainer', org: 'For', orgExample: 'Personal, client or company'}
    }

    if (/certif|licen|course/.test(title)) {
        return {title: 'Certificate', titleExample: 'AWS Solutions Architect', org: 'Issued by', orgExample: 'Amazon Web Services'}
    }

    if (/publica|paper|talk/.test(title)) {
        return {title: 'Title', titleExample: 'Finding the slow part', org: 'Where', orgExample: 'Journal, conference or venue'}
    }

    if (/award|honou?r/.test(title)) {
        return {title: 'Award', titleExample: 'Engineer of the Year', org: 'Given by', orgExample: 'Organisation'}
    }

    if (/volunt/.test(title)) {
        return {title: 'Role', titleExample: 'Mentor', org: 'Organisation', orgExample: 'Code Club'}
    }

    return {title: 'Role', titleExample: 'Software Engineer', org: 'Company', orgExample: 'Company name'}
}

/** Gentle checks on contact details. Null when there's nothing to say. */
export const emailWarning = (email: string): string | null =>
    email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? "This doesn't look like an email address yet." : null

export const linkWarning = (url: string): string | null =>
    url.trim() && !/^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/i.test(url.trim()) ? 'Links look like linkedin.com/in/your-name.' : null

/** The list with part added or taken out: for the parts shown or hidden on the page. */
export const toggled = <P extends string>(list: readonly P[], part: P): P[] => (list.includes(part) ? list.filter((item) => item !== part) : [...list, part])
