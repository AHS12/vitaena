/**
 * The CV's first page in every template, for the template picker, so people choose by
 * seeing their own CV rather than a stock picture.
 *
 * Kept smooth three ways. Each picture is drawn once into a small bitmap: Typst's page is
 * a few hundred kilobytes of glyph outlines, slow to paint ten times over. Pictures are
 * kept for the session, so coming back to Home or undoing an edit shows them at once.
 * And they are made only while the live preview has nothing to do, one at a time, so
 * typing never waits behind the gallery.
 */

import {useEffect, useMemo, useState} from 'react'
import {yieldIfBusy} from '../../core/yield'
import type {Cv} from '../cv'
import {renderModel} from '../render-model'
import {CV_TEMPLATES} from '../templates/templates'
import {firstPageOnly} from '../thumbnail'

/** Twice a gallery card's width, so the picture stays sharp on a high-density screen. */
const BITMAP_WIDTH = 560
/** Enough for the gallery in a few versions of a CV; older pictures are let go. */
const CACHE_MOST = 60

type Previews = Readonly<Record<string, string>>

const cache = new Map<string, string>()

const keyOf = (template: string, model: string) => `${template}\n${model}`

function remember(key: string, url: string): void {
    cache.set(key, url)

    if (cache.size > CACHE_MOST) {
        const [oldest, old] = cache.entries().next().value as [string, string]

        cache.delete(oldest)

        if (old.startsWith('blob:')) {
            URL.revokeObjectURL(old)
        }
    }
}

function cached(model: string): Previews {
    const found: Record<string, string> = {}

    for (const template of CV_TEMPLATES) {
        const url = cache.get(keyOf(template.id, model))

        if (url) {
            found[template.id] = url
        }
    }

    return found
}

/** The page as a small bitmap; the vector picture itself where there's no canvas to draw on. */
async function bitmapOf(page: string): Promise<string> {
    const vector = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(page)}`

    try {
        const image = new Image()

        image.src = vector
        await image.decode()

        const width = BITMAP_WIDTH
        const height = Math.round((width * image.naturalHeight) / (image.naturalWidth || 1))
        const canvas = document.createElement('canvas')

        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')

        if (!context || !height) {
            return vector
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92))

        return blob ? URL.createObjectURL(blob) : vector
    } catch {
        return vector
    }
}

/**
 * Pictures of `cv` in every template, by id. While new ones are made, the last ones stay
 * up; a template with none yet has no entry, and its card shows a placeholder.
 */
export function useTemplatePreviews(cv: Cv, settleMs = 600): Previews {
    const model = useMemo(() => JSON.stringify(renderModel(cv)), [cv])
    const [previews, setPreviews] = useState<Previews>(() => cached(model))

    useEffect(() => {
        let current = true
        const ready = cached(model)
        const missing = CV_TEMPLATES.filter((template) => !ready[template.id])

        setPreviews((previous) => ({...previous, ...ready}))

        if (missing.length === 0) {
            return
        }

        const timer = window.setTimeout(() => {
            void (async () => {
                const engine = await import('../typst/engine')
                const parsed = JSON.parse(model) as ReturnType<typeof renderModel>

                for (const template of missing) {
                    try {
                        await engine.whenIdle()

                        if (!current) {
                            return
                        }

                        const page = firstPageOnly(await engine.svg(parsed, template.id))

                        if (!page || !current) {
                            continue
                        }

                        const url = await bitmapOf(page)

                        remember(keyOf(template.id, model), url)

                        if (current) {
                            setPreviews((previous) => ({...previous, [template.id]: url}))
                        }
                    } catch {
                        // A preview that can't be drawn leaves its card with its placeholder.
                    }

                    // Give way between pictures, so the page keeps drawing. Not a frame callback:
                    // those stop in a window that's behind others, and the gallery would stall.
                    await yieldIfBusy()
                }
            })()
        }, settleMs)

        return () => {
            current = false
            window.clearTimeout(timer)
        }
    }, [model, settleMs])

    return previews
}
