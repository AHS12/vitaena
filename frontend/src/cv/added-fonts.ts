/**
 * The fonts the person added: listed once at start, added from a file, removed in
 * Settings. Each is read by the layout engine when it's added, so the app can say what
 * it found, and refuse what won't work, before anything is kept. The layout engine is
 * given a font's file the first time a page names its family.
 */

import {create} from 'zustand'
import {addedMessage, isBijoy, scriptsOf, type FontFace, type FontScript} from '../core/fonts/font-info'
import {openFontFile} from '../platform/desktop'
import {addFont, listFonts, readFont, removeFont, setFontInfo, type KeptFont} from '../platform/fonts'
import type {CheckResult} from './ats-check'
import {addedFamily, addedFontId, isAddedFont} from './fonts'
import {fontInfo, setFontProvider} from './typst/engine'

/** One family the person added, with every file of it. */
export interface AddedFamily {
    readonly family: string
    /** What a design names it by: "custom:Kalpurush". */
    readonly id: string
    readonly files: readonly KeptFont[]
    readonly scripts: readonly FontScript[]
}

interface AddedFontsState {
    readonly fonts: readonly KeptFont[]
    readonly loaded: boolean
    /** What adding the last font found, or why it wasn't added. */
    readonly message: {readonly text: string; readonly ok: boolean} | null
    load(): Promise<void>
    add(): Promise<void>
    remove(id: string): Promise<void>
    dismiss(): void
}

const infoOf = (faces: readonly FontFace[]) => ({
    family: faces[0].family,
    style: faces[0].style,
    weight: faces[0].weight,
    scripts: [...new Set(faces.flatMap((face) => scriptsOf(face.coverage)))],
})

let loading: Promise<void> | null = null

export const useAddedFonts = create<AddedFontsState>()((set, get) => ({
    fonts: [],
    loaded: false,
    message: null,

    load: () => {
        loading ??= (async () => {
            const fonts = await listFonts().catch(() => [])
            // A font whose info went missing, as from an older backup, is read again.
            const known = await Promise.all(
                fonts.map(async (font) => {
                    if (font.known) {
                        return font
                    }

                    try {
                        const info = infoOf(await fontInfo(await readFont(font.id)))

                        await setFontInfo(font.id, info)

                        return {...font, ...info, known: true}
                    } catch {
                        return font
                    }
                }),
            )

            set({fonts: known.filter((font) => font.known && font.family), loaded: true})
        })().finally(() => {
            loading = null
        })

        return loading
    },

    add: async () => {
        const file = await openFontFile()

        if (!file) {
            return
        }

        const name = file.path.split(/[\\/]/).pop() ?? file.path

        try {
            const faces = await fontInfo(file.bytes)

            if (faces.length === 0 || !faces[0].family.trim()) {
                set({message: {ok: false, text: `${name} isn't a font Vitaena can read. Add a .ttf or .otf file.`}})
                return
            }

            if (isBijoy(faces[0], name)) {
                set({
                    message: {
                        ok: false,
                        text: `${faces[0].family} is a Bijoy font, which stores Bangla as English letters. Text in it can't be searched or read by screening software, so it isn't added. Use a Unicode Bangla font, such as Kalpurush, SolaimanLipi or Nikosh.`,
                    },
                })
                return
            }

            await addFont(name, file.bytes, infoOf(faces))
            loading = null
            set({loaded: false})
            await get().load()

            const family = faces[0].family
            const files = get().fonts.filter((font) => font.family === family)

            // Every file of the family so far says which faces there are; the one just read says if it's variable.
            const known = [...files.map((font) => ({style: font.style, weight: font.weight, flags: ''})), ...faces.filter((face) => face.family === family)]

            set({message: {ok: true, text: addedMessage(family, known, familyScripts(files))}})
        } catch (error) {
            set({message: {ok: false, text: `Couldn't add ${name}: ${error instanceof Error ? error.message : String(error)}`}})
        }
    },

    remove: async (id) => {
        await removeFont(id)
        set({fonts: get().fonts.filter((font) => font.id !== id)})
    },

    dismiss: () => set({message: null}),
}))

const familyScripts = (files: readonly KeptFont[]): FontScript[] => [...new Set(files.flatMap((font) => font.scripts as FontScript[]))]

/** The added fonts as families, by name. */
export function addedFamilies(fonts: readonly KeptFont[]): AddedFamily[] {
    const byFamily = new Map<string, KeptFont[]>()

    for (const font of fonts) {
        byFamily.set(font.family, [...(byFamily.get(font.family) ?? []), font])
    }

    return [...byFamily]
        .map(([family, files]) => ({family, id: addedFontId(family), files, scripts: familyScripts(files)}))
        .sort((a, b) => a.family.localeCompare(b.family))
}

/** Each added font file's bytes, read once. */
const bytes = new Map<string, Promise<Uint8Array>>()

function bytesOf(id: string): Promise<Uint8Array> {
    let read = bytes.get(id)

    if (!read) {
        read = readFont(id)
        read.catch(() => bytes.delete(id))
        bytes.set(id, read)
    }

    return read
}

/** Lists the added fonts, and gives the layout engine the files a page names. */
export function startAddedFonts(): void {
    void useAddedFonts.getState().load()

    setFontProvider(async (families) => {
        const state = useAddedFonts.getState()

        if (!state.loaded) {
            await state.load()
        }

        const wanted = useAddedFonts.getState().fonts.filter((font) => families.includes(font.family))

        return Promise.all(wanted.map(async (font) => ({id: font.id, family: font.family, bytes: await bytesOf(font.id)})))
    })
}

const previewed = new Set<string>()

/** The family name the interface draws an added font's name in, once its file is loaded. */
export const previewFamily = (font: Pick<KeptFont, 'id'>): string => `vitaena-added-${font.id.replace(/\W/g, '')}`

/** Loads an added font into the interface, so its name can be shown in it. */
export function previewFont(font: KeptFont): void {
    if (previewed.has(font.id) || typeof FontFace === 'undefined') {
        return
    }

    previewed.add(font.id)

    void bytesOf(font.id)
        .then((data) => new FontFace(previewFamily(font), new Uint8Array(data)).load())
        .then((face) => document.fonts.add(face))
        .catch(() => undefined)
}

/**
 * Check's note on a font the document names that isn't added on this computer, as on a
 * document made on another one, or none.
 */
export function missingFontResults(design: {readonly font: string; readonly scriptFont: string}, fonts: readonly KeptFont[]): CheckResult[] {
    const have = new Set(fonts.map((font) => font.family))
    const missing = [design.font, design.scriptFont].filter(isAddedFont).map(addedFamily).filter((family) => !have.has(family))

    return missing.map((family) => ({
        id: `font-${family}`,
        level: 'warning',
        title: `${family} isn't added on this computer`,
        detail: `A bundled font is used in its place, so the pages look different from where the document was made. Add ${family} in Style, Font, to bring its look back.`,
    }))
}
