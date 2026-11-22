// @vitest-environment node

/**
 * A font the person added, given to a running compiler the way the layout engine does:
 * a new set of fonts swapped in, with no restart. Tiro Bangla stands in for their font;
 * the compiler starts without it, as the app's does.
 */

import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {beforeAll, describe, expect, it} from 'vitest'
import {createTypstCompiler, createTypstFontBuilder, initOptions, loadFonts, type TypstCompiler} from '@myriaddreamin/typst.ts'
import {addParts} from '../../tests/typst'
import {CV_FONTS, SCRIPT_FONTS} from '../fonts'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {withImageFiles} from './images'

const require = createRequire(import.meta.url)
const bytes = (path: string) => new Uint8Array(readFileSync(require.resolve(path)))
const wasm = () => bytes('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm')

const START = [...CV_FONTS, ...SCRIPT_FONTS.filter((font) => font.fallback)].flatMap((font) => font.files.map(bytes))
const ADDED = SCRIPT_FONTS.find((font) => font.id === 'tiro-bangla')!.files.map(bytes)

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = createTypstCompiler()
    await compiler.init({beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts(START)], getModule: wasm})
}, 60_000)

const embedded = (pdf: Uint8Array): string[] => [...new TextDecoder('latin1').decode(pdf).matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([\w-]+)/g)].map((match) => match[1])

async function pdfOf(model: object): Promise<Uint8Array> {
    addParts(compiler)
    compiler.addSource('/main.typ', readFileSync(fileURLToPath(new URL('../templates/classic.typ', import.meta.url)), 'utf8'))

    const {model: readable} = withImageFiles(model)

    compiler.mapShadow('/cv.json', new TextEncoder().encode(JSON.stringify(readable)))

    const result = await compiler.compile({mainFilePath: '/main.typ', format: 1, diagnostics: 'full'})

    return result.result!
}

describe('a Bangla font the person added', () => {
    const cv = sampleCv('bn')
    const named = renderModel({...cv, design: {...cv.design, scriptFont: 'custom:Tiro Bangla'}})

    it('is passed over for the bundled one while the layout has not been given it', async () => {
        const fonts = embedded(await pdfOf(named))

        expect(fonts.some((font) => font.startsWith('TiroBangla'))).toBe(false)
        expect(fonts.some((font) => font.startsWith('NotoSansBengali'))).toBe(true)
    }, 60_000)

    it('sets the Bangla once it is given to the running compiler', async () => {
        const builder = createTypstFontBuilder()

        await builder.init({getModule: wasm})

        for (const font of [...START, ...ADDED]) {
            await builder.addFontData(font)
        }

        await builder.build(async (resolver) => compiler.setFonts(resolver))

        expect(embedded(await pdfOf(named)).some((font) => font.startsWith('TiroBangla'))).toBe(true)
    }, 60_000)
})
