/**
 * The pages, as they will print. Laid out by the same Typst compile as the PDF.
 *
 * A change waits a moment before it lays out again, and a layout that's overtaken by a
 * newer one is dropped, so the preview keeps up with typing without falling behind.
 */

import {useEffect, useMemo, useRef, useState} from 'react'
import {useDocumentStore} from '../store/document-store'
import {renderModel} from './render-model'

const SETTLE_MS = 120
/** A page's width at 100%: about an A4 page at the screen's own size. */
const PAGE_REM = 42

type State =
    | {readonly kind: 'starting'}
    | {readonly kind: 'ready'; readonly pages: number; readonly ms: number}
    | {readonly kind: 'failed'; readonly message: string}

export function CvPreview() {
    const content = useDocumentStore((state) => state.content)
    const model = useMemo(() => renderModel(content), [content])
    const template = content.design.template
    const pagesRef = useRef<HTMLDivElement>(null)
    const [state, setState] = useState<State>({kind: 'starting'})
    const [zoom, setZoom] = useState(1)

    useEffect(() => {
        let current = true
        const timer = window.setTimeout(() => {
            void import('./typst/engine')
                .then(({preview}) => preview(model, template))
                .then((result) => {
                    if (!current || !result || !pagesRef.current) {
                        return
                    }

                    // The SVG is the compiler's own output, made from the CV's text by Typst:
                    // text in it is escaped, so nothing a person types can become markup.
                    pagesRef.current.innerHTML = result.svg
                    setState({kind: 'ready', pages: result.pages, ms: result.ms})
                })
                .catch((error: unknown) => {
                    if (current) {
                        setState({kind: 'failed', message: error instanceof Error ? error.message : String(error)})
                    }
                })
        }, SETTLE_MS)

        return () => {
            current = false
            window.clearTimeout(timer)
        }
    }, [model, template])

    return (
        <section className="cv-preview" aria-label="Preview" data-coach="preview">
            <div className="cv-preview__bar">
                <span className="cv-preview__facts" role="status">
                    {state.kind === 'starting' ? 'Laying out…' : state.kind === 'failed' ? "Couldn't lay out the pages" : `${state.pages} ${state.pages === 1 ? 'page' : 'pages'}`}
                </span>
                <span className="cv-preview__zoom">
                    <button type="button" className="icon-button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}>
                        −
                    </button>
                    <span className="cv-preview__zoom-value">{Math.round(zoom * 100)}%</span>
                    <button type="button" className="icon-button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2, value + 0.1))}>
                        +
                    </button>
                </span>
            </div>
            {state.kind === 'failed' ? <p className="cv-preview__problem">{state.message}</p> : null}
            <div className="cv-preview__scroll">
                <div className="cv-preview__pages" ref={pagesRef} style={{width: `${zoom * PAGE_REM}rem`}} />
            </div>
        </section>
    )
}
