/**
 * The pages, as they will print. Laid out by the same Typst compile as the PDF.
 *
 * A change waits a moment before it lays out again, and a layout that's overtaken by a
 * newer one is dropped, so the preview keeps up with typing without falling behind.
 *
 * Pages fit the pane's width by default, up to a comfortable reading size; the zoom
 * buttons switch to a fixed size.
 */

import {Minus, PanelLeftClose, PanelLeftOpen, Plus} from 'lucide-react'
import {useEffect, useMemo, useRef, useState} from 'react'
import type {SplitPaneHandle} from '../components/SplitPane'
import {useDocumentStore} from '../store/document-store'
import type {Cv} from './cv'
import {renderModel} from './render-model'
import {sampleCv} from './sample'

const SETTLE_MS = 120
/** A page's width at 100%, in CSS pixels: an A4 page at about its real size. */
const PAGE_PX = 794
/** Fit never makes a page bigger than this, so a wide window doesn't blow it up. */
const FIT_MAX = 1.25
const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2]
const GUTTER = 48

type State =
    | {readonly kind: 'starting'}
    | {readonly kind: 'ready'; readonly pages: number}
    | {readonly kind: 'failed'; readonly message: string}

export function CvPreview({pane, onExample}: {pane: SplitPaneHandle; onExample(cv: Cv): void}) {
    const content = useDocumentStore((state) => state.content)
    const model = useMemo(() => renderModel(content), [content])
    const template = content.design.template
    const pagesRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [state, setState] = useState<State>({kind: 'starting'})
    const [zoom, setZoom] = useState<number | 'fit'>('fit')
    const [available, setAvailable] = useState(PAGE_PX)
    const empty = !model.name && !model.headline && model.contact.length === 0 && model.sections.length === 0

    useEffect(() => {
        const scroll = scrollRef.current

        // Without one, as in tests, pages keep their 100% width.
        if (!scroll || typeof ResizeObserver === 'undefined') {
            return
        }

        const observer = new ResizeObserver(([entry]) => setAvailable(Math.max(200, entry.contentRect.width - GUTTER)))

        observer.observe(scroll)
        return () => observer.disconnect()
    }, [])

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
                    setState({kind: 'ready', pages: result.pages})
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

    const fitScale = Math.min(FIT_MAX, available / PAGE_PX)
    const scale = zoom === 'fit' ? fitScale : zoom

    const step = (direction: 1 | -1) => {
        const next = direction === 1 ? ZOOMS.find((value) => value > scale + 0.001) : [...ZOOMS].reverse().find((value) => value < scale - 0.001)

        setZoom(next ?? scale)
    }

    return (
        <section className="cv-preview" aria-label="Preview" data-coach="preview">
            <div className="cv-preview__bar">
                <button
                    type="button"
                    className="icon-button"
                    aria-label={pane.collapsed ? 'Show the editor' : 'Hide the editor'}
                    title={pane.collapsed ? 'Show the editor' : 'Hide the editor, to see the pages larger'}
                    onClick={pane.toggle}
                >
                    {pane.collapsed ? <PanelLeftOpen size={15} aria-hidden="true" /> : <PanelLeftClose size={15} aria-hidden="true" />}
                </button>
                <span className="cv-preview__facts" role="status">
                    {state.kind === 'starting' ? 'Laying out…' : state.kind === 'failed' ? "Couldn't lay out the pages" : `${state.pages} ${state.pages === 1 ? 'page' : 'pages'}`}
                    {state.kind === 'ready' ? ` · ${content.design.paper === 'a4' ? 'A4' : 'US Letter'}` : null}
                </span>
                <span className="cv-preview__zoom">
                    <button type="button" className="icon-button" aria-label="Zoom out" onClick={() => step(-1)}>
                        <Minus size={13} aria-hidden="true" />
                    </button>
                    <button type="button" className="text-button cv-preview__zoom-value tabular" aria-pressed={zoom === 'fit'} title="Fit the page to the pane" onClick={() => setZoom('fit')}>
                        {zoom === 'fit' ? 'Fit' : `${Math.round(scale * 100)}%`}
                    </button>
                    <button type="button" className="icon-button" aria-label="Zoom in" onClick={() => step(1)}>
                        <Plus size={13} aria-hidden="true" />
                    </button>
                </span>
            </div>
            {state.kind === 'failed' ? <p className="cv-preview__problem">{state.message}</p> : null}
            <div className="cv-preview__scroll" ref={scrollRef}>
                <div className="cv-preview__stage" style={{width: PAGE_PX * scale}}>
                    <div className="cv-preview__pages" ref={pagesRef} />
                    {empty ? (
                        <div className="cv-preview__empty">
                            <p className="cv-preview__empty-title">Your CV appears here as you type</p>
                            <p>Start with your name on the left, or look at a finished one first.</p>
                            <button type="button" className="button" onClick={() => onExample(sampleCv())}>
                                Fill with an example
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    )
}
