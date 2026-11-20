/**
 * The fonts that don't come with the app: those for Chinese, Japanese and Korean, which
 * would make it several times larger for everyone. Each language's are one pack, which
 * the app downloads from its GitHub release when someone needs it, checks, and serves
 * from /font-packs/. backend/fontpacks/packs.json lists them, with each file's checksum.
 */

import manifest from '../../../backend/fontpacks/packs.json'
import {languageInfo} from '../core/labels/labels'
import {SCRIPT_FONTS, scriptsIn, type CvFont} from './fonts'

export interface FontPack {
    /** The document language it's for, such as "ja". */
    readonly id: string
    /** The download's size, in bytes. */
    readonly bytes: number
    /** Its fonts' files, as npm package paths, as fonts.ts names them. */
    readonly files: readonly string[]
}

export const FONT_PACKS: readonly FontPack[] = manifest.packs.map((pack) => ({id: pack.id, bytes: pack.bytes, files: pack.fonts.map((font) => font.path)}))

/** Matches RoutePrefix in backend/fontpacks. */
export const PACK_ROUTE = '/font-packs/'

/** The pack a font file is in, if it isn't bundled. */
export const packOfFile = (file: string): FontPack | undefined => FONT_PACKS.find((pack) => pack.files.includes(file))

/** The pack a font is in, if it isn't bundled. */
export const packOfFont = (font: CvFont): FontPack | undefined => (font.files.length > 0 ? packOfFile(font.files[0]) : undefined)

/** Where the interface reads a pack's font file once it's downloaded. */
export const packFileUrl = (pack: FontPack, file: string): string => PACK_ROUTE + pack.id + '/' + file.split('/').pop()

/**
 * The packs a page needs, given its render model as JSON and the families it lists in
 * the order Typst looks in them: for each script on the page, the pack of the first
 * family for it. One further down only fills in a rare letter, so isn't asked for.
 */
export function packsWanted(json: string, families: readonly string[]): FontPack[] {
    const wanted = scriptsIn(json).flatMap((script) => {
        const first = families.map((family) => SCRIPT_FONTS.find((font) => font.script === script && font.family === family)).find((font) => font !== undefined)
        const pack = first ? packOfFont(first) : undefined

        return pack ? [pack] : []
    })

    return [...new Set(wanted)]
}

/** A size in megabytes, as a person reads it: "17 MB". */
export const megabytes = (bytes: number): string => `${Math.max(1, Math.round(bytes / 1048576))} MB`

/** "Japanese", or "simplified Chinese": the language a pack is for, as said in a sentence. */
export const packLanguage = (id: string): string => languageInfo(id).name.replace(/^(\w+), (\w+)$/, '$2 $1')
