/**
 * The text of a PDF as a screening system's parser pulls it out: page by page, in the
 * order the text is drawn, with no layout. Uses pdf.js, loaded only when asked.
 */

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

export interface PdfText {
    readonly pages: number
    readonly text: string
}

type Page = Awaited<ReturnType<Awaited<ReturnType<typeof import('pdfjs-dist/legacy/build/pdf.mjs').getDocument>['promise']>['getPage']>>
type TextContent = Awaited<ReturnType<Page['getTextContent']>>

/**
 * A page's text, read chunk by chunk. Not getTextContent(): that loops over a stream
 * with for await, which a Mac's web view can't do, so it fails there.
 */
async function pageText(page: Page): Promise<string> {
    const reader = (page.streamTextContent() as ReadableStream<TextContent>).getReader()
    let text = ''

    for (;;) {
        const {done, value} = await reader.read()

        if (done) {
            return text
        }

        for (const item of value.items) {
            text += 'str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''
        }
    }
}

export async function pdfText(pdf: Uint8Array): Promise<PdfText> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

    const task = pdfjs.getDocument({data: pdf.slice()})
    const pages: string[] = []

    try {
        const document = await task.promise

        for (let number = 1; number <= document.numPages; number += 1) {
            pages.push(await pageText(await document.getPage(number)))
        }
    } finally {
        // Frees the document and its worker's copy of it.
        void task.destroy()
    }

    return {pages: pages.length, text: pages.join('\n\n')}
}
