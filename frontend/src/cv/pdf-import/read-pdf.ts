/**
 * Reads a PDF's text with where it sits, how big it is and whether it is bold, page by
 * page, and puts it into lines in reading order (see `layout.ts`).
 */

import {pageContent, withPdf, type PdfPageProxy} from '../pdf-text'
import {pageLines, type PdfLine, type TextPiece} from './layout'

export interface PdfLayout {
    readonly pages: number
    readonly lines: readonly PdfLine[]
}

export interface ReadOptions {
    /** Called after each page, with the pages read so far and the number in all. */
    readonly onPage?: (read: number, pages: number) => void
    readonly signal?: AbortSignal
}

/** A font name such as "ABCDEF+Inter-Bold", less the subset tag, says whether it's bold. */
export const boldFont = (name: string): boolean => /bold|black|heavy|semibold|demi/i.test(name.replace(/^[A-Z]{6}\+/, ''))

/** The real name of a font the page uses, once its drawing has loaded it, or "". */
function fontName(page: PdfPageProxy, id: string): string {
    try {
        if (page.commonObjs.has(id)) {
            const font = page.commonObjs.get(id) as {name?: unknown}

            return typeof font.name === 'string' ? font.name : ''
        }
    } catch {
        // A font pdf.js couldn't load: read it as regular.
    }

    return ''
}

async function piecesOf(page: PdfPageProxy): Promise<TextPiece[]> {
    const content = await pageContent(page)

    // Loads the page's fonts, which hold their names.
    await page.getOperatorList()

    const [left, , , top] = page.view
    const bold = new Map<string, boolean>()
    const pieces: TextPiece[] = []

    for (const item of content.items) {
        if (!('str' in item) || item.str === '') {
            continue
        }

        const [a, b, c, d, e, f] = item.transform as number[]

        // Turned text, such as a label up the side, isn't part of the reading.
        if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || a <= 0) {
            continue
        }

        if (!bold.has(item.fontName)) {
            bold.set(item.fontName, boldFont(fontName(page, item.fontName)))
        }

        pieces.push({text: item.str, x: e - left, y: top - f, width: item.width, size: Math.abs(d), bold: bold.get(item.fontName)!})
    }

    return pieces
}

export function readPdfLayout(pdf: Uint8Array, {onPage, signal}: ReadOptions = {}): Promise<PdfLayout> {
    return withPdf(pdf, async (document) => {
        const lines: PdfLine[] = []

        for (let number = 1; number <= document.numPages; number += 1) {
            signal?.throwIfAborted()

            const page = await document.getPage(number)
            const [left, bottom, right, top] = page.view

            lines.push(...pageLines({width: right - left, height: top - bottom, pieces: await piecesOf(page)}, number))
            page.cleanup()
            onPage?.(number, document.numPages)
        }

        signal?.throwIfAborted()
        return {pages: document.numPages, lines}
    })
}
