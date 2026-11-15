/**
 * The CV's first page in every template, for the template picker, so people choose by
 * seeing their own CV rather than a stock picture. Made a moment after the CV stops
 * changing, one template after another.
 */

import {useEffect, useState} from 'react'
import type {Cv} from '../cv'
import {renderModel} from '../render-model'
import {CV_TEMPLATES} from '../templates/templates'
import {firstPageOnly} from '../thumbnail'

const SETTLE_MS = 600

export function useTemplatePreviews(cv: Cv): Readonly<Record<string, string>> {
    const [previews, setPreviews] = useState<Readonly<Record<string, string>>>({})

    useEffect(() => {
        let current = true
        const timer = window.setTimeout(() => {
            void (async () => {
                const {svg} = await import('../typst/engine')
                const model = renderModel(cv)

                for (const template of CV_TEMPLATES) {
                    if (!current) {
                        return
                    }

                    try {
                        const page = firstPageOnly(await svg(model, template.id))

                        if (page && current) {
                            const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(page)}`

                            setPreviews((previous) => ({...previous, [template.id]: url}))
                        }
                    } catch {
                        // A preview that can't be drawn leaves its card without a picture.
                    }
                }
            })()
        }, SETTLE_MS)

        return () => {
            current = false
            window.clearTimeout(timer)
        }
    }, [cv])

    return previews
}
