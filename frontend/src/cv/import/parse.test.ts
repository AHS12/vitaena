// @vitest-environment node

/**
 * The round trip: the sample CV, made into a PDF by each template and imported again,
 * comes back as the sample. Every template lays a CV out differently, so together they
 * stand for the layouts other makers use.
 */

import {beforeAll, describe, expect, it} from 'vitest'
import type {TypstCompiler} from '@myriaddreamin/typst.ts'
import type {Cv, CvSection} from '../cv'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {CV_TEMPLATES} from '../templates/templates'
import {templatePdf, typstCompiler} from '../../tests/typst'
import {cvFromLayout, type ImportedCv} from './parse'
import {readPdfLayout} from './read-pdf'

const SAMPLE = sampleCv()
const CASES = [
    ...CV_TEMPLATES.map((template) => ({template: template.id, atsMode: false})),
    ...CV_TEMPLATES.filter((template) => template.twoColumns).map((template) => ({template: template.id, atsMode: true})),
]

/** What a section holds, without the ids and switches an import makes up. */
function contentOf(section: CvSection) {
    switch (section.kind) {
        case 'text':
            return {title: section.title, text: section.text}
        case 'entries':
            return {
                title: section.title,
                entries: section.entries.map(({title, org, location, start, end, current, summary, bullets}) => ({title, org, location, start, end, current, summary, bullets})),
            }
        case 'tags':
            return {title: section.title, groups: section.groups.map(({label, items}) => ({label, items}))}
        default:
            return {title: section.title}
    }
}

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = await typstCompiler()
}, 60_000)

describe.each(CASES)('the sample CV through the $template template (ATS mode $atsMode)', ({template, atsMode}) => {
    let imported: ImportedCv
    let cv: Cv

    beforeAll(async () => {
        const pdf = await templatePdf(compiler, new URL(`../templates/${template}.typ`, import.meta.url), '/cv.json', renderModel({...SAMPLE, design: {...SAMPLE.design, atsMode}}))

        imported = cvFromLayout(await readPdfLayout(pdf))
        cv = imported.cv
    }, 60_000)

    it('comes back with the person and their contact details', () => {
        const {name, headline, email, phone, location} = SAMPLE.person

        expect(cv.person).toMatchObject({name, headline, email, phone, location})
        expect(cv.person.links.map((link) => link.url)).toEqual(['https://example.com/jane-doe'])
    })

    it('comes back with every section, in order, under its heading', () => {
        expect(cv.sections.map((section) => [section.title, section.kind])).toEqual(SAMPLE.sections.map((section) => [section.title, section.kind]))
    })

    it.each(SAMPLE.sections.map((section) => [section.title, section] as const))('comes back with %s as it was', (title, section) => {
        expect(contentOf(cv.sections.find((found) => found.title === title)!)).toEqual(contentOf(section))
    })

    it('leaves nothing unsorted', () => {
        expect(imported.unsorted).toBe(0)
    })
})
