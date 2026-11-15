/**
 * A Word file (.docx) read into the same lines a PDF gives (see `layout.ts`), so one set
 * of rules makes a CV from either.
 *
 * Word keeps text, not a page: each paragraph becomes one line, with the bold and size
 * its styles give it. A tab splits a line into parts, as dates on a tab stop sit apart
 * from a title on the page; a list paragraph is a bullet. A table row of single lines is
 * one line; a table laid out as the page's columns is read cell by cell, the widest cell
 * first. Text boxes, the header, link addresses and a photo are read too.
 */

import JSZip from 'jszip'
import type {Column, PdfLine, TextRun} from './layout'
import {photoPlacement, type PdfPhoto} from './photo'
import type {PdfLayout} from './read-pdf'

/** A run's look as Word's styles and its own settings give it. */
interface Look {
    readonly size: number
    readonly bold: boolean
    readonly caps: boolean
}

interface StyleLook {
    readonly basedOn?: string
    readonly size?: number
    readonly bold?: boolean
    readonly caps?: boolean
}

/** A part of a line before it has a place on the page. */
interface Part {
    readonly text: string
    readonly look: Look
    /** Set apart from the part before it, by a tab or a table cell. */
    readonly apart: boolean
}

const W = (element: Element, name: string): Element[] => [...element.children].filter((child) => child.tagName === `w:${name}`)
const first = (element: Element | null | undefined, name: string): Element | null => (element ? (W(element, name)[0] ?? null) : null)
const attribute = (element: Element | null, name: string): string | null => element?.getAttribute(`w:${name}`) ?? null

/** A switch such as <w:b/>, which is on unless its value says off. */
function toggle(properties: Element | null, name: string): boolean | undefined {
    const element = first(properties, name)

    if (!element) {
        return undefined
    }

    return !['0', 'false', 'off'].includes(attribute(element, 'val') ?? 'true')
}

/** A size in points, from Word's half points. */
function sizeOf(properties: Element | null): number | undefined {
    const value = Number(attribute(first(properties, 'sz'), 'val'))

    return value > 0 ? value / 2 : undefined
}

const lookOf = (properties: Element | null): StyleLook => ({size: sizeOf(properties), bold: toggle(properties, 'b'), caps: toggle(properties, 'caps')})

/** Word's styles by id, and the look text has when nothing says otherwise. */
function readStyles(styles: Document | null): {byId: Map<string, StyleLook>; base: Look} {
    const byId = new Map<string, StyleLook>()
    const base = lookOf(first(styles?.getElementsByTagName('w:rPrDefault')[0], 'rPr'))

    for (const style of styles ? [...styles.getElementsByTagName('w:style')] : []) {
        const id = attribute(style, 'styleId')

        if (id) {
            byId.set(id, {basedOn: attribute(first(style, 'basedOn'), 'val') ?? undefined, ...lookOf(first(style, 'rPr'))})
        }
    }

    return {byId, base: {size: base.size ?? 10, bold: base.bold ?? false, caps: base.caps ?? false}}
}

/** A style's look, with what the styles it is based on give. */
function styleLook(id: string | null, styles: Map<string, StyleLook>, depth = 0): StyleLook {
    const style = id ? styles.get(id) : undefined

    if (!style || depth > 10) {
        return {}
    }

    const parent = styleLook(style.basedOn ?? null, styles, depth + 1)

    return {size: style.size ?? parent.size, bold: style.bold ?? parent.bold, caps: style.caps ?? parent.caps}
}

/** Whether an element sits inside another of a kind, such as a text box or the fallback copy of one. */
function inside(element: Element, stop: Element, names: readonly string[]): boolean {
    for (let at = element.parentElement; at && at !== stop; at = at.parentElement) {
        if (names.includes(at.tagName)) {
            return true
        }
    }

    return false
}

/** A paragraph's parts: its runs' text, split where a tab sets them apart. */
function partsOf(paragraph: Element, styles: {byId: Map<string, StyleLook>; base: Look}): Part[] {
    const properties = first(paragraph, 'pPr')
    const paragraphLook = styleLook(attribute(first(properties, 'pStyle'), 'val'), styles.byId)
    const parts: Part[] = []
    let apart = false

    // Runs of this paragraph, not of a text box inside it or of the copy Word keeps for old readers.
    const runs = [...paragraph.getElementsByTagName('w:r')].filter((run) => !inside(run, paragraph, ['w:p', 'w:txbxContent', 'mc:Fallback']))

    for (const run of runs) {
        const own = first(run, 'rPr')
        const runStyle = styleLook(attribute(first(own, 'rStyle'), 'val'), styles.byId)
        const set = lookOf(own)
        const look: Look = {
            size: set.size ?? runStyle.size ?? paragraphLook.size ?? styles.base.size,
            bold: set.bold ?? runStyle.bold ?? paragraphLook.bold ?? styles.base.bold,
            caps: set.caps ?? runStyle.caps ?? paragraphLook.caps ?? styles.base.caps,
        }

        for (const child of [...run.children]) {
            if (child.tagName === 'w:tab' || child.tagName === 'w:ptab') {
                apart = true
            } else if (child.tagName === 'w:t' || child.tagName === 'w:noBreakHyphen' || child.tagName === 'w:br') {
                const text = child.tagName === 'w:t' ? (child.textContent ?? '') : child.tagName === 'w:br' ? ' ' : '-'
                const last = parts[parts.length - 1]

                if (last && !apart && last.look.bold === look.bold && last.look.size === look.size && last.look.caps === look.caps) {
                    parts[parts.length - 1] = {...last, text: last.text + text}
                } else if (text.trim() || last) {
                    parts.push({text, look, apart})
                }

                apart = false
            }
        }
    }

    const listed = first(properties, 'numPr') !== null

    return parts
        .map((part) => ({...part, text: (part.look.caps ? part.text.toUpperCase() : part.text).replace(/\s+/g, ' ')}))
        .filter((part) => part.text.trim() !== '')
        .map((part, index) => (index === 0 && listed ? {...part, text: `• ${part.text.trim()}`} : part))
}

/** How far a paragraph is indented, in points. */
function indentOf(paragraph: Element): number {
    const indent = first(first(paragraph, 'pPr'), 'ind')

    return Number(attribute(indent, 'left') ?? attribute(indent, 'start') ?? 0) / 20
}

/** A paragraph or row as a line, its parts placed one after another. */
function lineOf(parts: readonly Part[], x: number, y: number, column: Column): PdfLine | null {
    if (parts.length === 0) {
        return null
    }

    const runs: TextRun[] = []
    let at = x

    for (const part of parts) {
        const last = runs[runs.length - 1]
        const text = part.text.trim()

        // Parts in one look with nothing between them are one run, as on a page.
        if (last && !part.apart && last.bold === part.look.bold && last.size === part.look.size) {
            const joined = `${last.text}${part.text}`.replace(/\s+/g, ' ').trim()

            runs[runs.length - 1] = {...last, text: joined, right: last.x + joined.length * last.size * 0.5}
        } else {
            at += part.apart ? 36 : 0
            runs.push({text, x: at, right: at + text.length * part.look.size * 0.5, y, size: part.look.size, bold: part.look.bold})
        }

        at = runs[runs.length - 1].right + 3
    }

    let text = runs[0].text

    for (const run of runs.slice(1)) {
        text = `${text} ${run.text}`
    }

    return {page: 1, column, y, x: runs[0].x, right: runs[runs.length - 1].right, size: Math.max(...runs.map((run) => run.size)), bold: runs.every((run) => run.bold), runs, text}
}

interface Reader {
    readonly styles: {byId: Map<string, StyleLook>; base: Look}
    readonly lines: PdfLine[]
    y: number
}

function addParagraph(reader: Reader, paragraph: Element, column: Column, parts = partsOf(paragraph, reader.styles)): void {
    addLine(reader, parts, indentOf(paragraph), column)

    // A text box's paragraphs, as templates draw a sidebar or a heading in one.
    for (const box of [...paragraph.getElementsByTagName('w:txbxContent')].filter((found) => !inside(found, paragraph, ['mc:Fallback', 'w:txbxContent']))) {
        addBlocks(reader, box, column)
    }
}

function addLine(reader: Reader, parts: readonly Part[], x: number, column: Column): void {
    const line = lineOf(parts, x, reader.y, column)

    if (line) {
        reader.lines.push(line)
        reader.y += line.size * 1.4
    }
}

function addTable(reader: Reader, table: Element, column: Column): void {
    for (const row of W(table, 'tr')) {
        const cells = W(row, 'tc')
        const lines = cells.map((cell) => W(cell, 'p').filter((paragraph) => partsOf(paragraph, reader.styles).length > 0))

        if (cells.every((cell, index) => lines[index].length <= 1 && W(cell, 'tbl').length === 0)) {
            // A row of single lines, as a title and its dates in two cells: one line, each
            // cell set apart from the one before.
            const filled = lines.flatMap((paragraphs) => paragraphs.slice(0, 1))
            const parts = filled.flatMap((paragraph, cell) => partsOf(paragraph, reader.styles).map((part, index) => (index === 0 && cell > 0 ? {...part, apart: true} : part)))

            if (filled.length > 0) {
                addLine(reader, parts, indentOf(filled[0]), column)
            }

            continue
        }

        // Cells laid out as the page's columns: the widest is the main one, read first.
        const widths = cells.map((cell) => Number(attribute(first(first(cell, 'tcPr'), 'tcW'), 'w') ?? 0))
        const widest = widths.indexOf(Math.max(...widths))
        const order = cells.map((_, index) => index).sort((a, b) => (a === widest ? -1 : b === widest ? 1 : a - b))

        for (const index of order) {
            addBlocks(reader, cells[index], cells.length > 1 ? (index === widest ? 'left' : 'right') : column)
        }
    }
}

/** A container's paragraphs and tables, in order. */
function addBlocks(reader: Reader, container: Element, column: Column): void {
    for (const child of [...container.children]) {
        if (child.tagName === 'w:p') {
            addParagraph(reader, child, column)
        } else if (child.tagName === 'w:tbl') {
            addTable(reader, child, column)
        } else if (child.tagName === 'w:sdt') {
            const content = first(child, 'sdtContent')

            if (content) {
                addBlocks(reader, content, column)
            }
        }
    }
}

/** A picture in the document with its size, in points, and the file holding it. */
function pictures(document: Document): {target: string; width: number; height: number}[] {
    return [...document.getElementsByTagName('wp:extent')].flatMap((extent) => {
        const drawing = extent.parentElement
        const blip = drawing?.getElementsByTagName('a:blip')[0]
        const target = blip?.getAttribute('r:embed')

        return target ? [{target, width: Number(extent.getAttribute('cx')) / 12700, height: Number(extent.getAttribute('cy')) / 12700}] : []
    })
}

/** The photo, from the largest photo-sized picture, where a browser can decode it. */
async function photoOf(zip: JSZip, document: Document, relations: Map<string, string>, pageWidth: number): Promise<PdfPhoto | null> {
    const placed = pictures(document).map((picture, index) => ({...picture, id: String(index), x: 0, y: 0}))
    const photo = photoPlacement(placed, pageWidth)
    const file = photo ? zip.file(`word/${relations.get(placed[Number(photo.id)].target) ?? ''}`) : null

    if (!file || typeof createImageBitmap === 'undefined') {
        return null
    }

    const bitmap = await createImageBitmap(await file.async('blob'))

    return {width: bitmap.width, height: bitmap.height, bitmap}
}

/** A .docx file's text as lines, its link addresses and its photo. */
export async function readDocxLayout(bytes: Uint8Array): Promise<PdfLayout> {
    const zip = await JSZip.loadAsync(bytes)
    const xml = async (path: string) => {
        const file = zip.file(path)

        return file ? new DOMParser().parseFromString(await file.async('string'), 'application/xml') : null
    }
    const document = await xml('word/document.xml')
    const body = document?.getElementsByTagName('w:body')[0]

    if (!document || !body) {
        throw Object.assign(new Error("It doesn't look like a Word file, or it's damaged."), {name: 'InvalidPDFException'})
    }

    const links: string[] = []

    /** A part's relations by id, gathering the link addresses among them. */
    const relationsOf = async (part: string): Promise<Map<string, string>> => {
        const relations = new Map<string, string>()
        const rels = await xml(`word/_rels/${part}.rels`)

        for (const relation of rels ? [...rels.getElementsByTagName('Relationship')] : []) {
            const target = relation.getAttribute('Target') ?? ''

            relations.set(relation.getAttribute('Id') ?? '', target)

            if (relation.getAttribute('Type')?.endsWith('/hyperlink') && /^(?:https?|mailto):/i.test(target)) {
                links.push(target)
            }
        }

        return relations
    }
    const relations = await relationsOf('document.xml')

    const reader: Reader = {styles: readStyles(await xml('word/styles.xml')), lines: [], y: 40}

    // The header first, as Word templates often put the name and contact details there.
    // A header used for several kinds of page is read once.
    const headers = new Set([...document.getElementsByTagName('w:headerReference')].map((reference) => relations.get(reference.getAttribute('r:id') ?? '') ?? ''))

    for (const target of [...headers].filter(Boolean)) {
        const header = await xml(`word/${target}`)

        await relationsOf(target)

        if (header?.documentElement) {
            addBlocks(reader, header.documentElement, 'full')
        }
    }

    addBlocks(reader, body, 'full')

    const pageWidth = Number(attribute(body.getElementsByTagName('w:pgSz')[0] ?? null, 'w') ?? 11906) / 20
    return {pages: 1, lines: reader.lines, links, photo: await photoOf(zip, document, relations, pageWidth).catch(() => null)}
}
