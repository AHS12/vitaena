import {describe, expect, it} from 'vitest'
import {exportFiles, uniqueNames, type ExportFormat} from './formats'

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

const FORMATS: readonly ExportFormat<{text: string}>[] = [
    {id: 'markdown', label: 'Markdown', extension: 'md', make: (content, name) => `# ${name}\n\n${content.text}\n`},
    {id: 'bytes', label: 'Bytes', extension: 'bin', make: async (content) => new TextEncoder().encode(content.text)},
]

describe('the files an export makes', () => {
    it('makes one file per format, named after the document', async () => {
        const files = await exportFiles(FORMATS, 'Shopping', {text: 'Milk'})

        expect(files.map((file) => file.name)).toEqual(['Shopping.md', 'Shopping.bin'])
        expect(text(files[0].bytes)).toBe('# Shopping\n\nMilk\n')
        expect(text(files[1].bytes)).toBe('Milk')
    })

    it('keeps a name from reaching outside its folder', async () => {
        const [file] = await exportFiles(FORMATS, '../Plans: 2026/Q1', {text: ''})

        expect(file.name).toBe('Plans 2026 Q1.md')
        expect(file.name).not.toMatch(/[\\/:]/)
    })

    it('gives a document with no usable name a plain one', async () => {
        expect((await exportFiles(FORMATS, '***', {text: ''}))[0].name).toBe('Export.md')
    })
})

describe('naming many documents at once', () => {
    it('never gives two the same name, whatever their case', () => {
        expect(uniqueNames(['Shopping', 'shopping', 'Ideas', 'Shopping'])).toEqual(['Shopping', 'shopping 2', 'Ideas', 'Shopping 3'])
    })
})

describe('a format that makes several files', () => {
    const pages = (count: number): ExportFormat<{text: string}> => ({id: 'png', label: 'Picture', extension: 'png', make: () => Array.from({length: count}, (_, index) => new Uint8Array([index]))})

    it('numbers them, one for each page', async () => {
        const files = await exportFiles([pages(2)], 'Jane', {text: ''})

        expect(files.map((file) => [file.name, file.bytes[0]])).toEqual([
            ['Jane-1.png', 0],
            ['Jane-2.png', 1],
        ])
    })

    it('leaves the number off when there is only one', async () => {
        expect((await exportFiles([pages(1)], 'Jane', {text: ''})).map((file) => file.name)).toEqual(['Jane.png'])
    })
})
