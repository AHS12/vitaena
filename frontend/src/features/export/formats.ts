/**
 * What an export makes: one file per format a person picks, named after the document.
 *
 * The app says what its formats are and how to make each. Everything here is pure, so
 * the files an export would write can be tested without writing any.
 */

import type {LucideIcon} from 'lucide-react'
import {safeFileName} from '../../core/files'

/** What a format makes: one file's contents, or several files'. */
export type Made = string | Uint8Array | readonly Uint8Array[]

/** One kind of file a document can be exported as. */
export interface ExportFormat<T> {
    readonly id: string
    /** What the choice says, such as "Markdown". */
    readonly label: string
    /** The file name's ending, without the dot. */
    readonly extension: string
    /** What the file is, for a browser download. */
    readonly mimeType?: string
    /** Drawn beside the format in the Export menu. */
    readonly icon?: LucideIcon
    /** Added to the file name, so two formats with one extension don't clash: " (ATS)". */
    readonly suffix?: string
    /** Whether to offer it for this content. Offered always when left out. */
    available?(content: T): boolean
    /** One line on what it's good for. */
    readonly help?: string
    /**
     * The file's contents. Text is written as UTF-8. A format that has to lay pages out may
     * take its time. A list makes one file for each, such as a picture of each page,
     * numbered "-1", "-2" when there is more than one.
     */
    make(content: T, name: string): Made | Promise<Made>
}

export interface ExportFile {
    readonly name: string
    readonly bytes: Uint8Array
}

/** A document's name as a file name, or a plain one when nothing of it can be used. */
export const exportName = (name: string): string => safeFileName(name, 'Export')

/** The files exporting content as these formats makes, in the formats' order. */
export async function exportFiles<T>(formats: readonly ExportFormat<T>[], name: string, content: T): Promise<ExportFile[]> {
    const base = exportName(name)

    const made = await Promise.all(
        formats.map(async (format): Promise<ExportFile[]> => {
            const result = await format.make(content, name)
            const named = (number: string, bytes: Uint8Array) => ({name: `${base}${format.suffix ?? ''}${number}.${format.extension}`, bytes})

            if (typeof result === 'string') {
                return [named('', new TextEncoder().encode(result))]
            }

            // Bytes made in another realm, such as a worker, aren't this one's Uint8Array, so a
            // list is told apart by being an array.
            if (!Array.isArray(result)) {
                return [named('', result as Uint8Array)]
            }

            return result.length === 1 ? [named('', result[0])] : result.map((bytes, index) => named(`-${index + 1}`, bytes))
        }),
    )

    return made.flat()
}

/**
 * Names for several documents' files that never clash: two documents both called
 * "Shopping" become "Shopping" and "Shopping 2", whatever case they're written in,
 * since Windows and a Mac treat those names as one.
 */
export function uniqueNames(names: readonly string[]): string[] {
    const taken = new Set<string>()

    return names.map((name) => {
        const base = exportName(name)
        let candidate = base
        let count = 2

        while (taken.has(candidate.toLowerCase())) {
            candidate = `${base} ${count}`
            count += 1
        }

        taken.add(candidate.toLowerCase())

        return candidate
    })
}

/** "1 file is", "3 files are": for saying how many are in the way. */
export const filesAre = (count: number): string => (count === 1 ? '1 file is' : `${count} files are`)
