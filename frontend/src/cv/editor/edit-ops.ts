/** Changes to a CV, as pure functions: each takes a CV and gives back a new one. */

import {moveItem} from '../../core/list'
import {emptyEntry, newId, type Cv, type CvEntry, type CvPerson, type CvSection, type CvTagGroup} from '../cv'

export const updatePerson = (cv: Cv, change: Partial<CvPerson>): Cv => ({...cv, person: {...cv.person, ...change}})

export const updateSection = (cv: Cv, id: string, update: (section: CvSection) => CvSection): Cv => ({
    ...cv,
    sections: cv.sections.map((section) => (section.id === id ? update(section) : section)),
})

export const updateEntries = (cv: Cv, sectionId: string, update: (entries: CvEntry[]) => CvEntry[]): Cv =>
    updateSection(cv, sectionId, (section) => (section.kind === 'entries' ? {...section, entries: update(section.entries)} : section))

export const updateEntry = (cv: Cv, sectionId: string, entryId: string, change: Partial<CvEntry>): Cv =>
    updateEntries(cv, sectionId, (entries) => entries.map((entry) => (entry.id === entryId ? {...entry, ...change} : entry)))

export const updateGroups = (cv: Cv, sectionId: string, update: (groups: CvTagGroup[]) => CvTagGroup[]): Cv =>
    updateSection(cv, sectionId, (section) => (section.kind === 'tags' ? {...section, groups: update(section.groups)} : section))

export const updateGroup = (cv: Cv, sectionId: string, groupId: string, change: Partial<CvTagGroup>): Cv =>
    updateGroups(cv, sectionId, (groups) => groups.map((group) => (group.id === groupId ? {...group, ...change} : group)))

export const moveSection = (cv: Cv, from: number, to: number): Cv => ({...cv, sections: moveItem(cv.sections, from, to)})

export const removeSection = (cv: Cv, id: string): Cv => ({...cv, sections: cv.sections.filter((section) => section.id !== id)})

export const emptyGroup = (): CvTagGroup => ({id: newId('group'), visible: true, label: '', items: []})

/** The sections a person can add, under headings ATS parsers recognise. */
export const SECTION_CHOICES: readonly {readonly title: string; readonly kind: CvSection['kind']}[] = [
    {title: 'Summary', kind: 'text'},
    {title: 'Experience', kind: 'entries'},
    {title: 'Education', kind: 'entries'},
    {title: 'Skills', kind: 'tags'},
    {title: 'Projects', kind: 'entries'},
    {title: 'Certifications', kind: 'entries'},
    {title: 'Languages', kind: 'tags'},
    {title: 'Volunteering', kind: 'entries'},
    {title: 'Awards', kind: 'entries'},
    {title: 'Publications', kind: 'entries'},
    {title: 'Interests', kind: 'tags'},
]

export function newSection(title: string, kind: CvSection['kind']): CvSection {
    const base = {id: newId('section'), title, visible: true}

    if (kind === 'text') {
        return {...base, kind, text: ''}
    }

    if (kind === 'entries') {
        return {...base, kind, entries: [emptyEntry()]}
    }

    return {...base, kind, groups: [emptyGroup()]}
}

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

/** The list with part added or taken out: for the parts shown or hidden on the CV. */
export const toggled = <P extends string>(list: readonly P[], part: P): P[] => (list.includes(part) ? list.filter((item) => item !== part) : [...list, part])
