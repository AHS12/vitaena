// @vitest-environment node

/**
 * What an applicant tracking system reads from each template's PDF.
 *
 * Lays the sample CV out with the real compiler and fonts, then pulls the text back out
 * of the PDF the way a parser does. If a template change puts the dates in a column of
 * their own, joins letters into a ligature or drops the email, this fails.
 */

import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {beforeAll, describe, expect, it} from 'vitest'
import {createTypstCompiler, initOptions, loadFonts, type TypstCompiler} from '@myriaddreamin/typst.ts'
import {getDocument, GlobalWorkerOptions} from 'pdfjs-dist/legacy/build/pdf.mjs'
import type {Cv} from '../cv'
import {CV_FONTS} from '../fonts'
import {CV_TEMPLATES} from './templates'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'

const require = createRequire(import.meta.url)
const bytes = (path: string) => new Uint8Array(readFileSync(require.resolve(path)))
const TEMPLATES = CV_TEMPLATES.map((template) => template.id)

GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = createTypstCompiler()
    await compiler.init({
        beforeBuild: [
            initOptions.disableDefaultFontAssets(),
            loadFonts(CV_FONTS.flatMap((font) => font.files.map(bytes))),
        ],
        getModule: () => bytes('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
    })
}, 60_000)

/** The sample with earlier jobs added, so it's sure to run onto more than one page. */
function longCv(): Cv {
    const cv = sampleCv()

    return {
        ...cv,
        sections: cv.sections.map((section) =>
            section.kind === 'entries' && section.id === 'experience'
                ? {...section, entries: [...section.entries, ...[0, 1].flatMap((round) => section.entries.map((entry, index) => ({...entry, id: `older-${round}-${index}`, org: `Earlier Company ${round * 4 + index + 1}`})))]}
                : section,
        ),
    }
}

async function pdfOf(template: string, cv: Cv = longCv()): Promise<Uint8Array> {
    compiler.addSource('/main.typ', readFileSync(fileURLToPath(new URL(`./${template}.typ`, import.meta.url)), 'utf8'))
    compiler.mapShadow('/cv.json', new TextEncoder().encode(JSON.stringify(renderModel(cv))))

    const result = await compiler.compile({mainFilePath: '/main.typ', format: 1, diagnostics: 'full'})

    expect(result.diagnostics?.filter((item) => item.severity === 'error') ?? []).toEqual([])
    return result.result!
}

/** Each page's text in reading order, one line per run of text, as a parser sees it. */
async function textOf(pdf: Uint8Array): Promise<{pages: number; text: string; info: Record<string, unknown>}> {
    const document = await getDocument({data: pdf.slice(), useSystemFonts: false}).promise
    const lines: string[] = []

    for (let number = 1; number <= document.numPages; number += 1) {
        const content = await (await document.getPage(number)).getTextContent()

        lines.push(content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : '')).join(''))
    }

    const {info} = await document.getMetadata()

    return {pages: document.numPages, text: lines.join('\n'), info: info as Record<string, unknown>}
}

const CASES = [...TEMPLATES.map((template) => ({template, atsMode: false})), {template: 'modern', atsMode: true}]

describe.each(CASES)('the $template template (ATS mode $atsMode), as an ATS reads it', ({template, atsMode}) => {
    let read: Awaited<ReturnType<typeof textOf>>

    beforeAll(async () => {
        const cv = longCv()

        read = await textOf(await pdfOf(template, {...cv, design: {...cv.design, atsMode}}))
    }, 60_000)

    it('runs onto a second page without losing anything', () => {
        expect(read.pages).toBeGreaterThanOrEqual(2)
        expect(read.text).toContain('Earlier Company 8')
        expect(read.text).toContain('Mentoring')
    })

    it('starts with the name, and keeps the contact details whole', () => {
        expect(read.text.trimStart().startsWith('Nadia Rahman')).toBe(true)
        expect(read.text).toContain('nadia.rahman@example.com')
        expect(read.text).toContain('+880 1700 000000')
        expect(read.text).toContain('linkedin.com/in/nadia-rahman-example')
    })

    it('keeps the sections in order, under headings parsers know', () => {
        const at = (heading: string) => read.text.indexOf(heading)
        // In two columns the side column is read where it sits, page by page, so only the
        // main column's order is promised. ATS mode gives one column and the full order.
        const twoColumns = template === 'modern' && !atsMode
        const order = twoColumns ? ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'PROJECTS'] : ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'PROJECTS', 'SKILLS']

        for (const heading of [...order, 'SKILLS']) {
            expect(at(heading), heading).toBeGreaterThan(-1)
        }

        for (let index = 1; index < order.length; index += 1) {
            expect(at(order[index - 1]), `${order[index - 1]} before ${order[index]}`).toBeLessThan(at(order[index]))
        }
    })

    it('keeps each skill group whole, beside its label', () => {
        expect(read.text.replace(/\s+/g, ' ')).toMatch(/Systems:? ?PostgreSQL, Kafka, Redis, Kubernetes, AWS/)
    })

    it('puts each job\'s dates with that job, not in a column of their own', () => {
        const job = read.text.indexOf('Pathao')
        const next = read.text.indexOf('Kaz Software')
        const dates = read.text.indexOf('Jan 2019 – Feb 2022')

        expect(dates).toBeGreaterThan(job)
        expect(dates).toBeLessThan(next)
    })

    it('keeps letters apart, so "fi" and "ff" match keywords', () => {
        expect(read.text).toContain('fraud-flagging')
        expect(read.text).toContain('offline')
        expect(read.text).not.toMatch(/[ﬀ-ﬆ]/)
    })

    it('names the document after the person', () => {
        expect(read.info.Title).toBe('Nadia Rahman – CV')
        expect(read.info.Author).toBe('Nadia Rahman')
    })
})

describe.each(CV_FONTS.map((font) => font.id))('the %s font, as an ATS reads it', (fontId) => {
    it('embeds itself and keeps every letter readable', async () => {
        const cv = sampleCv()
        const pdf = await pdfOf('classic', {...cv, design: {...cv.design, font: fontId}})
        const read = await textOf(pdf)
        const family = CV_FONTS.find((font) => font.id === fontId)!.family.replace(/ /g, '')

        expect(new TextDecoder('latin1').decode(pdf)).toContain(family)
        expect(read.text).toContain('nadia.rahman@example.com')
        expect(read.text).toContain('fraud-flagging')
        expect(read.text).toContain('Mar 2022 – Present')
        expect(read.text).not.toMatch(/[ﬀ-ﬆ]/)
    })
})
