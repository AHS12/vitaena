// @vitest-environment node

/**
 * Each template's PDF of the sample CV, read back into lines. These are the PDFs an
 * import will see most of, and their content is known, so whatever the reader gets wrong
 * shows here first.
 */

import {beforeAll, describe, expect, it} from 'vitest'
import type {TypstCompiler} from '@myriaddreamin/typst.ts'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {CV_TEMPLATES} from '../templates/templates'
import {templatePdf, typstCompiler} from '../../tests/typst'
import {readPdfLayout, type PdfLayout} from './read-pdf'

const SAMPLE = sampleCv()
const BULLETS = SAMPLE.sections.flatMap((section) => (section.kind === 'entries' ? section.entries.flatMap((entry) => entry.bullets) : []))
const HEADINGS = SAMPLE.sections.map((section) => section.title)
const CASES = [
    ...CV_TEMPLATES.map((template) => ({template: template.id, atsMode: false, columns: template.twoColumns})),
    ...CV_TEMPLATES.filter((template) => template.twoColumns).map((template) => ({template: template.id, atsMode: true, columns: false})),
]
const squash = (text: string) => text.replace(/\s+/g, ' ')

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = await typstCompiler()
}, 60_000)

describe.each(CASES)('the $template template (ATS mode $atsMode), read into lines', ({template, atsMode, columns}) => {
    let layout: PdfLayout
    let text: string

    beforeAll(async () => {
        const pdf = await templatePdf(compiler, new URL(`../templates/${template}.typ`, import.meta.url), '/cv.json', renderModel({...SAMPLE, design: {...SAMPLE.design, atsMode}}))

        layout = await readPdfLayout(pdf)
        text = squash(layout.lines.map((line) => line.text).join(' '))
    }, 60_000)

    it('finds the name as the largest text on the first page', () => {
        const largest = layout.lines.filter((line) => line.page === 1).reduce((a, b) => (b.size > a.size ? b : a))

        expect(largest.text).toBe('Jane Doe')
    })

    it('puts each heading on a line of its own', () => {
        for (const heading of HEADINGS) {
            expect(layout.lines.some((line) => line.text.toLowerCase() === heading.toLowerCase()), heading).toBe(true)
        }
    })

    it('reads every bullet whole, even where it wraps onto more lines', () => {
        for (const bullet of BULLETS) {
            expect(text, bullet).toContain(squash(bullet))
        }
    })

    it(columns ? 'finds two columns' : 'reads it as one column', () => {
        expect(layout.lines.some((line) => line.column !== 'full')).toBe(columns)
    })

    it('tells bold text from regular', () => {
        expect(layout.lines.some((line) => line.bold)).toBe(true)
        expect(layout.lines.filter((line) => BULLETS.some((bullet) => bullet.startsWith(line.text.replace(/^[•▪◦‣-]\s*/, '')))).every((line) => !line.bold)).toBe(true)
    })
})

describe('reading a PDF', () => {
    it('says how far it has got, page by page', async () => {
        const pdf = await templatePdf(compiler, new URL('../templates/classic.typ', import.meta.url), '/cv.json', renderModel(SAMPLE))
        const progress: [number, number][] = []

        const layout = await readPdfLayout(pdf, {onPage: (read, pages) => progress.push([read, pages])})

        expect(progress).toEqual(Array.from({length: layout.pages}, (_, index) => [index + 1, layout.pages]))
    })

    it('stops when it is cancelled', async () => {
        const pdf = await templatePdf(compiler, new URL('../templates/classic.typ', import.meta.url), '/cv.json', renderModel(SAMPLE))
        const cancel = new AbortController()

        cancel.abort()
        await expect(readPdfLayout(pdf, {signal: cancel.signal})).rejects.toThrow()
    })

    it('finds no lines in a PDF with no text, as a scan has none', async () => {
        // Only a shape, as a scanned page holds only a picture.
        compiler.addSource('/main.typ', '#rect(width: 4cm, height: 2cm, fill: gray)')

        const result = await compiler.compile({mainFilePath: '/main.typ', format: 1})

        expect(await readPdfLayout(result.result!)).toEqual({pages: 1, lines: []})
    })
})
