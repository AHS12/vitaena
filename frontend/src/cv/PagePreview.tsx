/**
 * The pages, as they will print. Laid out by the same Typst compile as the PDF.
 *
 * A change waits a moment before it lays out again, and a layout that's overtaken by a
 * newer one is dropped, so the preview keeps up with typing without falling behind.
 *
 * Pages fit the pane's width by default, up to a comfortable reading size; the zoom
 * buttons switch to a fixed size.
 */

import {Minus, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {Segmented} from '../components/Segmented'
import type {SplitPaneHandle} from '../components/SplitPane'
import type {PageModel} from './typst/images'

const SETTLE_MS = 120
/** A page's width at 100%, in CSS pixels: an A4 page at about its real size. */
const PAGE_PX = 794
/** Fit never makes a page bigger than this, so a wide window doesn't blow it up. */
const FIT_MAX = 1.25
const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2]
/** Room either side of a fitted page, a scrollbar's width included. */
const GUTTER = 48

type State =
    | {readonly kind: 'starting'}
    | {readonly kind: 'ready'; readonly pages: number}
    | {readonly kind: 'failed'; readonly message: string}

/** ATS mode, for templates with two columns: whether it's on, and how to turn it on or off. */
export interface AtsModeControl {
    readonly available: boolean
    readonly on: boolean
    set(on: boolean): void
}

/** What the pages say before anything is written, and how to see a finished one. */
export interface EmptyPages {
    readonly title: string
    readonly text: string
    onExample(): void
}

/**
 * Any document's pages: its render model laid out in its template. `empty` is shown over
 * the pages while nothing the person wrote shows on them.
 */
export function PagePreview({
    left,
    right,
    model,
    template,
    paper,
    empty,
    ats,
}: {
    left: SplitPaneHandle
    right: SplitPaneHandle
    model: PageModel
    template: string
    paper: string
    empty: EmptyPages | null
    ats?: AtsModeControl
}) {
    const pagesRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [state, setState] = useState<State>({kind: 'starting'})
    const [zoom, setZoom] = useState<number | 'fit'>('fit')
    const [available, setAvailable] = useState(PAGE_PX)

    useEffect(() => {
        const scroll = scrollRef.current

        // Without one, as in tests, pages keep their 100% width.
        if (!scroll || typeof ResizeObserver === 'undefined') {
            return
        }

        // The width outside the scrollbar, not inside it: fitting to the inside shrinks the
        // page when a scrollbar appears, which can make it fit again and the scrollbar go,
        // over and over, wherever scrollbars take room, as on a Mac with a mouse.
        const measure = () => {
            const style = getComputedStyle(scroll)
            const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)

            setAvailable(Math.max(200, scroll.offsetWidth - padding - GUTTER))
        }
        const observer = new ResizeObserver(measure)

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

                    // The SVG is the compiler's own output, made from the document's text by Typst:
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
                    aria-label={left.collapsed ? 'Show the editor' : 'Hide the editor'}
                    title={left.collapsed ? 'Show the editor' : 'Hide the editor, to see the pages larger'}
                    onClick={left.toggle}
                >
                    {left.collapsed ? <PanelLeftOpen size={15} aria-hidden="true" /> : <PanelLeftClose size={15} aria-hidden="true" />}
                </button>
                <span className="cv-preview__facts" role="status">
                    {state.kind === 'starting' ? 'Laying out…' : state.kind === 'failed' ? "Couldn't lay out the pages" : `${state.pages} ${state.pages === 1 ? 'page' : 'pages'}`}
                    {state.kind === 'ready' ? ` · ${paper === 'a4' ? 'A4' : 'US Letter'}` : null}
                </span>
                {ats?.available ? (
                    <span className="cv-preview__ats" title="One column is read in order by every screening system. Use it when you apply through an online form.">
                        <Segmented
                            label="Layout"
                            value={ats.on ? 'one' : 'two'}
                            options={[
                                {value: 'two', label: 'Two columns'},
                                {value: 'one', label: 'One column (ATS)'},
                            ]}
                            onChange={(value) => ats.set(value === 'one')}
                        />
                    </span>
                ) : null}
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
                <button
                    type="button"
                    className="icon-button"
                    aria-label={right.collapsed ? 'Show the design' : 'Hide the design'}
                    title={right.collapsed ? 'Show the design: template, colour, font' : 'Hide the design, to see the pages larger'}
                    onClick={right.toggle}
                >
                    {right.collapsed ? <PanelRightOpen size={15} aria-hidden="true" /> : <PanelRightClose size={15} aria-hidden="true" />}
                </button>
            </div>
            {state.kind === 'failed' ? <p className="cv-preview__problem">{state.message}</p> : null}
            <div className="cv-preview__scroll" ref={scrollRef}>
                <div className="cv-preview__stage" style={{width: PAGE_PX * scale}}>
                    <div className="cv-preview__pages" ref={pagesRef} />
                    {empty ? (
                        <div className="cv-preview__empty">
                            <p className="cv-preview__empty-title">{empty.title}</p>
                            <p>{empty.text}</p>
                            <button type="button" className="button" onClick={empty.onExample}>
                                Fill with an example
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    )
}
