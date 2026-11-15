/**
 * The import's rules on layouts the app's own templates don't make, built from pieces
 * of text as a PDF would give them.
 */

import {describe, expect, it} from 'vitest'
import {pageLines, type TextPiece} from './layout'
import {cvFromLayout, NOT_SORTED} from './parse'

type Line = [text: string, options?: {size?: number; bold?: boolean; x?: number; page?: number}]

/** A layout of one column, a line every 14 points from the top. */
function layoutOf(lines: Line[]) {
    const pages = new Map<number, TextPiece[]>()

    lines.forEach(([text, {size = 10, bold = false, x = 50, page = 1} = {}], index) => {
        const pieces = pages.get(page) ?? []

        pieces.push({text, x, y: 80 + index * 14, width: text.length * size * 0.5, size, bold})
        pages.set(page, pieces)
    })

    return {pages: pages.size, lines: [...pages].flatMap(([page, pieces]) => pageLines({width: 600, height: 840, pieces}, page))}
}

const heading = (text: string): Line => [text, {size: 13, bold: true}]

describe('importing a CV', () => {
    it('writes a name and headline in capitals as words', () => {
        const {cv} = cvFromLayout(layoutOf([['JANE DOE', {size: 22, bold: true}], ['PRODUCT DESIGNER', {size: 12}], heading('SUMMARY'), ['Designs things.']]))

        expect(cv.person).toMatchObject({name: 'Jane Doe', headline: 'Product Designer'})
        expect(cv.sections[0].title).toBe('Summary')
    })

    it('reads labelled contact details, here under a Contact heading', () => {
        const {cv, unsorted} = cvFromLayout(
            layoutOf([['Jane Doe', {size: 22, bold: true}], heading('CONTACT'), ['Email: jane.doe@example.com'], ['Phone: +1 555 0100'], ['linkedin.com/in/jane-doe'], ['Leeds, United Kingdom'], heading('SUMMARY'), ['Designs things.']]),
        )

        expect(cv.person).toMatchObject({email: 'jane.doe@example.com', phone: '+1 555 0100', location: 'Leeds, United Kingdom'})
        expect(cv.person.links.map((link) => link.url)).toEqual(['https://linkedin.com/in/jane-doe'])
        expect(cv.sections.map((section) => section.title)).toEqual(['Summary'])
        expect(unsorted).toBe(0)
    })

    it('keeps a heading it doesn\'t know, as a list of jobs when it has dates', () => {
        const {cv} = cvFromLayout(
            layoutOf([
                ['Jane Doe', {size: 22, bold: true}],
                heading('EXPERIENCE'),
                ['Designer, Northwind', {bold: true}],
                ['2019 – 2022'],
                ['• Drew things.'],
                heading('FIELDWORK'),
                ['Survey lead, Coastal Trust', {bold: true}],
                ['2016 – 2018'],
                ['• Counted birds.'],
            ]),
        )
        const fieldwork = cv.sections[1]

        expect(fieldwork).toMatchObject({title: 'Fieldwork', kind: 'entries'})
        expect(fieldwork.kind === 'entries' && fieldwork.entries[0]).toMatchObject({title: 'Survey lead', org: 'Coastal Trust', start: '2016-01', end: '2018-12', bullets: ['Counted birds.']})
    })

    it('leaves out page numbers', () => {
        const {cv, unsorted} = cvFromLayout(layoutOf([['Jane Doe', {size: 22, bold: true}], heading('SUMMARY'), ['Designs things.'], ['Page 1 of 2', {size: 8}]]))

        expect(cv.sections[0]).toMatchObject({kind: 'text', text: 'Designs things.'})
        expect(unsorted).toBe(0)
    })

    it('puts what it can\'t place in a hidden Not sorted section', () => {
        const {cv, unsorted} = cvFromLayout(layoutOf([['Jane Doe', {size: 22, bold: true}], ['Designer'], ['Available from May!'], heading('SUMMARY'), ['Designs things.']]))
        const notSorted = cv.sections.find((section) => section.title === NOT_SORTED)

        expect(unsorted).toBe(1)
        expect(notSorted).toMatchObject({kind: 'text', visible: false, text: 'Available from May!'})
    })

    it('makes an empty CV from a PDF with no text', () => {
        const {cv, unsorted} = cvFromLayout({pages: 1, lines: []})

        expect(cv.person.name).toBe('')
        expect(cv.sections).toEqual([])
        expect(unsorted).toBe(0)
    })
})
