/**
 * CVs from Word files: one laid out as office-word.pdf's source, and one laid out as Word
 * templates often are, with the name in the page header and a table as the columns.
 * `make import-fixtures` writes both.
 */

import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {beforeEach, describe, expect, it} from 'vitest'
import {useDocumentStore} from '../../store/document-store'
import type {Cv} from '../cv'
import {importCv, useCvImport} from './import-cv'
import {cvFromLayout} from './parse'
import {readDocxLayout} from './read-docx'

// From the project folder: in jsdom, import.meta.url isn't a file address.
const fixture = (name: string) => new Uint8Array(readFileSync(join(process.cwd(), 'src/cv/import/fixtures', name)))

const entries = (cv: Cv, title: string) => {
    const section = cv.sections.find((found) => found.title === title)

    return section?.kind === 'entries' ? section.entries.map(({title: role, org, location, start, end, bullets}) => ({role, org, location, start, end, bullets})) : null
}
const items = (cv: Cv, title: string) => {
    const section = cv.sections.find((found) => found.title === title)

    return section?.kind === 'tags' ? section.groups.flatMap((group) => group.items) : null
}

describe('a CV from a Word file', () => {
    it('comes in as the same CV as its PDF', async () => {
        const {cv, unsorted} = cvFromLayout(await readDocxLayout(fixture('office-word.docx')))

        expect(cv.person).toMatchObject({name: 'John Doe', email: 'john.doe@example.com', phone: '020 7946 0123', location: 'Leeds, United Kingdom'})
        expect(cv.sections.map((section) => [section.title, section.kind])).toEqual([
            ['Profile', 'text'],
            ['Work experience', 'entries'],
            ['Education', 'entries'],
            ['Skills', 'tags'],
            ['Certifications', 'entries'],
        ])
        expect(entries(cv, 'Work experience')?.[1]).toEqual({
            role: 'Shift Supervisor',
            org: 'Coastal Freight Ltd',
            location: 'Hull',
            start: '2015-02',
            end: '2018-05',
            bullets: ['Led a night shift of 25 pickers and drivers.', 'Trained twelve new supervisors in safe lifting and forklift use.'],
        })
        expect(unsorted).toBe(0)
    })

    it('reads the page header, a table as columns, titles and dates in table rows, and where links go', async () => {
        const {cv, unsorted} = cvFromLayout(await readDocxLayout(fixture('word-table.docx')))

        expect(cv.person).toMatchObject({name: 'Sam Doe', headline: 'Retail Manager', email: 'sam.doe@example.com', phone: '07700 900123', location: 'York, United Kingdom'})
        expect(cv.person.links.map((link) => link.url)).toEqual(['https://www.linkedin.com/in/sam-doe'])
        // The wider cell is the main column, read first.
        expect(cv.sections.map((section) => section.title)).toEqual(['Experience', 'Education', 'Skills', 'Languages'])
        expect(entries(cv, 'Experience')).toEqual([
            {role: 'Store Manager', org: 'Greenway Grocers', location: 'York', start: '2021-05', end: '', bullets: ['Run a store of 18 staff open seven days a week.', 'Grew weekly sales by 12% in the first year.']},
            {role: 'Assistant Manager', org: 'Greenway Grocers', location: 'Leeds', start: '2016-06', end: '2021-04', bullets: ['Planned rotas and trained new starters.']},
        ])
        expect(entries(cv, 'Education')).toEqual([{role: 'BTEC Retail Management', org: 'York College', location: '', start: '2014-01', end: '2016-12', bullets: []}])
        expect(items(cv, 'Skills')).toEqual(['Customer service', 'Stock control', 'Cash handling'])
        expect(items(cv, 'Languages')).toEqual(['Polish (Native)', 'English (Fluent)'])
        expect(unsorted).toBe(0)
    })

    it('says a file that is not a Word file is damaged', async () => {
        await expect(readDocxLayout(new TextEncoder().encode('not a word file'))).rejects.toThrow()
    })
})

describe('importing a Word file', () => {
    beforeEach(() => {
        useCvImport.setState({file: null})
        useDocumentStore.getState().startNew()
    })

    it('opens the CV made from it', async () => {
        await importCv(fixture('word-table.docx'), 'sam-doe.docx')

        expect(useDocumentStore.getState()).toMatchObject({kind: 'cv', name: 'Sam Doe'})
        expect(useDocumentStore.getState().toast?.message).toMatch(/Check it against your Word file/)
    })

    it('asks for a newer Word file in place of one from before 2007', async () => {
        await importCv(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]), 'old-cv.doc')

        expect(useCvImport.getState()).toMatchObject({file: 'old-cv.doc', step: {kind: 'old-word'}})
    })
})
