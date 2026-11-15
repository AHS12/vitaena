/**
 * The Typst compiler and renderer themselves: a render model in, an SVG or a PDF out.
 *
 * Runs inside the layout worker (engine.worker.ts), so a long CV never holds up typing.
 * The compiler, the renderer and the fonts are bundled with the app and loaded on first
 * use, never fetched from the network: the default font download is turned off.
 */

import type {TypstCompiler, TypstRenderer} from '@myriaddreamin/typst.ts'
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'
import rendererWasm from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url'
import classic from '../templates/classic.typ?raw'
import compact from '../templates/compact.typ?raw'
import minimal from '../templates/minimal.typ?raw'
import modern from '../templates/modern.typ?raw'
import professional from '../templates/professional.typ?raw'
import {CV_FONTS} from '../fonts'
import {fontUrl} from './font-urls'
import {withPhotoFile} from './photo'
import type {RenderModel} from '../render-model'

const FONTS = CV_FONTS.flatMap((font) => font.files.map(fontUrl))

const TEMPLATES: Readonly<Record<string, string>> = {classic, modern, minimal, compact, professional}

const MAIN = '/main.typ'
const DATA = '/cv.json'

/** What went wrong, in the compiler's words. Plain data, so it crosses to the page. */
export interface LayoutProblem {
    readonly message: string
}

export class LayoutFailed extends Error {
    constructor(readonly problems: readonly LayoutProblem[]) {
        super(problems[0]?.message ?? 'The CV could not be laid out.')
        this.name = 'LayoutFailed'
    }
}

interface Engine {
    readonly compiler: TypstCompiler
    readonly renderer: TypstRenderer
}

let engine: Promise<Engine> | null = null

const bytesOf = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Could not load ${url}`)
    }

    return new Uint8Array(await response.arrayBuffer())
}

async function start(): Promise<Engine> {
    const typst = await import('@myriaddreamin/typst.ts')
    const fonts = await Promise.all(FONTS.map(bytesOf))
    const compiler = typst.createTypstCompiler()
    const renderer = typst.createTypstRenderer()

    await Promise.all([
        compiler.init({
            beforeBuild: [typst.initOptions.disableDefaultFontAssets(), typst.loadFonts(fonts)],
            getModule: () => bytesOf(compilerWasm),
        }),
        renderer.init({getModule: () => bytesOf(rendererWasm)}),
    ])

    return {compiler, renderer}
}

/** Starts the compiler and renderer, once. */
export function warmUp(): Promise<Engine> {
    engine ??= start().catch((error: unknown) => {
        engine = null
        throw error
    })

    return engine
}

async function compile(model: RenderModel, template: string, format: 0 | 1): Promise<Uint8Array> {
    const {compiler} = await warmUp()

    const {model: readable, file} = withPhotoFile(model)

    compiler.addSource(MAIN, TEMPLATES[template] ?? TEMPLATES.classic)
    compiler.mapShadow(DATA, new TextEncoder().encode(JSON.stringify(readable)))

    if (file) {
        compiler.mapShadow(file.path, file.bytes)
    }

    const result = await compiler.compile({mainFilePath: MAIN, format, diagnostics: 'full'})
    const errors = (result.diagnostics ?? []).filter((item) => item.severity === 'error')

    if (!result.result || errors.length > 0) {
        throw new LayoutFailed(errors.length > 0 ? errors.map((item) => ({message: item.message})) : [{message: 'The CV could not be laid out.'}])
    }

    return result.result
}

/** All pages as one SVG, stacked top to bottom. */
export async function layOutSvg(model: RenderModel, template: string): Promise<string> {
    const vector = await compile(model, template, 0)
    const {renderer} = await warmUp()

    return renderer.runWithSession(async (session) => {
        renderer.manipulateData({renderSession: session, action: 'reset', data: vector})
        return renderer.renderSvg({renderSession: session})
    })
}

/** The same layout as a PDF. */
export const layOutPdf = (model: RenderModel, template: string): Promise<Uint8Array> => compile(model, template, 1)
