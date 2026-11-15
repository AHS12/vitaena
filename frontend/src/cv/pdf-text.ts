/**
 * The text of a PDF as a screening system's parser pulls it out: page by page, in the
 * order the text is drawn, with no layout. Uses pdf.js, loaded only when asked.
 */

import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'

export interface PdfText {
    readonly pages: number
    readonly text: string
}

export async function pdfText(pdf: Uint8Array): Promise<PdfText> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

    const task = pdfjs.getDocument({data: pdf.slice()})
    const pages: string[] = []

    try {
        const document = await task.promise

        for (let number = 1; number <= document.numPages; number += 1) {
            const content = await (await document.getPage(number)).getTextContent()

            pages.push(content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : '')).join(''))
        }
    } finally {
        // Frees the document and its worker's copy of it.
        void task.destroy()
    }

    return {pages: pages.length, text: pages.join('\n\n')}
}
