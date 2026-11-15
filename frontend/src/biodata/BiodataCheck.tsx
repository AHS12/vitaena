/**
 * The Check for a biodata: what a family looks for first, how long it runs, and whether
 * it stays readable once shared as a picture. The page count comes from the real layout.
 */

import {useEffect, useMemo, useState} from 'react'
import {CheckList} from '../cv/editor/CheckPanel'
import type {Biodata} from './biodata'
import {checkBiodata} from './check'
import {biodataRenderModel} from './render-model'

const SETTLE_MS = 700

export function BiodataCheck({biodata}: {biodata: Biodata}) {
    const [pages, setPages] = useState<number | null>(null)

    useEffect(() => {
        let current = true
        const timer = window.setTimeout(() => {
            void (async () => {
                try {
                    const {svg} = await import('../cv/typst/engine')
                    const laidOut = await svg(biodataRenderModel(biodata), biodata.design.template)

                    if (current) {
                        setPages(laidOut.match(/class="typst-page"/g)?.length ?? null)
                    }
                } catch {
                    // Without a layout the length check waits; the rest still stands.
                }
            })()
        }, SETTLE_MS)

        return () => {
            current = false
            window.clearTimeout(timer)
        }
    }, [biodata])

    const results = useMemo(() => checkBiodata(biodata, pages), [biodata, pages])

    return (
        <div className="check-panel">
            <section aria-label="Advice">
                <h3 className="design-group__title">Before you share it</h3>
                <CheckList results={results} />
            </section>
        </div>
    )
}
