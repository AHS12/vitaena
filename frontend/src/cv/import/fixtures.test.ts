// @vitest-environment node

/**
 * CVs this app didn't make, in layouts other apps use and made the way they make PDFs:
 * a Word document exported by LibreOffice, and pages printed by Chrome as Google Docs and
 * online makers print them. `make import-fixtures` builds them from the sources beside them.
 */

import {readFileSync} from 'node:fs'
import {beforeAll, describe, expect, it} from 'vitest'
import '../../tests/typst'
import type {Cv, CvSection} from '../cv'
import {cvFromLayout, type ImportedCv} from './parse'
import {readPdfLayout} from './read-pdf'

async function imported(name: string): Promise<ImportedCv> {
    return cvFromLayout(await readPdfLayout(new Uint8Array(readFileSync(new URL(`./fixtures/${name}.pdf`, import.meta.url)))))
}

/** A section as [title, kind] and what it holds, without the ids an import makes up. */
function summary(section: CvSection) {
    switch (section.kind) {
        case 'text':
            return [section.title, section.text]
        case 'entries':
            return [section.title, section.entries.map(({title, org, location, start, end, current, summary: about, bullets}) => ({title, org, location, start, end, current, summary: about, bullets}))]
        case 'tags':
            return [section.title, section.groups.map((group) => [group.label, group.items])]
        case 'details':
            return [section.title, section.rows.map((row) => [row.label, row.kind === 'text' ? row.value : ''])]
    }
}

const job = (title: string, org: string, location: string, start: string, end: string, bullets: string[] = [], summary = '') => ({title, org, location, start, end, current: end === '', summary, bullets})

describe.each([
    {
        name: 'office-word',
        person: {name: 'John Doe', headline: '', email: 'john.doe@example.com', phone: '020 7946 0123', location: 'Leeds, United Kingdom'},
        links: ['https://linkedin.com/in/john-doe'],
        sections: [
            ['Profile', 'Operations manager with ten years in warehousing and freight. I run sites that ship on time, keep people safe and cost less each year.'],
            [
                'Work experience',
                [
                    job('Operations Manager', 'Northwind Logistics', 'Leeds', '2018-06', '', ['Run a 40,000 square metre site with 120 staff across three shifts.', 'Cut late shipments from 6% to under 1% in the first year.', 'Brought in a new warehouse system on time and under budget.']),
                    job('Shift Supervisor', 'Coastal Freight Ltd', 'Hull', '2015-02', '2018-05', ['Led a night shift of 25 pickers and drivers.', 'Trained twelve new supervisors in safe lifting and forklift use.']),
                    job('Warehouse Operative', 'Coastal Freight Ltd', 'Hull', '2013-09', '2015-01', ['Picked, packed and loaded orders for retail customers.']),
                ],
            ],
            ['Education', [job('BA (Hons) Business Management', 'University of Riverside', '', '2010-01', '2013-12')]],
            ['Skills', [['', ['Team leadership', 'Budget planning', 'Lean methods', 'Health and safety', 'Forklift licence']]]],
            ['Certifications', [job('Certified Logistics Professional', '', '', '2019-01', '2019-01'), job('First Aid at Work', '', '', '2021-01', '2021-01')]],
        ],
    },
    {
        name: 'docs-style',
        person: {name: 'Jane Doe', headline: 'Data Analyst', email: 'jane.doe@example.com', phone: '(555) 010-0199', location: 'Bristol, United Kingdom'},
        links: ['https://github.com/jane-doe'],
        sections: [
            [
                'Experience',
                [
                    job('Data Analyst', 'Riverbank Energy', 'Bristol', '2020-03', '', ['Built the weekly demand forecast the trading desk plans around.', 'Moved forty reports from spreadsheets to a shared dashboard.']),
                    job('Junior Analyst', 'Harbour Retail', 'Cardiff', '2017-07', '2020-02', ['Cleaned and joined sales data from 60 shops each morning.', 'Answered ad-hoc questions from store managers.']),
                ],
            ],
            ['Education', [job('BSc Mathematics', 'University of Riverside', 'Bristol', '2014-09', '2017-06')]],
            ['Skills', [['', ['SQL', 'Python', 'Power BI', 'Statistics', 'Forecasting']]]],
            ['Languages', [['', ['English (Native)', 'French (Intermediate)']]]],
        ],
    },
    {
        name: 'online-sidebar',
        // The font drew the phone number's "+" without saying what it is, so it can't come back.
        person: {name: 'Alex Doe', headline: 'Graphic Designer', email: 'alex.doe@example.com', phone: '1 555 0142', location: 'Portland, Oregon'},
        links: [],
        sections: [
            ['About me', 'Designer who turns rough ideas into brands people remember, for shops, studios and charities.'],
            [
                'Experience',
                [
                    job('Senior Designer', 'Lantern Studio', '', '2019-01', '2024-12', ['Led brand work for 30 clients, from logo to shop front.', 'Mentored two junior designers.']),
                    job('Designer', 'Oakleaf Print', '', '2016-01', '2019-12', ['Designed packaging for a range of local food brands.']),
                ],
            ],
            ['Education', [job('BA Graphic Design', 'Riverside College of Art', '', '2012-01', '2016-12')]],
            ['Skills', [['', ['Brand identity', 'Typography', 'Figma', 'Illustration']]]],
            ['Languages', [['', ['Spanish (Fluent)', 'German (Basic)']]]],
        ],
    },
    {
        name: 'labelled',
        person: {name: 'Mary Doe', headline: '', email: 'mary.doe@example.com', phone: '01632 960 123', location: '12 Elm Street, Springfield'},
        links: [],
        sections: [
            ['Personal Details', [['Date of birth', '1 April 1990'], ['Nationality', 'Irish'], ['Driving licence', 'Full, clean']]],
            ['Personal Statement', 'Caring and organised nurse with eight years on busy surgical wards, looking for a senior post in community care.'],
            ['Key Skills', [['', ['Wound care', 'Patient assessment', 'Medication rounds', 'Team leadership']]]],
            [
                'Employment History',
                [
                    job("Senior Staff Nurse", "St Mary's Hospital", 'Dublin', '2017-09', '', [], 'Lead a team of six nurses on a 28-bed surgical ward. Plan care with doctors and families, and train new starters in wound care.'),
                    job('Staff Nurse', 'Riverside General Hospital', 'Cork', '2013-08', '2017-08', [], 'Cared for patients before and after surgery on a busy general ward.'),
                ],
            ],
            ['Education and Training', [job('BSc Nursing', 'University of Riverside', '', '2009-01', '2013-12')]],
            ['References', 'Available on request.'],
        ],
    },
])('a CV from another app: $name', ({name, person, links, sections}) => {
    let result: ImportedCv
    let cv: Cv

    beforeAll(async () => {
        result = await imported(name)
        cv = result.cv
    }, 60_000)

    it('comes in with the person and their contact details', () => {
        expect(cv.person).toMatchObject(person)
        expect(cv.person.links.map((link) => link.url)).toEqual(links)
    })

    it('comes in with each section as it reads', () => {
        expect(cv.sections.map(summary)).toEqual(sections)
    })

    it('leaves nothing unsorted', () => {
        expect(result.unsorted).toBe(0)
    })
})
