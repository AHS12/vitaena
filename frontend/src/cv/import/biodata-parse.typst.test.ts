// @vitest-environment node

/**
 * The sample biodata, made into a PDF by each biodata template and imported again, comes
 * back as it was, with its own heading line; and the rules for what biodata write.
 */

import {beforeAll, describe, expect, it} from 'vitest'
import type {TypstCompiler} from '@myriaddreamin/typst.ts'
import type {Biodata, BiodataSection} from '../../biodata/biodata'
import {biodataRenderModel} from '../../biodata/render-model'
import {sampleBiodata} from '../../biodata/sample'
import {BIODATA_TEMPLATES} from '../../biodata/templates/templates'
import {templatePdf, typstCompiler} from '../../tests/typst'
import {biodataFromLayout, dayOf, heightOf, isBiodata} from './biodata-parse'
import {pageLines, type TextPiece} from './layout'
import {cvFromLayout, documentParts} from './parse'
import {readPdfLayout} from './read-pdf'

const SAMPLE: Biodata = {...sampleBiodata(), heading: {text: 'With every blessing', image: ''}}

/** An item without the id and switch an import makes up. */
function withoutMadeUp<T extends {id: string; visible: boolean}>(item: T): Omit<T, 'id' | 'visible'> {
    const copy: Partial<T> = {...item}

    delete copy.id
    delete copy.visible
    return copy as Omit<T, 'id' | 'visible'>
}

/** What a section holds, without the ids an import makes up. */
function contentOf(section: BiodataSection) {
    switch (section.kind) {
        case 'details':
            return {title: section.title, rows: section.rows.map(withoutMadeUp)}
        case 'family':
            return {title: section.title, members: section.members.map(withoutMadeUp)}
        case 'entries':
            return {title: section.title, entries: section.entries.map(({title, org, location, start, end, current}) => ({title, org, location, start, end, current}))}
        case 'text':
            return {title: section.title, text: section.text}
        case 'tags':
            return {title: section.title, groups: section.groups.map((group) => group.items)}
    }
}

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = await typstCompiler()
}, 60_000)

describe.each(BIODATA_TEMPLATES.map((template) => template.id))('the sample biodata through the %s template', (template) => {
    let biodata: Biodata
    let unsorted: number
    let looksLike: boolean

    beforeAll(async () => {
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel(SAMPLE, new Date(2026, 10, 15)))
        const layout = await readPdfLayout(pdf)

        looksLike = isBiodata(layout, documentParts(layout))
        ;({biodata, unsorted} = biodataFromLayout(layout))
    }, 60_000)

    it('is seen to be a biodata, by its family', () => {
        expect(looksLike).toBe(true)
    })

    it('comes back with the name and the line above it', () => {
        expect(biodata.person.name).toBe('Jane Doe')
        expect(biodata.heading.text).toBe('With every blessing')
    })

    it.each(SAMPLE.sections.map((section) => [section.title, section] as const))('comes back with %s as it was', (title, section) => {
        const found = biodata.sections.find((candidate) => candidate.title.toLowerCase() === title.toLowerCase())

        expect(found && {...contentOf(found), title}).toEqual(contentOf(section))
    })

    it('leaves nothing unsorted', () => {
        expect(unsorted).toBe(0)
    })
})

describe('reading what a biodata writes', () => {
    it.each([
        ['12 March 1996 (30 years)', '1996-03-12'],
        ['12th March, 1996', '1996-03-12'],
        ['12/03/1996', '1996-03-12'],
        ['1996-03-12', '1996-03-12'],
        ['March 12, 1996', '1996-03-12'],
        ['31/02/1996', ''],
        ['30 years', ''],
    ])('reads the day "%s"', (text, day) => {
        expect(dayOf(text)).toBe(day)
    })

    it.each([
        ['5′ 4″ (163 cm)', {cm: 163, show: 'both'}],
        [`5'4"`, {cm: 163, show: 'ft-in'}],
        ['5 ft 4 in', {cm: 163, show: 'ft-in'}],
        ['5 feet', {cm: 152, show: 'ft-in'}],
        ['163 cm', {cm: 163, show: 'cm'}],
        ['Tall', null],
    ])('reads the height "%s"', (text, height) => {
        expect(heightOf(text)).toEqual(height)
    })

    const lines = (rows: [string, {size?: number; bold?: boolean}?][]) => {
        const pieces: TextPiece[] = rows.map(([text, {size = 10, bold = false} = {}], index) => ({text, x: 50, y: 80 + index * 16, width: text.length * size * 0.5, size, bold}))

        return {pages: 1, lines: pageLines({width: 600, height: 840, pieces}, 1)}
    }

    it('reads a family written as rows, and takes the BIODATA title for neither the name nor the heading', () => {
        const layout = lines([
            ['BIODATA', {size: 26, bold: true}],
            ['John Doe', {size: 20, bold: true}],
            ['FAMILY', {size: 13, bold: true}],
            ['Father: James Doe, retired teacher'],
            ['Brother: Sam Doe, doctor, married'],
        ])
        const {biodata} = biodataFromLayout(layout)

        expect(isBiodata(layout, documentParts(layout))).toBe(true)
        expect(biodata.person.name).toBe('John Doe')
        expect(biodata.heading.text).toBe('')
        expect(biodata.sections[0].kind === 'family' && biodata.sections[0].members.map(({relation, name, work, note}) => [relation, name, work, note])).toEqual([
            ['Father', 'James Doe', 'retired teacher', ''],
            ['Brother', 'Sam Doe', 'doctor', 'married'],
        ])
    })

    it('leaves a CV a CV', async () => {
        const layout = lines([['Jane Doe', {size: 20, bold: true}], ['EXPERIENCE', {size: 13, bold: true}], ['Designer, Northwind'], ['2019 – 2022']])

        expect(isBiodata(layout, documentParts(layout))).toBe(false)
        expect(cvFromLayout(layout).cv.sections[0].title).toBe('Experience')
    })
})
