import {describe, expect, it} from 'vitest'
import {pageLines, type TextPiece} from './layout'

/** A piece as pdf.js would give it, half a point wide per letter per point of size. */
const piece = (text: string, x: number, y: number, {size = 10, bold = false} = {}): TextPiece => ({text, x, y, width: text.length * size * 0.5, size, bold})
const page = (pieces: TextPiece[]) => ({width: 600, height: 840, pieces})
const texts = (pieces: TextPiece[]) => pageLines(page(pieces), 1).map((line) => line.text)

describe('reading a page into lines', () => {
    it('joins the pieces on one baseline, with a space only where the PDF left a gap', () => {
        const lines = pageLines(page([piece('Senior', 50, 100), piece('Engineer', 85, 100), piece(', Harbourline', 125, 100)]), 1)

        expect(lines.map((line) => line.text)).toEqual(['Senior Engineer, Harbourline'])
    })

    it('reads lines top to bottom, whatever order the PDF drew them in', () => {
        expect(texts([piece('Second', 50, 120), piece('First', 50, 100)])).toEqual(['First', 'Second'])
    })

    it('keeps bold apart from regular within a line', () => {
        const [line] = pageLines(page([piece('Engineer', 50, 100, {bold: true}), piece(', Harbourline', 90, 100)]), 1)

        expect(line.text).toBe('Engineer, Harbourline')
        expect(line.runs.map((run) => [run.text, run.bold])).toEqual([['Engineer', true], [', Harbourline', false]])
        expect(line.bold).toBe(false)
    })

    it('gives the line its largest size, so a name stands out', () => {
        const [line] = pageLines(page([piece('Jane Doe', 50, 60, {size: 21, bold: true})]), 1)

        expect(line).toMatchObject({size: 21, bold: true, column: 'full'})
    })

    it('keeps a title and its dates at the right edge on one line, as two runs', () => {
        const rows = [0, 1, 2, 3, 4].flatMap((row) => [piece(`Job ${row}`, 50, 100 + row * 40, {bold: true}), piece('Jan 2020 – Present', 460, 100 + row * 40)])
        const lines = pageLines(page(rows), 1)

        expect(lines.map((line) => line.text)).toEqual([0, 1, 2, 3, 4].map((row) => `Job ${row} Jan 2020 – Present`))
        expect(lines.every((line) => line.column === 'full' && line.runs.length === 2)).toBe(true)
    })

    it('keeps the spaces a PDF draws as pieces of their own', () => {
        expect(texts([piece('+1 555 0100', 50, 100), piece(' ', 105, 100, {size: 10}), piece('|', 110, 100), piece(' ', 115, 100), piece('jane.doe@example.com', 120, 100)])).toEqual(['+1 555 0100 | jane.doe@example.com'])
    })

    it('splits a line where a wide gap is drawn, as between skills in boxes', () => {
        const [line] = pageLines(page([piece('Go', 50, 100), {...piece(' ', 60, 100), width: 13}, piece('TypeScript', 73, 100)]), 1)

        expect(line.runs.map((run) => run.text)).toEqual(['Go', 'TypeScript'])
    })

    it('keeps dates in a left margin on the line they belong to', () => {
        // Smaller than the line beside them, so most of a point off its baseline.
        const rows = [0, 1, 2, 3, 4].flatMap((row) => [piece('2019 – 2022', 40, 100.7 + row * 40, {size: 9}), piece(`Lecturer at college ${row}`, 140, 100 + row * 40)])

        expect(texts(rows)).toEqual([0, 1, 2, 3, 4].map((row) => `2019 – 2022 Lecturer at college ${row}`))
    })

    it('reads two columns one after the other, under a header across the page', () => {
        const pieces = [
            piece('Jane Doe', 50, 60, {size: 20}),
            piece('jane.doe@example.com · +1 555 0100 · Dhaka, Bangladesh · example.com/jane-doe', 50, 85),
            // The main column's baselines fall between the side column's.
            ...[0, 1, 2, 3, 4, 5].map((row) => piece(`Main line ${row}`, 50, 120 + row * 13)),
            ...[0, 1, 2, 3, 4].map((row) => piece(`Side ${row}`, 420, 126 + row * 15)),
        ]
        const lines = pageLines(page(pieces), 1)

        expect(lines.map((line) => line.text)).toEqual([
            'Jane Doe',
            'jane.doe@example.com · +1 555 0100 · Dhaka, Bangladesh · example.com/jane-doe',
            ...[0, 1, 2, 3, 4, 5].map((row) => `Main line ${row}`),
            ...[0, 1, 2, 3, 4].map((row) => `Side ${row}`),
        ])
        expect(lines.map((line) => line.column)).toEqual(['full', 'full', ...Array(6).fill('left'), ...Array(5).fill('right')])
    })

    it('reads a column on the left before the main one on the right', () => {
        const pieces = [...[0, 1, 2, 3, 4].map((row) => piece(`Side ${row}`, 30, 100 + row * 15)), ...[0, 1, 2, 3, 4, 5].map((row) => piece(`Main line ${row}`, 220, 104 + row * 13))]

        expect(texts(pieces)).toEqual([...[0, 1, 2, 3, 4].map((row) => `Side ${row}`), ...[0, 1, 2, 3, 4, 5].map((row) => `Main line ${row}`)])
    })

    it('closes up a heading spaced out letter by letter, word by word', () => {
        expect(texts([piece('A B O U T', 50, 100, {bold: true}), {...piece(' ', 95, 100), width: 11}, piece('M E', 106, 100, {bold: true})])).toEqual(['ABOUT ME'])
    })

    it('reads a character a font left unnamed as a dash between numbers, and drops it elsewhere', () => {
        const unnamed = String.fromCodePoint(0xe09d)

        expect(texts([piece(`2019 ${unnamed} 2024`, 50, 100), piece(`${unnamed}1 555 0142`, 50, 120)])).toEqual(['2019 – 2024', '1 555 0142'])
    })

    it('reads nothing from an empty page', () => {
        expect(texts([piece('   ', 50, 100)])).toEqual([])
    })
})
