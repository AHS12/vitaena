// @vitest-environment node

import JSZip from 'jszip'
import {describe, expect, it} from 'vitest'
import {checkCv} from './ats-check'
import {emptyCv, type Cv} from './cv'
import {cvDocx} from './docx-export'
import {renderModel} from './render-model'
import {sampleCv} from './sample'

const xmlText = (xml: string) =>
    xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')

describe('the Word export', () => {
    it('is a Word file with the CV in reading order, under real headings', async () => {
        const zip = await JSZip.loadAsync(await cvDocx(renderModel(sampleCv())))
        const xml = await zip.file('word/document.xml')!.async('string')
        const text = xmlText(xml)

        expect(text.trimStart().startsWith('Jane Doe')).toBe(true)
        expect(text).toContain('jane.doe@example.com')
        expect(text.indexOf('EXPERIENCE')).toBeLessThan(text.indexOf('EDUCATION'))
        expect(text).toContain('Dhaka, Bangladesh  |  Mar 2022 – Present')
        expect(xml).toContain('w:val="Heading1"')
        expect(xml).toContain('<w:numPr>')
    })

    it('uses the CV\'s font and paper', async () => {
        const cv = sampleCv()
        const zip = await JSZip.loadAsync(await cvDocx(renderModel({...cv, design: {...cv.design, font: 'lato', paper: 'us-letter'}})))

        expect(await zip.file('word/styles.xml')!.async('string')).toContain('Lato')
        expect(await zip.file('word/document.xml')!.async('string')).toContain('w:w="12240"')
    })
})

const levelOf = (cv: Cv, id: string) => checkCv(cv, 2).find((result) => result.id === id)?.level

describe('the check', () => {
    it('finds nothing to warn about in a complete CV', () => {
        expect(checkCv(sampleCv(), 2).filter((result) => result.level === 'warning')).toEqual([])
    })

    it('asks for a name and contact details on an empty CV', () => {
        const results = checkCv(emptyCv(), 1)

        expect(results.find((result) => result.id === 'name')?.level).toBe('warning')
        expect(results.find((result) => result.id === 'contact')?.title).toBe('Add an email address and a phone number')
    })

    it('warns while lines from an imported PDF wait in Not sorted', () => {
        const cv = sampleCv()
        const withUnsorted = (text: string): Cv => ({...cv, sections: [...cv.sections, {id: 'not-sorted', kind: 'text', title: 'Not sorted', visible: false, text}]})

        expect(checkCv(withUnsorted(['Available from May', 'Driving licence'].join('\n')), 2).find((result) => result.id === 'not-sorted')).toMatchObject({level: 'warning', title: "2 lines from your file aren't sorted yet"})
        expect(levelOf(withUnsorted(''), 'not-sorted')).toBeUndefined()
        expect(levelOf(cv, 'not-sorted')).toBeUndefined()
    })

    it('warns about two columns unless ATS mode is on', () => {
        const cv = sampleCv()

        expect(levelOf({...cv, design: {...cv.design, template: 'modern'}}, 'columns')).toBe('warning')
        expect(levelOf({...cv, design: {...cv.design, template: 'modern', atsMode: true}}, 'columns')).toBe('good')
    })

    it('names a heading parsers may not know, and leaves standard ones alone', () => {
        const cv = sampleCv()
        const renamed = {...cv, sections: cv.sections.map((section) => (section.title === 'Projects' ? {...section, title: 'Things I built'} : section))}

        expect(levelOf(cv, 'headings')).toBe('good')
        expect(checkCv(renamed, 2).find((result) => result.id === 'headings')?.title).toBe('"Things I built" isn\'t a heading every parser knows')
    })

    it('mentions length only past two pages, and not for an academic CV', () => {
        const cv = sampleCv()

        expect(checkCv(cv, 2).some((result) => result.id === 'length')).toBe(false)
        expect(checkCv(cv, 3).some((result) => result.id === 'length')).toBe(true)
        expect(checkCv({...cv, sections: [...cv.sections, {id: 'p', kind: 'text', title: 'Publications', visible: true, text: 'x'}]}, 3).some((result) => result.id === 'length')).toBe(false)
    })
})
