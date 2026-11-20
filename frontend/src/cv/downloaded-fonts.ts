/**
 * The font packs on this computer: listed at start, downloaded when someone asks, removed
 * in Settings. The layout engine is told which are here, so it uses their fonts.
 */

import {create} from 'zustand'
import {downloadFontPack, listFontPacks, onFontPackProgress, removeFontPack, type PackState} from '../platform/font-packs'
import {languageChoice, type LanguageInfo} from '../core/labels/labels'
import {FONT_PACKS, megabytes} from './font-packs'
import {setInstalledPacks} from './typst/engine'

interface FontPacksState {
    readonly packs: readonly PackState[]
    /** How far each pack being downloaded has got, from 0 to 1. */
    readonly progress: Readonly<Record<string, number>>
    /** Why a pack's last download failed. */
    readonly failed: Readonly<Record<string, string>>
    load(): Promise<void>
    download(id: string): Promise<void>
    remove(id: string): Promise<void>
}

const without = <T>(record: Readonly<Record<string, T>>, id: string): Record<string, T> => Object.fromEntries(Object.entries(record).filter(([key]) => key !== id))

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

export const useFontPacks = create<FontPacksState>()((set, get) => ({
    packs: FONT_PACKS.map((pack) => ({id: pack.id, bytes: pack.bytes, installed: false})),
    progress: {},
    failed: {},

    load: async () => {
        const packs = await listFontPacks(FONT_PACKS).catch(() => null)

        if (packs) {
            set({packs})
        }
    },

    download: async (id) => {
        if (get().progress[id] !== undefined) {
            return
        }

        set({progress: {...get().progress, [id]: 0}, failed: without(get().failed, id)})

        try {
            await downloadFontPack(id)
            await get().load()
        } catch (error) {
            set({failed: {...get().failed, [id]: messageOf(error)}})
        } finally {
            set({progress: without(get().progress, id)})
        }
    },

    remove: async (id) => {
        await removeFontPack(id)
        await get().load()
    },
}))

/** Whether a pack is downloaded. */
export const isInstalled = (packs: readonly PackState[], id: string): boolean => packs.some((pack) => pack.id === id && pack.installed)

/** The pack a language's own fonts are in, when it isn't downloaded. */
export const packToGet = (packs: readonly PackState[], language: string) => FONT_PACKS.find((pack) => pack.id === language && !isInstalled(packs, pack.id))

/** A language as a choice, saying when choosing it means a download: "日本語 · Japanese · 17 MB download". */
export function languageChoiceWithPack(info: LanguageInfo, packs: readonly PackState[]) {
    const choice = languageChoice(info)
    const pack = packToGet(packs, info.id)

    return pack ? {...choice, label: `${choice.label} · ${megabytes(pack.bytes)} download`} : choice
}

/** Lists the packs, and keeps the layout engine told which are here. */
export function startFontPacks(): void {
    let told = ''
    const tell = (packs: readonly PackState[]) => {
        const ids = packs.filter((pack) => pack.installed).map((pack) => pack.id)

        if (ids.join() !== told) {
            told = ids.join()
            setInstalledPacks(ids)
        }
    }

    useFontPacks.subscribe((state) => tell(state.packs))
    onFontPackProgress((id, fraction) => {
        const state = useFontPacks.getState()

        if (state.progress[id] !== undefined && fraction < 1) {
            useFontPacks.setState({progress: {...state.progress, [id]: fraction}})
        }
    })
    void useFontPacks.getState().load()
}
