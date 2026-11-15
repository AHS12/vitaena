/**
 * The text of a PDF as a screening system's parser pulls it out: page by page, in the
 * order the text is drawn, with no layout. Uses pdf.js, loaded only when asked.
 */

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

export interface PdfText {
    readonly pages: number
    readonly text: string
}

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs')
export type PdfDocument = Awaited<ReturnType<PdfJs['getDocument']>['promise']>
export type PdfPageProxy = Awaited<ReturnType<PdfDocument['getPage']>>
export type TextContent = Awaited<ReturnType<PdfPageProxy['getTextContent']>>

/**
 * Opens a PDF with pdf.js, hands it to `read`, and frees it after. `fontExtraProperties`
 * keeps each font's real name, which says whether it is bold.
 */
export async function withPdf<T>(pdf: Uint8Array, read: (document: PdfDocument) => Promise<T>): Promise<T> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

    pdfjs.GlobalWorkerOptions.workerSrc ||= workerUrl

    const task = pdfjs.getDocument({data: pdf.slice(), fontExtraProperties: true})

    try {
        return await read(await task.promise)
    } finally {
        // Frees the document and its worker's copy of it.
        void task.destroy()
    }
}

/**
 * A page's text, read chunk by chunk. Not getTextContent(): that loops over a stream
 * with for await, which a Mac's web view can't do, so it fails there.
 */
export async function pageContent(page: PdfPageProxy): Promise<TextContent> {
    const reader = (page.streamTextContent() as ReadableStream<TextContent>).getReader()
    const content: {items: TextContent['items'][number][]; styles: TextContent['styles']; lang: string | null} = {items: [], styles: {}, lang: null}

    for (;;) {
        const {done, value} = await reader.read()

        if (done) {
            return content as TextContent
        }

        content.items.push(...value.items)
        Object.assign(content.styles, value.styles)
    }
}

export async function pdfText(pdf: Uint8Array): Promise<PdfText> {
    return withPdf(pdf, async (document) => {
        const pages: string[] = []

        for (let number = 1; number <= document.numPages; number += 1) {
            const {items} = await pageContent(await document.getPage(number))

            pages.push(items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : '')).join(''))
        }

        return {pages: pages.length, text: pages.join('\n\n')}
    })
}
