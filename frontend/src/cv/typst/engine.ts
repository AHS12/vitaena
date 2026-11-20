/**
 * The Typst engine: turns a CV into pages to look at and a PDF to send.
 *
 * Both come from the same compile, so what the preview shows is what the PDF holds. The
 * compiling happens in a worker (engine.worker.ts), so the editor never waits on it.
 * Where a worker can't start, it runs in the page instead, slower but the same.
 *
 * Requests run one at a time. A preview asked for while another is compiling replaces
 * any still waiting, so typing never queues work.
 */

import type {PageModel} from './images'
import type {GivenFont, LayoutReply, LayoutRequest} from './engine.worker'
import type {FontFileInfo} from './layout'

export interface TypstProblem {
    readonly message: string
}

export class TypstError extends Error {
    constructor(readonly problems: readonly TypstProblem[]) {
        super(problems[0]?.message ?? 'The pages could not be laid out.')
        this.name = 'TypstError'
    }
}

export interface Preview {
    /** All pages as one SVG, stacked top to bottom. */
    readonly svg: string
    readonly pages: number
    readonly ms: number
}

type Job =
    | {readonly op: 'svg' | 'pdf'; readonly model: PageModel; readonly template: string}
    | {readonly op: 'warm'}
    | {readonly op: 'fonts'; readonly fonts: readonly GivenFont[]}
    | {readonly op: 'packs'; readonly packs: readonly string[]}
    | {readonly op: 'font-info'; readonly bytes: Uint8Array}

type Done = {svg?: string; pdf?: Uint8Array; info?: readonly FontFileInfo[]}

/** Something that lays out: the worker, or the page itself. */
type Runner = (job: Job) => Promise<Done>

let runner: Runner | null = null

function workerRunner(): Runner {
    const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {type: 'module', name: 'layout'})
    const pending = new Map<number, {resolve(reply: LayoutReply): void}>()
    let next = 0

    worker.onmessage = ({data}: MessageEvent<LayoutReply>) => {
        pending.get(data.id)?.resolve(data)
        pending.delete(data.id)
    }

    return async (job) => {
        const id = (next += 1)
        const reply = await new Promise<LayoutReply>((resolve) => {
            pending.set(id, {resolve})
            worker.postMessage({id, ...job} satisfies LayoutRequest)
        })

        if (!reply.ok) {
            throw new TypstError(reply.problems)
        }

        return {svg: reply.svg, pdf: reply.pdf, info: reply.info}
    }
}

/** Without workers, the same layout code runs in the page. */
const pageRunner: Runner = async (job) => {
    const layout = await import('./layout')

    try {
        if (job.op === 'warm') {
            await layout.warmUp()
            return {}
        }

        if (job.op === 'fonts') {
            layout.giveAddedFonts(job.fonts)
            return {}
        }

        if (job.op === 'packs') {
            layout.setInstalledPacks(job.packs)
            return {}
        }

        if (job.op === 'font-info') {
            return {info: await layout.readFontInfo(job.bytes)}
        }

        return job.op === 'svg' ? {svg: await layout.layOutSvg(job.model, job.template)} : {pdf: await layout.layOutPdf(job.model, job.template)}
    } catch (error) {
        throw error instanceof layout.LayoutFailed ? new TypstError(error.problems) : error
    }
}

const runOnce: Runner = (job) => {
    runner ??= typeof Worker === 'undefined' ? pageRunner : workerRunner()
    return runner(job)
}

/**
 * Gives the fonts a page needs that the person added, before it's laid out. Set by the
 * module that keeps those fonts, so the engine itself knows nothing of where they come from.
 */
type FontProvider = (families: readonly string[]) => Promise<readonly GivenFont[]>

let provideFonts: FontProvider | null = null
const given = new Set<string>()

export function setFontProvider(provider: FontProvider): void {
    provideFonts = provider
}

const familiesOf = (model: PageModel): readonly string[] => (model as {design?: {fonts?: readonly string[]}}).design?.fonts ?? []

/** The font packs downloaded, and whether the layout has been told since they changed. */
let packs: readonly string[] = []
let packsGiven = true

/** Says which font packs are downloaded. The next layout uses them. */
export function setInstalledPacks(ids: readonly string[]): void {
    packs = ids
    packsGiven = false
}

/** A layout, after handing over any added font it names that the layout hasn't yet. */
const run: Runner = async (job) => {
    if ((job.op === 'svg' || job.op === 'pdf') && !packsGiven) {
        packsGiven = true
        await runOnce({op: 'packs', packs})
    }

    if ((job.op === 'svg' || job.op === 'pdf') && provideFonts) {
        const fonts = (await provideFonts(familiesOf(job.model)).catch(() => [])).filter((font) => !given.has(font.id))

        if (fonts.length > 0) {
            await runOnce({op: 'fonts', fonts})
            fonts.forEach((font) => given.add(font.id))
        }
    }

    return runOnce(job)
}

let running: Promise<unknown> = Promise.resolve()

/** Runs requests one after another. */
function serial<T>(work: () => Promise<T>): Promise<T> {
    const next = running.then(work, work)

    running = next.catch(() => undefined)
    return next
}

/** Starts the engine early, so the first preview doesn't wait for it. */
export const warmUp = (): Promise<unknown> => serial(() => run({op: 'warm'}))

const pageCount = (svgText: string): number => svgText.match(/class="typst-page"/g)?.length ?? 0

let waiting: {model: PageModel; template: string; settle: (preview: Promise<Preview | null>) => void} | null = null

/**
 * Lays the CV out as pages. Resolves to null when a newer preview took its place
 * before it began, so the caller can just drop it.
 */
export function preview(model: PageModel, template: string): Promise<Preview | null> {
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
            const work = run({op: 'svg', model: job.model, template: job.template}).then(({svg: text = ''}) => ({svg: text, pages: pageCount(text), ms: Math.round(performance.now() - began)}))

            resolve(work)
            await work.catch(() => undefined)
        })
    })
}

/**
 * Resolves once the engine has nothing queued and no preview waiting, so work that can
 * wait, such as the template gallery, goes after what the person is looking at.
 */
export async function whenIdle(): Promise<void> {
    for (;;) {
        const last = running

        await last

        if (last === running && waiting === null) {
            return
        }
    }
}

/** All pages as SVG, waiting its turn rather than giving way to newer previews. */
export const svg = (model: PageModel, template: string): Promise<string> => serial(async () => (await run({op: 'svg', model, template})).svg ?? '')

/** What's inside a font file, read by the layout engine, as it waits its turn. */
export const fontInfo = (bytes: Uint8Array): Promise<readonly FontFileInfo[]> => serial(async () => (await run({op: 'font-info', bytes})).info ?? [])

/** The document as a PDF, the same layout the preview shows. */
export const pdf = (model: PageModel, template: string): Promise<Uint8Array> => serial(async () => (await run({op: 'pdf', model, template})).pdf ?? new Uint8Array())
