/**
 * The layout worker: runs the Typst compiler off the page, so the editor stays smooth
 * while a long CV is laid out. Answers one request at a time, in the order they came.
 */

import type {RenderModel} from '../render-model'
import {LayoutFailed, layOutPdf, layOutSvg, warmUp} from './layout'

export type LayoutRequest = {readonly id: number} & ({readonly op: 'warm'} | {readonly op: 'svg' | 'pdf'; readonly model: RenderModel; readonly template: string})

export type LayoutReply =
    | {readonly id: number; readonly ok: true; readonly svg?: string; readonly pdf?: Uint8Array}
    | {readonly id: number; readonly ok: false; readonly problems: readonly {readonly message: string}[]}

const scope = self as unknown as {onmessage: ((event: MessageEvent<LayoutRequest>) => void) | null; postMessage(reply: LayoutReply, transfer?: Transferable[]): void}

let queue: Promise<void> = Promise.resolve()

scope.onmessage = ({data: request}) => {
    queue = queue.then(async () => {
        try {
            if (request.op === 'warm') {
                await warmUp()
                scope.postMessage({id: request.id, ok: true})
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
