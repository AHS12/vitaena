/**
 * A PDF page's text as lines a person would read, from the loose pieces a PDF holds.
 *
 * A PDF says where each piece of text is drawn and nothing about lines, columns or
 * reading order. This puts pieces on the same baseline into lines, splits a line where
 * the look changes (bold, size) or a wide gap opens, and finds a second column so it is
 * read after the first instead of line by line beside it.
 *
 * Pure: pdf.js is read in `read-pdf.ts`.
 */

/** One piece of text as pdf.js gives it, in points, with y measured down from the top. */
export interface TextPiece {
    readonly text: string
    readonly x: number
    /** The baseline, down from the top of the page. */
    readonly y: number
    readonly width: number
    readonly size: number
    readonly bold: boolean
}

export interface PdfPage {
    readonly width: number
    readonly height: number
    readonly pieces: readonly TextPiece[]
}

/** Text in one look with no wide gap in it, such as a bold job title. */
export interface TextRun {
    readonly text: string
    readonly x: number
    readonly right: number
    readonly y: number
    readonly size: number
    readonly bold: boolean
}

/**
 * Where a line sits: across the page (one column, or a header above two), or in the left
 * or right of two columns.
 */
export type Column = 'full' | 'left' | 'right'

export interface PdfLine {
    /** From 1. */
    readonly page: number
    readonly column: Column
    readonly y: number
    readonly x: number
    readonly right: number
    /** The largest text in the line. */
    readonly size: number
    /** Whether all of it is bold. */
    readonly bold: boolean
    readonly runs: readonly TextRun[]
    readonly text: string
}

/** Where two columns part: the gutter's x, and the baseline of the last line above them. */
export interface Gutter {
    readonly x: number
    readonly top: number
}

/** On one baseline: within a fifth of the text's size. */
const sameBaseline = (a: {y: number; size: number}, b: {y: number; size: number}) => Math.abs(a.y - b.y) <= Math.max(0.5, 0.2 * Math.min(a.size, b.size))

/** A gap this much wider than the text's size is a gap between things, such as a title and its dates. */
const WIDE_GAP = 1

/** A gap at least this much of the text's size is a space the PDF drew as a gap. */
const SPACE_GAP = 0.12

function joinText(left: {text: string; right: number}, right: {text: string; x: number}, size: number): string {
    const spaced = /\s$/.test(left.text) || /^\s/.test(right.text)

    return spaced || right.x - left.right < SPACE_GAP * size ? left.text + right.text : `${left.text} ${right.text}`
}

/**
 * A blank wider than this much of the text's size is a gap between separate things, such
 * as skills drawn in boxes. pdf.js fills a gap with a blank piece as wide as the gap; a
 * word space is about a third of the size.
 */
const WIDE_BLANK = 0.6

/** Pieces on one baseline, left to right, as runs. */
function runsOf(row: readonly TextPiece[]): TextRun[] {
    const runs: TextRun[] = []
    let apart = false

    for (const piece of row) {
        const last = runs[runs.length - 1]
        const right = piece.x + piece.width
        const blank = piece.text.trim() === ''

        if (blank && piece.width > WIDE_BLANK * piece.size) {
            apart = true
            continue
        }

        if (last && !apart && (blank || (last.bold === piece.bold && Math.abs(last.size - piece.size) < 0.5 && piece.x - last.right <= WIDE_GAP * piece.size))) {
            runs[runs.length - 1] = {...last, text: blank ? `${last.text} ` : joinText(last, piece, piece.size), right: Math.max(last.right, right)}
        } else if (!blank) {
            runs.push({text: piece.text, x: piece.x, right, y: piece.y, size: piece.size, bold: piece.bold})
            apart = false
        }
    }

    return runs.map((run) => ({...run, text: withoutUnknown(run.text).replace(/\s+/g, ' ').trim()})).filter((run) => run.text !== '')
}

/** Groups items on one baseline, top to bottom; each group left to right. */
function rowsOf<T extends {x: number; y: number; size: number}>(items: readonly T[]): T[][] {
    const rows: T[][] = []

    for (const item of [...items].sort((a, b) => a.y - b.y || a.x - b.x)) {
        const row = rows.find((candidate) => sameBaseline(candidate[0], item))

        if (row) {
            row.push(item)
        } else {
            rows.push([item])
        }
    }

    return rows.map((row) => row.sort((a, b) => a.x - b.x)).sort((a, b) => a[0].y - b[0].y)
}

/** The baselines of runs, one per row. */
function baselines(runs: readonly TextRun[]): TextRun[] {
    return rowsOf(runs).map((row) => row[0])
}

/**
 * The share of rows on one side with a run on the other side's baseline, within a tenth
 * of the text's size: parts of one line in two sizes, such as dates in a margin, can sit
 * most of a point apart. Two real columns come that close only by chance, on about a
 * quarter of their rows.
 */
function sharedShare(side: readonly TextRun[], other: readonly TextRun[]): number {
    const rows = baselines(side)

    return rows.filter((row) => other.some((run) => Math.abs(row.y - run.y) <= 0.1 * Math.min(row.size, run.size))).length / rows.length
}

/** Each side needs this many rows to be a column. */
const MIN_ROWS = 4

/**
 * Past this share of rows lined up with the other side, the two sides are one column
 * laid out in parts, such as titles with their dates at the right or dates in the margin.
 */
const MAX_SHARED = 0.5

/**
 * Finds the strip down the page that splits it into two columns, if there is one. Text
 * may cross it above the columns, as a header across the page does.
 */
export function findGutter(runs: readonly TextRun[], width: number): Gutter | null {
    let best: {score: number; xs: number[]; top: number} = {score: 0, xs: [], top: 0}

    for (let x = Math.round(width * 0.2); x <= width * 0.8; x += 2) {
        const crossing = runs.filter((run) => run.x < x && run.right > x)
        const top = crossing.reduce((lowest, run) => Math.max(lowest, run.y), -Infinity)
        const below = runs.filter((run) => run.y > top)
        const left = below.filter((run) => run.right <= x)
        const right = below.filter((run) => run.x >= x)

        if (rowsOf(left).length < MIN_ROWS || rowsOf(right).length < MIN_ROWS) {
            continue
        }

        if (Math.max(sharedShare(left, right), sharedShare(right, left)) > MAX_SHARED) {
            continue
        }

        if (below.length > best.score) {
            best = {score: below.length, xs: [x], top}
        } else if (below.length === best.score && top === best.top) {
            best.xs.push(x)
        }
    }

    // The middle of the empty strip, so a line that reaches into it a little stays on its side.
    return best.xs.length > 0 ? {x: best.xs[Math.floor(best.xs.length / 2)], top: best.top} : null
}

function lineOf(page: number, column: Column, runs: readonly TextRun[]): PdfLine {
    let text = runs[0].text

    for (let index = 1; index < runs.length; index += 1) {
        text = joinText({text, right: runs[index - 1].right}, runs[index], runs[index].size)
    }

    return {
        page,
        column,
        y: runs[0].y,
        x: runs[0].x,
        right: runs[runs.length - 1].right,
        size: Math.max(...runs.map((run) => run.size)),
        bold: runs.every((run) => run.bold),
        runs,
        text,
    }
}

/** A heading spaced out letter by letter, which pdf.js gives as "C O N T A C T", closed up. The words of a spaced-out line come as separate pieces. */
const closedUp = (text: string): string => (/^(?:[\p{Lu}\d&] )+[\p{Lu}\d&]$/u.test(text) ? text.replace(/ /g, '') : text)

/**
 * Characters a font drew without saying what they are come through from the Private Use
 * Area. Between numbers, as in "2019 – 2024", one is a dash the font drew its own way;
 * anywhere else it means nothing, and goes.
 */
const withoutUnknown = (text: string): string => text.replace(/(\d)\s*\p{Co}\s*(?=\d)/gu, '$1 – ').replace(/\p{Co}/gu, '')

/**
 * A page's lines in reading order: what runs across the page above any columns, then the
 * left column, then the right.
 */
export function pageLines(page: PdfPage, number: number): PdfLine[] {
    const pieces = page.pieces.filter((piece) => piece.width >= 0).map((piece) => ({...piece, text: closedUp(piece.text)}))
    const runs = rowsOf(pieces).flatMap(runsOf)
    const gutter = findGutter(runs, page.width)
    const columnOf = (run: TextRun): Column => (!gutter || run.y <= gutter.top ? 'full' : run.right <= gutter.x ? 'left' : run.x >= gutter.x ? 'right' : 'full')
    const lines: PdfLine[] = []

    for (const column of ['full', 'left', 'right'] as const) {
        for (const row of rowsOf(runs.filter((run) => columnOf(run) === column))) {
            lines.push(lineOf(number, column, row))
        }
    }

    // A full line below the columns, such as a footer, still reads after them.
    return lines.sort((a, b) => order(a, gutter) - order(b, gutter) || a.y - b.y)
}

function order(line: PdfLine, gutter: Gutter | null): number {
    if (line.column === 'left') {
        return 1
    }

    if (line.column === 'right') {
        return 2
    }

    return gutter && line.y > gutter.top ? 3 : 0
}
