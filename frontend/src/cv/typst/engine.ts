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

import type {RenderModel} from '../render-model'
import type {LayoutReply, LayoutRequest} from './engine.worker'

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

type Job = {readonly op: 'svg' | 'pdf'; readonly model: RenderModel; readonly template: string} | {readonly op: 'warm'}

/** Something that lays out: the worker, or the page itself. */
type Runner = (job: Job) => Promise<{svg?: string; pdf?: Uint8Array}>

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

        return {svg: reply.svg, pdf: reply.pdf}
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

        return job.op === 'svg' ? {svg: await layout.layOutSvg(job.model, job.template)} : {pdf: await layout.layOutPdf(job.model, job.template)}
    } catch (error) {
        throw error instanceof layout.LayoutFailed ? new TypstError(error.problems) : error
    }
}

const run: Runner = (job) => {
    runner ??= typeof Worker === 'undefined' ? pageRunner : workerRunner()
    return runner(job)
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
            const work = run({op: 'svg', model: job.model, template: job.template}).then(({svg: text = ''}) => ({svg: text, pages: pageCount(text), ms: Math.round(performance.now() - began)}))

            resolve(work)
            await work.catch(() => undefined)
        })
    })
}

/** All pages as SVG, waiting its turn rather than giving way to newer previews. */
export const svg = (model: RenderModel, template: string): Promise<string> => serial(async () => (await run({op: 'svg', model, template})).svg ?? '')

/** The CV as a PDF, the same layout the preview shows. */
export const pdf = (model: RenderModel, template: string): Promise<Uint8Array> => serial(async () => (await run({op: 'pdf', model, template})).pdf ?? new Uint8Array())
