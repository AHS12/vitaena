/**
 * Font packs, from the frontend's side. In the app Go downloads them from GitHub, checks
 * them and serves their files at /font-packs/. In a browser, where there's no Go, the
 * development server serves the files from the npm packages, and a download is only
 * pretended, so the interface can still be tried.
 */

import {desktopApp, desktopRuntime} from './shell'

/** Matches ProgressEvent in backend/fontpacks. */
const PROGRESS_EVENT = 'fonts:pack-progress'

export interface PackState {
    readonly id: string
    readonly bytes: number
    readonly installed: boolean
}

interface PackBindings {
    ListFontPacks(): Promise<PackState[] | null>
    DownloadFontPack(id: string): Promise<void>
    RemoveFontPack(id: string): Promise<void>
}

const bindings = (): PackBindings | undefined => desktopApp<PackBindings>('fontPacks')

/** In a browser: the packs "downloaded" since the page opened. */
const inPage = new Set<string>()
const pageListeners = new Set<(id: string, fraction: number) => void>()

export async function listFontPacks(all: readonly {readonly id: string; readonly bytes: number}[]): Promise<PackState[]> {
    const app = bindings()

    return app ? ((await app.ListFontPacks()) ?? []) : all.map((pack) => ({id: pack.id, bytes: pack.bytes, installed: inPage.has(pack.id)}))
}

export async function downloadFontPack(id: string): Promise<void> {
    const app = bindings()

    if (app) {
        return app.DownloadFontPack(id)
    }

    for (const fraction of [0.2, 0.5, 0.8, 1]) {
        await new Promise((resolve) => setTimeout(resolve, 250))
        pageListeners.forEach((listener) => listener(id, fraction))
    }

    inPage.add(id)
}

export async function removeFontPack(id: string): Promise<void> {
    const app = bindings()

    if (app) {
        return app.RemoveFontPack(id)
    }

    inPage.delete(id)
}

/** Calls back as a pack's download arrives, with a fraction from 0 to 1. */
export function onFontPackProgress(handler: (id: string, fraction: number) => void): () => void {
    const runtime = desktopRuntime()

    if (runtime && bindings()) {
        return runtime.EventsOn(PROGRESS_EVENT, (progress: {id: string; fraction: number}) => handler(progress.id, progress.fraction))
    }

    pageListeners.add(handler)
    return () => pageListeners.delete(handler)
}
