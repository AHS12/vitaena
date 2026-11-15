/**
 * Reads a PDF's text with where it sits, how big it is and whether it is bold, page by
 * page, and puts it into lines in reading order (see `layout.ts`).
 */

import {pageContent, withPdf, type PdfPageProxy} from '../pdf-text'
import {pageLines, type PdfLine, type TextPiece} from './layout'
import {photoFrom, photoPlacement, picturePlacements, type PdfPhoto} from './photo'

export interface PdfLayout {
    readonly pages: number
    readonly lines: readonly PdfLine[]
    /** The photo on the first page, or null when there's none. */
    readonly photo?: PdfPhoto | null
    /** Where the document's links go, such as https://… or mailto:…, which may say more than their text. */
    readonly links?: readonly string[]
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

/** The decoded picture pdf.js holds for an id, waiting for it, or null if it never comes. */
function pictureOf(page: PdfPageProxy, id: string): Promise<unknown> {
    // Pictures used on several pages are kept with the document, the rest with the page.
    const objects = id.startsWith('g_') ? page.commonObjs : page.objs

    return new Promise((resolve) => {
        const waited = setTimeout(() => resolve(null), 5000)

        try {
            objects.get(id, (picture: unknown) => {
                clearTimeout(waited)
                resolve(picture)
            })
        } catch {
            clearTimeout(waited)
            resolve(null)
        }
    })
}

/** The photo among a page's pictures, from the drawing pdf.js has already worked out. */
async function photoOf(page: PdfPageProxy, drawing: {fnArray: number[]; argsArray: unknown[]}, width: number): Promise<PdfPhoto | null> {
    const {OPS} = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const placement = photoPlacement(picturePlacements(drawing.fnArray, drawing.argsArray, OPS), width)

    const photo = placement ? photoFrom(await pictureOf(page, placement.id)) : null

    // pdf.js closes its bitmap when the page is cleaned up, so the photo keeps a copy.
    return photo?.bitmap ? {...photo, bitmap: await createImageBitmap(photo.bitmap)} : photo
}

/** Where a page's links go. */
async function linksOf(page: PdfPageProxy): Promise<string[]> {
    try {
        const annotations = (await page.getAnnotations()) as {url?: unknown; unsafeUrl?: unknown}[]

        return annotations.flatMap((annotation) => {
            const url = typeof annotation.url === 'string' ? annotation.url : typeof annotation.unsafeUrl === 'string' ? annotation.unsafeUrl : ''

            return /^(?:https?|mailto):/i.test(url) ? [url] : []
        })
    } catch {
        return []
    }
}

export function readPdfLayout(pdf: Uint8Array, {onPage, signal}: ReadOptions = {}): Promise<PdfLayout> {
    return withPdf(pdf, async (document) => {
        const lines: PdfLine[] = []
        const links: string[] = []
        let photo: PdfPhoto | null = null

        for (let number = 1; number <= document.numPages; number += 1) {
            signal?.throwIfAborted()

            const page = await document.getPage(number)
            const [left, bottom, right, top] = page.view
            // Works out the page's drawing, which loads its fonts (their names say which are
            // bold) and says where its pictures go.
            const drawing = await page.getOperatorList()

            lines.push(...pageLines({width: right - left, height: top - bottom, pieces: await piecesOf(page)}, number))

            if (number === 1) {
                photo = await photoOf(page, drawing, right - left).catch(() => null)
            }

            links.push(...(await linksOf(page)))

            page.cleanup()
            onPage?.(number, document.numPages)
        }

        signal?.throwIfAborted()
        return {pages: document.numPages, lines, photo, links: [...new Set(links)]}
    })
}
