/**
 * The layout worker: runs the Typst compiler off the page, so the editor stays smooth
 * while a long CV is laid out. Answers one request at a time, in the order they came.
 */

import type {PageModel} from './images'
import {giveAddedFonts, LayoutFailed, layOutPdf, layOutSvg, readFontInfo, setInstalledPacks, warmUp, type FontFileInfo} from './layout'

/** A font the person added, as the page hands it over. */
export interface GivenFont {
    readonly id: string
    readonly family: string
    readonly bytes: Uint8Array
}

export type LayoutRequest = {readonly id: number} & (
    | {readonly op: 'warm'}
    | {readonly op: 'svg' | 'pdf'; readonly model: PageModel; readonly template: string}
    | {readonly op: 'fonts'; readonly fonts: readonly GivenFont[]}
    | {readonly op: 'packs'; readonly packs: readonly string[]}
    | {readonly op: 'font-info'; readonly bytes: Uint8Array}
)

export type LayoutReply =
    | {readonly id: number; readonly ok: true; readonly svg?: string; readonly pdf?: Uint8Array; readonly info?: readonly FontFileInfo[]}
    | {readonly id: number; readonly ok: false; readonly problems: readonly {readonly message: string}[]}

const scope = self as unknown as {onmessage: ((event: MessageEvent<LayoutRequest>) => void) | null; postMessage(reply: LayoutReply, transfer?: Transferable[]): void}

let queue: Promise<void> = Promise.resolve()

scope.onmessage = ({data: request}) => {
    queue = queue.then(async () => {
        try {
            if (request.op === 'warm') {
                await warmUp()
                scope.postMessage({id: request.id, ok: true})
            } else if (request.op === 'fonts') {
                giveAddedFonts(request.fonts)
                scope.postMessage({id: request.id, ok: true})
            } else if (request.op === 'packs') {
                setInstalledPacks(request.packs)
                scope.postMessage({id: request.id, ok: true})
            } else if (request.op === 'font-info') {
                scope.postMessage({id: request.id, ok: true, info: await readFontInfo(request.bytes)})
            } else if (request.op === 'svg') {
                scope.postMessage({id: request.id, ok: true, svg: await layOutSvg(request.model, request.template)})
            } else {
                const pdf = await layOutPdf(request.model, request.template)

                scope.postMessage({id: request.id, ok: true, pdf}, [pdf.buffer])
            }
        } catch (error) {
            const problems = error instanceof LayoutFailed ? error.problems : [{message: error instanceof Error ? error.message : String(error)}]

            scope.postMessage({id: request.id, ok: false, problems})
        }
    })
}
