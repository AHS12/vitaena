/**
 * The fonts a person added, from the frontend's side. In the app Go keeps the files
 * beside the documents; in a browser, where there's no Go, they're kept for as long as
 * the page is open, so the feature can still be tried.
 */

import {bytesFromBinding} from './bytes'
import {desktopApp} from './shell'

/** What the interface read from a font file, which Go keeps beside it. */
export interface FontFileInfo {
    readonly family: string
    readonly style: string
    readonly weight: number
    readonly scripts: readonly string[]
}

export interface KeptFont extends FontFileInfo {
    readonly id: string
    /** The file's name when it was added. */
    readonly name: string
    readonly size: number
    /** False when what the font is wasn't kept, so the interface reads it again. */
    readonly known: boolean
}

interface FontBindings {
    AddFont(name: string, data: number[], info: FontFileInfo): Promise<KeptFont>
    SetFontInfo(id: string, info: FontFileInfo): Promise<void>
    ListFonts(): Promise<KeptFont[] | null>
    ReadFont(id: string): Promise<unknown>
    RemoveFont(id: string): Promise<void>
}

const bindings = (): FontBindings | undefined => desktopApp<FontBindings>('fonts')

/** In a browser: the fonts added since the page opened. */
const inPage = new Map<string, {font: KeptFont; bytes: Uint8Array}>()

async function idOf(name: string, bytes: Uint8Array): Promise<string> {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))
    const extension = /\.(ttf|otf|ttc)$/i.exec(name)?.[0].toLowerCase() ?? '.ttf'

    return [...digest.slice(0, 16)].map((byte) => byte.toString(16).padStart(2, '0')).join('') + extension
}

export async function addFont(name: string, bytes: Uint8Array, info: FontFileInfo): Promise<KeptFont> {
    const app = bindings()

    if (app) {
        return app.AddFont(name, [...bytes], info)
    }

    const font: KeptFont = {...info, id: await idOf(name, bytes), name: name.split(/[\\/]/).pop() ?? name, size: bytes.length, known: true}

    inPage.set(font.id, {font, bytes})

    return font
}

export async function setFontInfo(id: string, info: FontFileInfo): Promise<void> {
    const app = bindings()

    if (app) {
        return app.SetFontInfo(id, info)
    }

    const kept = inPage.get(id)

    if (kept) {
        inPage.set(id, {...kept, font: {...kept.font, ...info, known: true}})
    }
}

export async function listFonts(): Promise<KeptFont[]> {
    const app = bindings()

    return app ? ((await app.ListFonts()) ?? []) : [...inPage.values()].map((kept) => kept.font)
}

export async function readFont(id: string): Promise<Uint8Array> {
    const app = bindings()

    if (app) {
        return bytesFromBinding(await app.ReadFont(id))
    }

    const kept = inPage.get(id)

    if (!kept) {
        throw new Error("That font isn't here any more.")
    }

    return kept.bytes
}

export async function removeFont(id: string): Promise<void> {
    const app = bindings()

    if (app) {
        return app.RemoveFont(id)
    }

    inPage.delete(id)
}
