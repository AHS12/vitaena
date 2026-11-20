import {beforeEach, describe, expect, it, vi} from 'vitest'
import type {FontFileInfo} from './typst/layout'

const LATIN_AND_BENGALI = [32, 95, 2305, 128]

const files = vi.hoisted(() => ({picked: null as {path: string; bytes: Uint8Array} | null, info: [] as FontFileInfo[], kept: [] as unknown[]}))

vi.mock('../platform/desktop', () => ({openFontFile: async () => (files.picked ? {...files.picked, text: ''} : null)}))
vi.mock('./typst/engine', () => ({fontInfo: async () => files.info, setFontProvider: () => undefined}))
vi.mock('../platform/fonts', () => ({
    listFonts: async () => files.kept,
    addFont: async (name: string, bytes: Uint8Array, info: {family: string; style: string; weight: number; scripts: string[]}) => {
        const font = {...info, id: `${files.kept.length}0123456789abcdef0123456789abcde.ttf`, name, size: bytes.length, known: true}

        files.kept.push(font)

        return font
    },
    removeFont: async (id: string) => {
        files.kept = files.kept.filter((font) => (font as {id: string}).id !== id)
    },
    readFont: async () => new Uint8Array(),
    setFontInfo: async () => undefined,
}))

// The test setup has loaded every feature, and this module with them, before the stand-ins above.
vi.resetModules()

const {addedFamilies, missingFontResults, useAddedFonts} = await import('./added-fonts')

beforeEach(() => {
    files.kept = []
    files.picked = null
    useAddedFonts.setState({fonts: [], loaded: false, message: null})
})

describe('adding a font', () => {
    it('keeps a Unicode Bangla font and says what it found', async () => {
        files.picked = {path: 'C:\\fonts\\kalpurush.ttf', bytes: new Uint8Array([1, 2, 3])}
        files.info = [{family: 'Kalpurush', style: 'normal', weight: 400, flags: '', coverage: LATIN_AND_BENGALI}]

        await useAddedFonts.getState().add()

        const state = useAddedFonts.getState()

        expect(addedFamilies(state.fonts).map((family) => [family.id, family.scripts])).toEqual([['custom:Kalpurush', ['latin', 'bengali']]])
        expect(state.message).toEqual({ok: true, text: expect.stringContaining('Kalpurush: regular. Has letters for English and Bangla.')})
    })

    it('refuses a Bijoy font, and says what to use', async () => {
        files.picked = {path: 'SutonnyMJ.ttf', bytes: new Uint8Array([1])}
        files.info = [{family: 'SutonnyMJ', style: 'normal', weight: 400, flags: '', coverage: [32, 95]}]

        await useAddedFonts.getState().add()

        expect(useAddedFonts.getState().fonts).toEqual([])
        expect(useAddedFonts.getState().message).toEqual({ok: false, text: expect.stringContaining('is a Bijoy font')})
    })

    it("refuses a file the layout can't read as a font", async () => {
        files.picked = {path: 'notes.ttf', bytes: new Uint8Array([1])}
        files.info = []

        await useAddedFonts.getState().add()

        expect(useAddedFonts.getState().fonts).toEqual([])
        expect(useAddedFonts.getState().message?.ok).toBe(false)
    })

    it('does nothing when no file is picked', async () => {
        await useAddedFonts.getState().add()

        expect(useAddedFonts.getState().message).toBeNull()
    })
})

describe('a document naming a font this computer has not', () => {
    it('is told in Check, and a font that is here is not mentioned', () => {
        const kept = [{id: 'x.ttf', name: 'k.ttf', size: 1, known: true, family: 'Kalpurush', style: 'normal', weight: 400, scripts: ['bengali']}]

        expect(missingFontResults({font: 'custom:Merriweather', scriptFont: 'custom:Kalpurush'}, kept).map((result) => result.title)).toEqual(["Merriweather isn't added on this computer"])
        expect(missingFontResults({font: 'inter', scriptFont: ''}, [])).toEqual([])
    })
})
