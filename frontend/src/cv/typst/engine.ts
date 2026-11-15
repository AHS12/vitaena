/**
 * The Typst engine: turns a CV into pages to look at and a PDF to send.
 *
 * Both come from the same compile, so what the preview shows is what the PDF holds.
 * The compiler, the renderer and the fonts are all bundled with the app and loaded on
 * first use, never fetched from the network: the default font download is turned off.
 *
 * Compiles run one at a time, since the compiler keeps one world. A preview asked for
 * while another is compiling replaces any still waiting, so typing never queues work.
 */

import type {TypstCompiler, TypstRenderer} from '@myriaddreamin/typst.ts'
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'
import rendererWasm from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url'
import interRegular from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf?url'
import interItalic from '@expo-google-fonts/inter/400Regular_Italic/Inter_400Regular_Italic.ttf?url'
import interBold from '@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf?url'
import interBoldItalic from '@expo-google-fonts/inter/700Bold_Italic/Inter_700Bold_Italic.ttf?url'
import classic from '../templates/classic.typ?raw'
import type {RenderModel} from '../render-model'

const FONTS = [interRegular, interItalic, interBold, interBoldItalic]

export const TEMPLATES: Readonly<Record<string, string>> = {classic}

const MAIN = '/main.typ'
const DATA = '/cv.json'

export interface TypstProblem {
    readonly message: string
}

export class TypstError extends Error {
    constructor(readonly problems: readonly TypstProblem[]) {
        super(problems[0]?.message ?? 'The CV could not be laid out.')
        this.name = 'TypstError'
    }
}

export interface Preview {
    /** All pages as one SVG, stacked top to bottom. */
    readonly svg: string
    readonly pages: number
    readonly ms: number
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

/** Starts the engine, once. Calling it early hides the start-up behind other work. */
export function warmUp(): Promise<Engine> {
    engine ??= start().catch((error: unknown) => {
        engine = null
        throw error
    })

    return engine
}

let running: Promise<unknown> = Promise.resolve()

/** Runs compiles one after another. */
function serial<T>(work: () => Promise<T>): Promise<T> {
    const next = running.then(work, work)

    running = next.catch(() => undefined)
    return next
}

async function compile(model: RenderModel, template: string, format: 0 | 1): Promise<Uint8Array> {
    const {compiler} = await warmUp()
    const source = TEMPLATES[template] ?? TEMPLATES.classic

    compiler.addSource(MAIN, source)
    compiler.mapShadow(DATA, new TextEncoder().encode(JSON.stringify(model)))

    const result = await compiler.compile({mainFilePath: MAIN, format, diagnostics: 'full'})
    const errors = (result.diagnostics ?? []).filter((item) => item.severity === 'error')

    if (!result.result || errors.length > 0) {
        throw new TypstError(errors.length > 0 ? errors.map((item) => ({message: item.message})) : [{message: 'The CV could not be laid out.'}])
    }

    return result.result
}

const pageCount = (svg: string): number => svg.match(/class="typst-page"/g)?.length ?? 0

let waiting: {model: RenderModel; template: string; settle: (preview: Promise<Preview | null>) => void} | null = null

/**
 * Lays the CV out as pages. Resolves to null when a newer preview took its place
 * before it began, so the caller can just drop it.
 */
export function preview(model: RenderModel, template: string): Promise<Preview | null> {
    waiting?.settle(Promise.resolve(null))

    return new Promise((resolve) => {
        waiting = {model, template, settle: resolve}

        void serial(async () => {
            const job = waiting

            if (!job || job.settle !== resolve) {
                return
            }

            waiting = null

            const began = performance.now()
            const work = (async () => {
                const vector = await compile(job.model, job.template, 0)
                const {renderer} = await warmUp()
                const svg = await renderer.runWithSession(async (session) => {
                    renderer.manipulateData({renderSession: session, action: 'reset', data: vector})
                    return renderer.renderSvg({renderSession: session})
                })

                return {svg, pages: pageCount(svg), ms: Math.round(performance.now() - began)}
            })()

            resolve(work)
            await work.catch(() => undefined)
        })
    })
}

/** All pages as SVG, waiting its turn rather than giving way to newer previews. */
export function svg(model: RenderModel, template: string): Promise<string> {
    return serial(async () => {
        const vector = await compile(model, template, 0)
        const {renderer} = await warmUp()

        return renderer.runWithSession(async (session) => {
            renderer.manipulateData({renderSession: session, action: 'reset', data: vector})
            return renderer.renderSvg({renderSession: session})
        })
    })
}

/** The CV as a PDF, the same layout the preview shows. */
export function pdf(model: RenderModel, template: string): Promise<Uint8Array> {
    return serial(() => compile(model, template, 1))
}
