/**
 * A made-up CV, long enough to run onto a second page. Tests lay it out, and it shows
 * someone new what a filled-in CV looks like.
 *
 * Everything in it is invented: the person, every employer, school, project and event,
 * the email (example.com is reserved for examples) and the phone number. Nothing in it
 * is anyone's real CV or anyone else's words.
 */

import {DEFAULT_DESIGN, type Cv, type CvEntry} from './cv'

const job = (id: string, title: string, org: string, start: string, end: string, bullets: string[], current = false): CvEntry => ({
    id,
    visible: true,
    title,
    org,
    location: 'Dhaka, Bangladesh',
    start,
    end,
    current,
    summary: '',
    bullets,
    hide: [],
})

export function sampleCv(): Cv {
    return {
        person: {
            name: 'Jane Doe',
            headline: 'Senior Software Engineer',
            email: 'jane.doe@example.com',
            phone: '+1 555 0100',
            location: 'Dhaka, Bangladesh',
            links: [{id: 'link-1', label: '', url: 'https://www.example.com/jane-doe'}],
            photo: '',
            hide: [],
        },
        sections: [
            {
                id: 'summary',
                kind: 'text',
                title: 'Summary',
                visible: true,
                text: 'Engineer with nine years of experience building payment and logistics platforms. Known for making slow systems fast and for growing the people around me.',
            },
            {
                id: 'experience',
                kind: 'entries',
                title: 'Experience',
                visible: true,
                entries: [
                    job('e1', 'Senior Software Engineer', 'Harbourline Payments', '2022-03', '', ['Led the rewrite of the settlement service in Go, cutting nightly run time from 4 hours to 25 minutes.', 'Designed the fraud-flagging pipeline that now reviews 2 million transactions a day.', 'Mentored six engineers, three of whom were promoted within a year.', 'Introduced contract testing across 14 services, halving integration incidents.'], true),
                    job('e2', 'Software Engineer', 'Swiftly Rides', '2019-01', '2022-02', ['Built the driver-matching service used for every ride and delivery in five cities.', 'Reduced p95 API latency from 900 ms to 180 ms by reworking caching and queries.', 'Shipped the first offline-capable rider app release, used by 30% of riders in its first month.', 'Ran the on-call rotation and wrote the incident review process the team still uses.']),
                    job('e3', 'Software Engineer', 'Brightleaf Software', '2016-07', '2018-12', ['Delivered client projects in C#, TypeScript and PostgreSQL for health and finance clients.', 'Automated release builds, taking deployments from a day of manual work to 20 minutes.', 'Wrote the internal guide to code review used by every new hire.']),
                    job('e4', 'Junior Developer', 'Meridian Systems', '2015-01', '2016-06', ['Maintained a hospital records system used across 40 clinics.', 'Fixed 200+ reported defects and added the first automated test suite to the project.']),
                ],
            },
            {
                id: 'education',
                kind: 'entries',
                title: 'Education',
                visible: true,
                entries: [
                    {
                        id: 'ed1',
                        visible: true,
                        title: 'BSc in Computer Science and Engineering',
                        org: 'Riverside Institute of Technology',
                        location: 'Dhaka, Bangladesh',
                        start: '2010-01',
                        end: '2014-12',
                        current: false,
                        summary: 'Thesis on fast route planning for city delivery fleets.',
                        bullets: [],
                        hide: [],
                    },
                ],
            },
            {
                id: 'projects',
                kind: 'entries',
                title: 'Projects',
                visible: true,
                entries: [
                    job('p1', 'Open-source maintainer', 'calendar-kit', '2020-05', '', ['A Go library for working with calendar dates, used by 300+ projects.', 'Wrote the full test suite and documentation site.'], true),
                    job('p2', 'Speaker', 'City Go Meetup', '2023-09', '2023-09', ['Talk: "Finding the slow part" – profiling Go services in production.']),
                ],
            },
            {
                id: 'skills',
                kind: 'tags',
                title: 'Skills',
                visible: true,
                groups: [
                    {id: 'g1', visible: true, label: 'Languages', items: ['Go', 'TypeScript', 'C#', 'SQL']},
                    {id: 'g2', visible: true, label: 'Systems', items: ['PostgreSQL', 'Kafka', 'Redis', 'Kubernetes', 'AWS']},
                    {id: 'g3', visible: true, label: 'Practices', items: ['System design', 'Performance tuning', 'Code review', 'Mentoring']},
                ],
            },
        ],
        design: {...DEFAULT_DESIGN},
    }
}
