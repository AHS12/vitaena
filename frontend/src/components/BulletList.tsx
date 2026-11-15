/**
 * A list of bullet points edited like a document: Enter starts the next bullet at the
 * cursor, Backspace at the start of one joins it to the one above, the arrows move
 * between them, and each can be dragged or moved with Alt+↑/↓.
 */

import {Plus} from 'lucide-react'
import {useLayoutEffect, useRef} from 'react'
import {moveItem} from '../core/list'
import {DragHandle, SortableList} from './Sortable'

/** Longer than this, a bullet is often cut short by screening software and skimmed by people. */
export const LONG_BULLET = 220

function grow(area: HTMLTextAreaElement | null) {
    if (area) {
        area.style.height = 'auto'
        area.style.height = `${area.scrollHeight}px`
    }
}

export function BulletList({label, values, onChange, placeholder}: {label: string; values: readonly string[]; onChange(values: string[]): void; placeholder?: string}) {
    const areas = useRef<(HTMLTextAreaElement | null)[]>([])
    /** Where to put the cursor after the next change: which bullet, and where in it. */
    const focusNext = useRef<{index: number; at: number} | null>(null)

    useLayoutEffect(() => {
        areas.current.forEach(grow)

        const wanted = focusNext.current

        if (wanted) {
            focusNext.current = null

            const area = areas.current[wanted.index]

            if (area) {
                area.focus()
                area.setSelectionRange(wanted.at, wanted.at)
            }
        }
    })

    const change = (next: string[], focus?: {index: number; at: number}) => {
        focusNext.current = focus ?? null
        onChange(next)
    }

    return (
        <div className="form-field">
            <span className="form-field__label">{label}</span>
            <SortableList
                items={values}
                idOf={(_, index) => `bullet-${index}`}
                labelOf={(_, index) => `bullet ${index + 1}`}
                className="bullets"
                onMove={(from, to) => change(moveItem(values, from, to), {index: to, at: areas.current[from]?.selectionStart ?? 0})}
            >
                {(value, index, handle) => (
                    <div className="bullet" data-long={value.length > LONG_BULLET || undefined}>
                        <DragHandle handle={handle} size={13} />
                        <span className="bullet__dot" aria-hidden="true">
                            •
                        </span>
                        <textarea
                            ref={(element) => {
                                areas.current[index] = element
                            }}
                            className="bullet__text"
                            rows={1}
                            value={value}
                            spellCheck
                            aria-label={`${label}, bullet ${index + 1}`}
                            placeholder={index === 0 ? placeholder : undefined}
                            onChange={(event) => onChange(values.map((item, at) => (at === index ? event.target.value.replace(/\n/g, ' ') : item)))}
                            onKeyDown={(event) => {
                                const area = event.currentTarget
                                const start = area.selectionStart
                                const end = area.selectionEnd

                                if (event.altKey) {
                                    return
                                }

                                if (event.key === 'Enter') {
                                    event.preventDefault()

                                    const next = [...values]

                                    next.splice(index, 1, value.slice(0, start), value.slice(end))
                                    change(next, {index: index + 1, at: 0})
                                } else if (event.key === 'Backspace' && start === 0 && end === 0 && index > 0) {
                                    event.preventDefault()

                                    const previous = values[index - 1]
                                    const next = [...values]

                                    next.splice(index - 1, 2, previous + value)
                                    change(next, {index: index - 1, at: previous.length})
                                } else if (event.key === 'ArrowUp' && start === 0 && index > 0) {
                                    event.preventDefault()
                                    areas.current[index - 1]?.focus()
                                } else if (event.key === 'ArrowDown' && end === value.length && index < values.length - 1) {
                                    event.preventDefault()
                                    areas.current[index + 1]?.focus()
                                }
                            }}
                        />
                    </div>
                )}
            </SortableList>
            <button type="button" className="text-button bullets__add" onClick={() => change([...values, ''], {index: values.length, at: 0})}>
                <Plus size={12} aria-hidden="true" />
                Add a bullet
            </button>
            {values.some((value) => value.length > LONG_BULLET) ? (
                <span className="form-field__warning" role="status">
                    A highlighted bullet is long. Under {LONG_BULLET} characters reads better, for people and screening software alike.
                </span>
            ) : null}
        </div>
    )
}
