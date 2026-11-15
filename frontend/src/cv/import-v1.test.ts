import {afterEach, describe, expect, it} from 'vitest'
import {fakeDesktop} from '../platform/shell'
import {useDocumentStore} from '../store/document-store'
import {cvType} from './cv'
import {cvFromV1} from './import-v1'
import {renderModel} from './render-model'

/** A resume as Vitaena 1's Export wrote it. */
const V1 = {
    id: 'abc',
    templateId: 'azizul-classic',
    personalInfo: {
        name: 'Rahim Uddin',
        title: 'Backend Engineer',
        phone: '+880 1800 000000',
        email: 'rahim@example.com',
        location: 'Khulna, Bangladesh',
        linkedIn: 'https://linkedin.com/in/rahim-example',
        website: '',
        showPhone: false,
        showEmail: true,
        showLocation: true,
        showLinkedIn: true,
        showWebsite: false,
        showPhoto: false,
    },
    summary: 'Backend engineer who likes queues.',
    showSummary: true,
    workExperience: [
        {
            id: 'w1',
            company: 'Shohoz',
            position: 'Backend Engineer',
            location: 'Dhaka',
            dateRange: {startMonth: 3, startYear: 2021, isOngoing: true},
            description: 'Ticketing platform.',
            bullets: ['Moved bookings to a queue.', ''],
            showBullets: true,
            showDescription: false,
            showLocation: true,
            showDateRange: true,
            show: true,
        },
        {
            id: 'w2',
            company: 'Old Co',
            position: 'Intern',
            location: '',
            dateRange: {startYear: 2019, endMonth: 6, endYear: 2019, isOngoing: false},
            description: '',
            bullets: [],
            showBullets: true,
            showDescription: true,
            showLocation: true,
            showDateRange: true,
            show: false,
        },
    ],
    showWorkExperience: true,
    education: [{id: 'e1', institution: 'KUET', degree: 'BSc in CSE', location: 'Khulna', dateRange: {startYear: 2015, endYear: 2019, isOngoing: false}, gpa: '3.6', showGpa: true, showLocation: false, showDateRange: true, show: true}],
    showEducation: true,
    skills: [
        {id: 's1', name: 'Go', level: 5, show: true},
        {id: 's2', name: 'COBOL', level: 1, show: false},
    ],
    showSkills: true,
    languages: [{name: 'Bangla', level: 5, levelText: 'Native', show: true}],
    showLanguages: true,
    projects: [{id: 'p1', title: 'qbench', description: 'Queue benchmarks.', link: 'https://github.com/rahim/qbench', technologies: ['Go', 'Kafka'], showLink: true, showDateRange: false, showDescription: true, show: true}],
    showProjects: true,
    activities: [],
    showActivities: false,
    customSections: [],
    strengths: [],
    showStrengths: false,
    interests: [{id: 'i1', title: 'Chess', description: '', show: true}],
    showInterests: false,
    certifications: [],
    showCertifications: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
}

afterEach(() => fakeDesktop())

describe('bringing a CV across from Vitaena 1', () => {
    it('makes a valid CV of it, naming where it came from', () => {
        const adopted = cvFromV1(V1)!

        expect(adopted.name).toBe('Rahim Uddin (from Vitaena 1)')
        expect(() => cvType.content.parse(adopted.content)).not.toThrow()
    })

    it('keeps what v1 hid hidden, without losing it', () => {
        const {content} = cvFromV1(V1)!
        const model = renderModel(content)
        const experience = content.sections.find((section) => section.title === 'Experience')

        expect(content.person.phone).toBe('+880 1800 000000')
        expect(model.contact.map((item) => item.text)).not.toContain('+880 1800 000000')
        expect(experience?.kind === 'entries' && experience.entries[0]).toMatchObject({summary: 'Ticketing platform.', hide: ['summary']})
        expect(experience?.kind === 'entries' && experience.entries[1].visible).toBe(false)
        expect(content.sections.find((section) => section.title === 'Interests')?.visible).toBe(false)
    })

    it('turns v1 dates, GPAs, skills and project links into their v2 forms', () => {
        const {content} = cvFromV1(V1)!
        const model = renderModel(content)
        const text = JSON.stringify(model)

        expect(text).toContain('Mar 2021 – Present')
        expect(text).toContain('Jan 2015 – Jan 2019')
        expect(text).toContain('GPA 3.6')
        expect(model.sections.find((section) => section.title === 'Skills')).toMatchObject({groups: [{items: 'Go'}]})
        expect(text).toContain('Bangla (Native)')
        expect(text).toContain('Technologies: Go, Kafka')
        expect(text).toContain('"url":"https://github.com/rahim/qbench"')
    })

    it('ignores files that aren\'t v1 resumes', () => {
        expect(cvFromV1({hello: 'world'})).toBeNull()
        expect(cvFromV1(null)).toBeNull()
    })

    it('opens through Open a file as a new, unsaved CV', async () => {
        fakeDesktop({
            OpenFileDialog: async () => 'C:/Downloads/rahim.json',
            ReadFile: async () => [...new TextEncoder().encode(JSON.stringify(V1))],
        })

        await useDocumentStore.getState().openFromFile()

        const state = useDocumentStore.getState()

        expect(state.name).toBe('Rahim Uddin (from Vitaena 1)')
        expect(state.currentId).toBeNull()
        expect(state.filePath).toBeNull()
        expect(state.content.person.name).toBe('Rahim Uddin')
        expect(state.toast?.message).toBe('Brought in rahim.json. Save it to keep it.')
    })
})
