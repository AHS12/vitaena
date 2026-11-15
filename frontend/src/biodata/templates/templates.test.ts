// @vitest-environment node

/**
 * Each biodata template, laid out by the real compiler with the real fonts, and its PDF
 * read back: it must draw a full biodata, an empty one, and one with every picture, and
 * hold every value shown.
 */

import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {beforeAll, describe, expect, it} from 'vitest'
import {createTypstCompiler, initOptions, loadFonts, type TypstCompiler} from '@myriaddreamin/typst.ts'
import {getDocument, GlobalWorkerOptions} from 'pdfjs-dist/legacy/build/pdf.mjs'
import {CV_FONTS} from '../../cv/fonts'
import {withImageFiles} from '../../cv/typst/images'
import {emptyBiodata, type Biodata} from '../biodata'
import {biodataRenderModel} from '../render-model'
import {sampleBiodata} from '../sample'
import {BIODATA_TEMPLATES} from './templates'

const require = createRequire(import.meta.url)
const bytes = (path: string) => new Uint8Array(readFileSync(require.resolve(path)))
const ON = new Date(2026, 10, 15)
/** A one-pixel PNG, standing in for every picture. */
const PICTURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = createTypstCompiler()
    await compiler.init({
        beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts(CV_FONTS.flatMap((font) => font.files.map(bytes)))],
        getModule: () => bytes('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
    })
}, 60_000)

async function read(template: string, biodata: Biodata): Promise<{pages: number; text: string}> {
    compiler.addSource('/main.typ', readFileSync(fileURLToPath(new URL(`./${template}.typ`, import.meta.url)), 'utf8'))
    const {model, files} = withImageFiles(biodataRenderModel(biodata, ON))

    compiler.mapShadow('/biodata.json', new TextEncoder().encode(JSON.stringify(model)))

    for (const file of files) {
        compiler.mapShadow(file.path, file.bytes)
    }

    const result = await compiler.compile({mainFilePath: '/main.typ', format: 1, diagnostics: 'full'})

    expect(result.diagnostics?.filter((item) => item.severity === 'error') ?? []).toEqual([])

    const document = await getDocument({data: result.result!.slice(), useSystemFonts: false}).promise
    const lines: string[] = []

    for (let number = 1; number <= document.numPages; number += 1) {
        const content = await (await document.getPage(number)).getTextContent()

        lines.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
    }

    return {pages: document.numPages, text: lines.join(' ').replace(/\s+/g, ' ')}
}

describe.each(BIODATA_TEMPLATES.map((template) => template.id))('the %s biodata template', (template) => {
    it('fits the example on one page and shows every value in it', async () => {
        const {pages, text} = await read(template, sampleBiodata())

        expect(pages).toBe(1)

        for (const value of ['Jane Doe', '12 March 1996 (30 years)', '5′ 4″ (163 cm)', 'Never married', 'MSc in Economics', 'Riverside University', 'Research Analyst', 'John Doe', 'Retired civil engineer', 'Married', 'Calm, curious', 'Someone kind', '+1 555 0100']) {
            expect(text, value).toContain(value)
        }
    })

    it('draws an empty biodata without failing', async () => {
        expect((await read(template, emptyBiodata())).pages).toBe(1)
    })

    it('draws the heading line, its picture, the photo and the full-length photo', async () => {
        const biodata = sampleBiodata()
        const {text} = await read(template, {...biodata, heading: {text: 'A line of my own', image: PICTURE}, person: {...biodata.person, photo: PICTURE, fullPhoto: PICTURE}, design: {...biodata.design, border: true}})

        expect(text.trimStart().startsWith('A line of my own')).toBe(true)
    })
})
