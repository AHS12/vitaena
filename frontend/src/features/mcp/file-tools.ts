/**
 * The tools that work with files on the computer: export a document, and import one
 * from a PDF or Word file. Files are named by their full path; exports go to Downloads
 * unless the person names a folder, and never replace a file already there.
 */

import {z} from 'zod'
import {safeFileName} from '../../core/files'
import {desktopApp} from '../../platform/shell'
import type {Content} from '../../store/document-types'
import {nounOfKind} from '../../store/document-types'
import {freeName, saveNew} from './changes'
import {loadDocument} from './documents'
import {defineTool, type McpTool} from './tool'

/** An export format, as cv/cv-export.ts and biodata/biodata-export.ts list them. */
export interface FileFormat {
    readonly id: string
    readonly label: string
    readonly extension: string
    readonly suffix?: string
    readonly help?: string
    available?(content: Content): boolean
    make(content: Content, name: string): string | Uint8Array | readonly Uint8Array[] | Promise<string | Uint8Array | readonly Uint8Array[]>
}

export type FormatsByKind = Readonly<Record<string, readonly FileFormat[]>>

interface FileBindings {
    SaveFiles(folder: string, files: {name: string; data: number[]}[]): Promise<string[] | null>
    ReadImportFile(path: string): Promise<unknown>
}

const bindings = (): FileBindings => {
    const found = desktopApp<FileBindings>('mcp')

    if (!found) {
        throw new Error('This only works in the app.')
    }

    return found
}

/** The files a format makes, named as Export names them: "Jane Doe.pdf", "Jane Doe-2.png". */
async function filesOf(format: FileFormat, content: Content, name: string): Promise<{name: string; data: number[]}[]> {
    const base = safeFileName(name, 'Export')
    const made = await format.make(content, name)
    const named = (number: string, bytes: Uint8Array) => ({name: `${base}${format.suffix ?? ''}${number}.${format.extension}`, data: [...bytes]})

    if (typeof made === 'string') {
        return [named('', new TextEncoder().encode(made))]
    }

    // Bytes made in another realm, such as a worker, aren't this one's Uint8Array, so a
    // list is told apart by being an array.
    if (!Array.isArray(made)) {
        return [named('', made as Uint8Array)]
    }

    const list = made as readonly Uint8Array[]

    return list.map((bytes, index) => named(list.length > 1 ? `-${index + 1}` : '', bytes))
}

export function fileTools(formats: FormatsByKind): McpTool[] {
    const formatsInWords = Object.entries(formats)
        .map(([kind, list]) => `${nounOfKind(kind) ?? kind}: ${list.map((format) => `${format.id} (${format.label})`).join(', ')}`)
        .join('; ')

    const exportDocument = defineTool({
        name: 'export_document',
        title: 'Export a document',
        description: `Saves a document as a file, laid out exactly as the app shows it, and says where. It goes to the person's Downloads folder unless they name another; a file already there is never replaced. Formats by kind, ${formatsInWords}.`,
        input: z.object({
            id: z.string().min(1).describe("The document's id, from list_documents."),
            format: z.string().min(1).describe('A format id, such as pdf.'),
            folder: z.string().optional().describe('The full path of a folder the person named. Default: Downloads.'),
        }),
        readOnly: false,
        idempotent: false,
        run: async ({id, format, folder}) => {
            const document = await loadDocument(id)
            const list = formats[document.kind] ?? []
            const chosen = list.find((candidate) => candidate.id === format)

            if (!chosen) {
                throw new Error(`A ${nounOfKind(document.kind)} can't be exported as "${format}". It can be: ${list.map((candidate) => candidate.id).join(', ')}.`)
            }

            if (chosen.available && !chosen.available(document.content)) {
                throw new Error(`${chosen.label} isn't offered for this ${nounOfKind(document.kind)}: ${chosen.help ?? 'it doesn\'t apply to its template'}`)
            }

            const files = await filesOf(chosen, document.content, document.name)
            const written = (await bindings().SaveFiles(folder?.trim() ?? '', files)) ?? []

            return {
                text: `Saved ${document.name} as ${chosen.label}${document.unsaved ? ', with the changes not saved yet in the editor' : ''}:\n${written.map((path) => `- ${path}`).join('\n')}`,
                structured: {files: written},
            }
        },
    })

    const importFile = defineTool({
        name: 'import_file',
        title: 'Import a CV',
        description:
            'Makes a CV, or a biodata, from a PDF or Word file at a full path, the way Import a CV does in the app, and saves it. Lines it can\'t place wait in a hidden "Not sorted" section: read the result, move them where they belong with edit_document, then remove that section. A scanned PDF has no text to read.',
        input: z.object({
            path: z.string().min(1).describe('The full path of a .pdf or .docx file.'),
            name: z.string().optional().describe("The new document's name. Default: the person's name from the file."),
        }),
        readOnly: false,
        run: async ({path, name}, context) => {
            const {documentFromFile, isOldWord} = await import('../../cv/import/import-cv')
            const file = path.split(/[\\/]/).pop() ?? path

            if (isOldWord(file)) {
                throw new Error('That is a Word file from before 2007 (.doc), which only Word reads. Ask the person to save it as .docx, or as a PDF, first.')
            }

            const {bytesFromBinding} = await import('../../platform/bytes')
            const bytes = bytesFromBinding(await bindings().ReadImportFile(path))
            let made: Awaited<ReturnType<typeof documentFromFile>>

            try {
                made = await documentFromFile(bytes, path)
            } catch (error) {
                const kind = error instanceof Error ? error.name : ''

                throw new Error(
                    kind === 'PasswordException' ? 'The PDF is locked with a password. Ask the person to save a copy without one.' : kind === 'InvalidPDFException' || kind === 'FormatError' ? "It doesn't look like a PDF, or it's damaged." : `It couldn't be read: ${error instanceof Error ? error.message : String(error)}`,
                    {cause: error},
                )
            }

            if (!made) {
                throw new Error('It has no text to read. It may be a scan, a picture of a CV, which needs the text typed in.')
            }

            const chosen = await freeName(name ?? made.name)
            const id = await saveNew(made.kind, chosen, made.content, context, `imported ${file}`)
            const sorted = made.unsorted === 0 ? 'Every line found a place.' : `${made.unsorted === 1 ? 'One line' : `${made.unsorted} lines`} wait in Not sorted.`

            return {
                text: `Made the ${nounOfKind(made.kind)} "${chosen}", id ${id}, from ${file}. ${sorted} Read it with read_document to check it against the file, the dates especially.`,
                structured: {id, name: chosen, kind: made.kind, unsorted: made.unsorted},
            }
        },
    })

    return [exportDocument, importFile]
}
