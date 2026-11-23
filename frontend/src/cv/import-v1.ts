/**
 * Brings a CV across from Vitaena 1, the web app. Its Export saved one resume as JSON in
 * its own shape; this turns that into a CV, keeping what was hidden hidden.
 *
 * Only the shape is trusted, never the values: anything missing or odd becomes empty.
 */

import {DEFAULT_DESIGN, NO_CLOSING, newId, type Cv, type CvEntry, type CvSection} from './cv'
import {withWordLevels} from './levels'

type Raw = Record<string, unknown>

/** v1 kept the photo as a data URL; only a JPEG or PNG one comes across. */
const v1Photo = (value: unknown): string => (typeof value === 'string' && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '')

const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown): string => (typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '')
const list = (value: unknown): Raw[] => (Array.isArray(value) ? value.filter(isObject) : [])
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.map(text).filter((item) => item.trim()) : [])
/** v1's show flags: missing means shown, as v1 did. */
const shown = (value: unknown): boolean => value !== false

/** A v1 month and year as "2023-01", or "" when there's no year. */
function month(year: unknown, monthNumber: unknown): string {
    const y = Number(year)
    const m = Number(monthNumber)

    if (!Number.isInteger(y) || y < 1900 || y > 2200) {
        return ''
    }

    return `${y}-${String(Number.isInteger(m) && m >= 1 && m <= 12 ? m : 1).padStart(2, '0')}`
}

function dates(range: unknown): Pick<CvEntry, 'start' | 'end' | 'current'> {
    if (!isObject(range)) {
        return {start: '', end: '', current: false}
    }

    const current = range.isOngoing === true

    return {start: month(range.startYear, range.startMonth), end: current ? '' : month(range.endYear, range.endMonth), current}
}

function entry(fields: Partial<CvEntry>, hide: CvEntry['hide'] = []): CvEntry {
    return {id: newId('entry'), visible: true, title: '', org: '', location: '', start: '', end: '', current: false, summary: '', bullets: [], hide, ...fields}
}

const entries = (title: string, visible: unknown, items: CvEntry[]): CvSection | null => (items.length > 0 ? {id: newId('section'), kind: 'entries', title, visible: shown(visible), entries: items} : null)

const tags = (title: string, visible: unknown, items: string[]): CvSection | null =>
    items.length > 0 ? {id: newId('section'), kind: 'tags', title, visible: shown(visible), groups: [{id: newId('group'), visible: true, label: '', items, ...withWordLevels(items)}]} : null

/** True for a file that looks like Vitaena 1's export. */
export const isV1Resume = (raw: unknown): raw is Raw => isObject(raw) && isObject(raw.personalInfo) && Array.isArray(raw.workExperience)

export function cvFromV1(raw: unknown): {name: string; content: Cv} | null {
    if (!isV1Resume(raw)) {
        return null
    }

    const info = raw.personalInfo as Raw
    const sections: (CvSection | null)[] = []
    const hidePerson: Cv['person']['hide'] = []

    if (info.showEmail === false) hidePerson.push('email')
    if (info.showPhone === false) hidePerson.push('phone')
    if (info.showLocation === false) hidePerson.push('location')
    if (info.showPhoto === false) hidePerson.push('photo')

    const links = [
        info.showLinkedIn !== false ? text(info.linkedIn) : '',
        info.showWebsite !== false ? text(info.website) : '',
    ]
        .filter((url) => url.trim())
        .map((url) => ({id: newId('link'), label: '', url}))

    if (text(raw.summary).trim()) {
        sections.push({id: newId('section'), kind: 'text', title: 'Summary', visible: shown(raw.showSummary), text: text(raw.summary)})
    }

    sections.push(
        entries(
            'Experience',
            raw.showWorkExperience,
            list(raw.workExperience).map((job) => {
                const hide: CvEntry['hide'] = []

                if (job.showLocation === false) hide.push('location')
                if (job.showDateRange === false) hide.push('dates')
                if (job.showDescription === false) hide.push('summary')

                return entry({title: text(job.position), org: text(job.company), location: text(job.location), ...dates(job.dateRange), summary: text(job.description), bullets: job.showBullets === false ? [] : strings(job.bullets), visible: shown(job.show)}, hide)
            }),
        ),
        entries(
            'Education',
            raw.showEducation,
            list(raw.education).map((school) => {
                const hide: CvEntry['hide'] = []

                if (school.showLocation === false) hide.push('location')
                if (school.showDateRange === false) hide.push('dates')

                return entry({title: text(school.degree), org: text(school.institution), location: text(school.location), ...dates(school.dateRange), summary: school.showGpa !== false && text(school.gpa) ? `GPA ${text(school.gpa)}` : '', visible: shown(school.show)}, hide)
            }),
        ),
        tags('Skills', raw.showSkills, list(raw.skills).filter((skill) => shown(skill.show)).map((skill) => text(skill.name)).filter(Boolean)),
        entries(
            'Projects',
            raw.showProjects,
            list(raw.projects).map((project) => {
                const technologies = strings(project.technologies)
                const link = project.showLink !== false ? text(project.link) : ''

                return entry(
                    {
                        title: text(project.title),
                        ...dates(project.dateRange),
                        summary: [project.showDescription !== false ? text(project.description) : '', link ? `[${link.replace(/^https?:\/\//, '')}](${link})` : ''].filter(Boolean).join(' '),
                        bullets: technologies.length > 0 ? [`Technologies: ${technologies.join(', ')}`] : [],
                        visible: shown(project.show),
                    },
                    project.showDateRange === false ? ['dates'] : [],
                )
            }),
        ),
        entries(
            'Certifications',
            raw.showCertifications,
            list(raw.certifications).map((certificate) => {
                const issued = isObject(certificate.issueDate) ? month(certificate.issueDate.year, certificate.issueDate.month) : ''
                const id = certificate.showCredentialId !== false ? text(certificate.credentialId) : ''

                return entry({title: text(certificate.name), org: text(certificate.issuingOrganization), start: issued, end: issued, summary: id ? `Credential ID ${id}` : '', visible: shown(certificate.show)}, certificate.showIssueDate === false ? ['dates'] : [])
            }),
        ),
        tags(
            'Languages',
            raw.showLanguages,
            list(raw.languages)
                .filter((language) => shown(language.show))
                .map((language) => (text(language.levelText) ? `${text(language.name)} (${text(language.levelText)})` : text(language.name)))
                .filter((item) => item.trim()),
        ),
        entries(
            'Activities',
            raw.showActivities,
            list(raw.activities).map((activity) => entry({title: text(activity.title), location: text(activity.location), ...dates(activity.dateRange), summary: text(activity.description), visible: shown(activity.show)})),
        ),
        entries('Strengths', raw.showStrengths, list(raw.strengths).map((strength) => entry({title: text(strength.title), summary: text(strength.description), visible: shown(strength.show)}))),
        tags('Interests', raw.showInterests, list(raw.interests).filter((interest) => shown(interest.show)).map((interest) => text(interest.title)).filter(Boolean)),
        ...list(raw.customSections).map((custom) =>
            entries(
                text(custom.title) || 'More',
                custom.showTitle,
                list(custom.items).map((item) => entry({title: text(item.title), summary: [text(item.description), text(item.details)].filter(Boolean).join(' '), ...(item.showDateRange !== false ? dates(item.dateRange) : {})})),
            ),
        ),
    )

    const name = text(info.name).trim()

    return {
        name: name ? `${name} (from Vitaena 1)` : 'CV from Vitaena 1',
        content: {
            person: {name: text(info.name), headline: text(info.title), email: text(info.email), phone: text(info.phone), location: text(info.location), links, photo: v1Photo(info.photo), hide: hidePerson},
            sections: sections.filter((section) => section !== null),
            closing: NO_CLOSING,
            design: {...DEFAULT_DESIGN},
        },
    }
}
