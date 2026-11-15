/**
 * Two panes side by side with a divider between them: drag it to resize the side pane,
 * double-click it to fold the side pane away or bring it back. With the keyboard, the
 * arrows resize and Enter folds.
 *
 * The width and whether it's folded are remembered in this window's storage. Losing
 * them only means the default width next time.
 */

import {useEffect, useRef, useState, type ReactNode} from 'react'

const STEP = 24

interface Layout {
    readonly width: number
    readonly collapsed: boolean
}

function load(key: string, fallback: number): Layout {
    try {
        const stored = JSON.parse(window.localStorage.getItem(key) ?? 'null') as Partial<Layout> | null

        return {
            width: typeof stored?.width === 'number' && stored.width > 0 ? stored.width : fallback,
            collapsed: stored?.collapsed === true,
        }
    } catch {
        return {width: fallback, collapsed: false}
    }
}

function save(key: string, layout: Layout): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(layout))
    } catch {
        // Only a convenience is lost.
    }
}

export interface SplitPaneHandle {
    readonly collapsed: boolean
    toggle(): void
}

export function SplitPane({
    storageKey,
    label,
    defaultWidth,
    minWidth,
    maxShare = 0.6,
    side,
    children,
}: {
    storageKey: string
    /** What the side pane is, for the divider's name: "Editor". */
    label: string
    defaultWidth: number
    minWidth: number
    /** The most of the window the side pane may take. */
    maxShare?: number
    side: (pane: SplitPaneHandle) => ReactNode
    children: (pane: SplitPaneHandle) => ReactNode
}) {
    const [layout, setLayout] = useState(() => load(storageKey, defaultWidth))
    const root = useRef<HTMLDivElement>(null)
    const drag = useRef<{startX: number; startWidth: number} | null>(null)

    useEffect(() => save(storageKey, layout), [storageKey, layout])

    const clamp = (width: number) => {
        const total = root.current?.getBoundingClientRect().width ?? window.innerWidth

        return Math.round(Math.min(Math.max(width, minWidth), Math.max(minWidth, total * maxShare)))
    }

    const toggle = () => setLayout((current) => ({...current, collapsed: !current.collapsed}))
    const pane: SplitPaneHandle = {collapsed: layout.collapsed, toggle}

    return (
        <div className="split-pane" ref={root}>
            {layout.collapsed ? null : (
                <div className="split-pane__side" style={{width: layout.width}}>
                    {side(pane)}
                </div>
            )}
            <div
                className="split-pane__divider"
                role="separator"
                aria-orientation="vertical"
                aria-label={`${label}: drag to resize, double-click to ${layout.collapsed ? 'show' : 'hide'}`}
                aria-valuenow={layout.collapsed ? 0 : layout.width}
                aria-valuemin={0}
                tabIndex={0}
                title={layout.collapsed ? `Show the ${label.toLowerCase()}` : 'Drag to resize. Double-click to hide.'}
                data-collapsed={layout.collapsed}
                onDoubleClick={toggle}
                onPointerDown={(event) => {
                    if (layout.collapsed || event.button !== 0) {
                        return
                    }

                    event.currentTarget.setPointerCapture(event.pointerId)
                    drag.current = {startX: event.clientX, startWidth: layout.width}
                    document.documentElement.dataset.resizing = 'true'
                }}
                onPointerMove={(event) => {
                    if (drag.current) {
                        const width = clamp(drag.current.startWidth + event.clientX - drag.current.startX)

                        setLayout((current) => (current.width === width ? current : {...current, width}))
                    }
                }}
                onPointerUp={() => {
                    drag.current = null
                    delete document.documentElement.dataset.resizing
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        toggle()
                    } else if (!layout.collapsed && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
                        event.preventDefault()
                        setLayout((current) => ({...current, width: clamp(current.width + (event.key === 'ArrowRight' ? STEP : -STEP))}))
                    }
                }}
            />
            <div className="split-pane__main">{children(pane)}</div>
        </div>
    )
}
