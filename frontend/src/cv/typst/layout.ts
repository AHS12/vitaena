/**
 * The Typst compiler and renderer themselves: a document's render model in, an SVG or a
 * PDF out.
 *
 * Runs inside the layout worker (engine.worker.ts), so a long CV never holds up typing.
 * The compiler, the renderer and the fonts are bundled with the app and loaded on first
 * use, never fetched from the network: the default font download is turned off.
 *
 * Fonts for other scripts, such as Bangla, are added the first time a document has
 * letters in that script, so a document in English never loads them. Fonts the person
 * added are handed over by the page (giveAddedFonts) and added the first time a
 * document names one.
 */

import type {TypstCompiler, TypstRenderer} from '@myriaddreamin/typst.ts'
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'
import rendererWasm from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url'
import academic from '../templates/academic.typ?raw'
import bold from '../templates/bold.typ?raw'
import classic from '../templates/classic.typ?raw'
import compact from '../templates/compact.typ?raw'
import executive from '../templates/executive.typ?raw'
import minimal from '../templates/minimal.typ?raw'
import modern from '../templates/modern.typ?raw'
import professional from '../templates/professional.typ?raw'
import sidebar from '../templates/sidebar.typ?raw'
import timeline from '../templates/timeline.typ?raw'
import clean from '../../biodata/templates/clean.typ?raw'
import heritage from '../../biodata/templates/heritage.typ?raw'
import portrait from '../../biodata/templates/portrait.typ?raw'
import {CV_FONTS, scriptFilesFor} from '../fonts'
import {fontUrl} from './font-urls'
import {withImageFiles, type PageModel} from './images'

/** The fonts the compiler starts with, as npm package paths. */
const START_FONTS = CV_FONTS.flatMap((font) => font.files)

/** Each template's source, and where it reads its document from. */
const CV_DATA = '/cv.json'
const BIODATA_DATA = '/biodata.json'

const TEMPLATES: Readonly<Record<string, {readonly source: string; readonly data: string}>> = {
    ...Object.fromEntries(Object.entries({classic, modern, minimal, compact, professional, academic, executive, bold, timeline, sidebar}).map(([id, source]) => [id, {source, data: CV_DATA}])),
    ...Object.fromEntries(Object.entries({heritage, clean, portrait}).map(([id, source]) => [id, {source, data: BIODATA_DATA}])),
}

const MAIN = '/main.typ'

/** What went wrong, in the compiler's words. Plain data, so it crosses to the page. */
export interface LayoutProblem {
    readonly message: string
}

export class LayoutFailed extends Error {
    constructor(readonly problems: readonly LayoutProblem[]) {
        super(problems[0]?.message ?? 'The pages could not be laid out.')
        this.name = 'LayoutFailed'
    }
}

interface Engine {
    readonly compiler: TypstCompiler
    readonly renderer: TypstRenderer
    /** Gives the compiler these fonts too, if it hasn't them yet: npm paths, or "added:" and a font's id. */
    readonly addFonts: (files: readonly string[]) => Promise<void>
}

let engine: Promise<Engine> | null = null

const bytesOf = async (url: string): Promise<Uint8Array> => {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Could not load ${url}`)
    }

    return new Uint8Array(await response.arrayBuffer())
}

/** Each font file's bytes, fetched once. */
const fontFiles = new Map<string, Promise<Uint8Array>>()

/** Fonts the person added, by id: the family inside, and the file. */
const addedFonts = new Map<string, {readonly family: string; readonly bytes: Uint8Array}>()

const ADDED = 'added:'

/** Takes fonts the person added, so a document naming one of their families can use it. */
export function giveAddedFonts(fonts: readonly {readonly id: string; readonly family: string; readonly bytes: Uint8Array}[]): void {
    for (const font of fonts) {
        addedFonts.set(font.id, {family: font.family, bytes: font.bytes})
    }
}

/** The added fonts a render model, as JSON, names. */
const addedFilesFor = (json: string): string[] => [...addedFonts].filter(([, font]) => json.includes(JSON.stringify(font.family))).map(([id]) => ADDED + id)

function fontBytes(file: string): Promise<Uint8Array> {
    if (file.startsWith(ADDED)) {
        const added = addedFonts.get(file.slice(ADDED.length))

        return added ? Promise.resolve(added.bytes) : Promise.reject(new Error('That font was removed.'))
    }

    let bytes = fontFiles.get(file)

    if (!bytes) {
        bytes = bytesOf(fontUrl(file))
        bytes.catch(() => fontFiles.delete(file))
        fontFiles.set(file, bytes)
    }

    return bytes
}

async function start(): Promise<Engine> {
    const typst = await import('@myriaddreamin/typst.ts')
    const fonts = await Promise.all(START_FONTS.map(fontBytes))
    const compiler = typst.createTypstCompiler()
    const renderer = typst.createTypstRenderer()

    await Promise.all([
        compiler.init({
            beforeBuild: [typst.initOptions.disableDefaultFontAssets(), typst.loadFonts(fonts)],
            getModule: () => bytesOf(compilerWasm),
        }),
        renderer.init({getModule: () => bytesOf(rendererWasm)}),
    ])

    const loaded = new Set(START_FONTS)

    // A running compiler takes a new set of fonts in a few milliseconds, so adding one
    // needs no restart: build the set with every font so far and the new ones, and swap it in.
    const addFonts = async (files: readonly string[]): Promise<void> => {
        const added = files.filter((file) => !loaded.has(file))

        if (added.length === 0) {
            return
        }

        const all = [...loaded, ...added]
        const builder = typst.createTypstFontBuilder()

        await builder.init({getModule: () => bytesOf(compilerWasm)})

        for (const bytes of await Promise.all(all.map(fontBytes))) {
            await builder.addFontData(bytes)
        }

        await builder.build(async (resolver) => compiler.setFonts(resolver))

        for (const file of added) {
            loaded.add(file)
        }
    }

    return {compiler, renderer, addFonts}
}

/** What Typst reads from a font file. */
export interface FontFileInfo {
    readonly family: string
    readonly style: string
    readonly weight: number
    /** Typst's flags, such as "SERIF" or "VARIABLE", as one string. */
    readonly flags: string
    /** The letters it has, as runs of codepoints: not covered, covered, not covered… */
    readonly coverage: readonly number[]
}

let infoReader: Promise<{getFontInfo(bytes: Uint8Array): Promise<unknown>}> | null = null

/** What's inside a font file: one entry per font, since a .ttc holds several. */
export async function readFontInfo(bytes: Uint8Array): Promise<FontFileInfo[]> {
    infoReader ??= (async () => {
        const typst = await import('@myriaddreamin/typst.ts')
        const builder = typst.createTypstFontBuilder()

        await builder.init({getModule: () => bytesOf(compilerWasm)})

        return builder
    })()

    const read = (await (await infoReader).getFontInfo(bytes)) as {info?: {family?: string; variant?: {style?: string; weight?: number}; flags?: unknown; coverage?: number[]}[]}

    return (read.info ?? []).map((font) => ({
        family: font.family ?? '',
        style: font.variant?.style ?? 'normal',
        weight: font.variant?.weight ?? 400,
        flags: typeof font.flags === 'string' ? font.flags : JSON.stringify(font.flags ?? ''),
        coverage: font.coverage ?? [],
    }))
}

/** Starts the compiler and renderer, once. */
export function warmUp(): Promise<Engine> {
    engine ??= start().catch((error: unknown) => {
        engine = null
        throw error
    })

    return engine
}

async function compile(model: PageModel, template: string, format: 0 | 1): Promise<Uint8Array> {
    const {compiler, addFonts} = await warmUp()

    const {model: readable, files} = withImageFiles(model)
    const {source, data} = TEMPLATES[template] ?? TEMPLATES.classic
    const json = JSON.stringify(readable)

    await addFonts([...scriptFilesFor(json), ...addedFilesFor(json)])

    compiler.addSource(MAIN, source)
    compiler.mapShadow(data, new TextEncoder().encode(json))

    for (const file of files) {
        compiler.mapShadow(file.path, file.bytes)
    }

    const result = await compiler.compile({mainFilePath: MAIN, format, diagnostics: 'full'})
    const errors = (result.diagnostics ?? []).filter((item) => item.severity === 'error')

    if (!result.result || errors.length > 0) {
        throw new LayoutFailed(errors.length > 0 ? errors.map((item) => ({message: item.message})) : [{message: 'The pages could not be laid out.'}])
    }

    return result.result
}

/** All pages as one SVG, stacked top to bottom. */
export async function layOutSvg(model: PageModel, template: string): Promise<string> {
    const vector = await compile(model, template, 0)
    const {renderer} = await warmUp()

    return renderer.runWithSession(async (session) => {
        renderer.manipulateData({renderSession: session, action: 'reset', data: vector})
        return renderer.renderSvg({renderSession: session})
    })
}

/** The same layout as a PDF. */
export const layOutPdf = (model: PageModel, template: string): Promise<Uint8Array> => compile(model, template, 1)
