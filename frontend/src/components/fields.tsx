/**
 * Form fields for editing a document: a label above, the control, then a hint or a
 * gentle warning below. Warnings never block typing; they only say what might go wrong.
 */

import {Popover} from '@heroui/react'
import {Calendar, ChevronLeft, ChevronRight} from 'lucide-react'
import {useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes} from 'react'
import {formatShortcut} from './format-keys'

function FieldFrame({label, hint, warning, htmlFor, children, className}: {label: string; hint?: ReactNode; warning?: string | null; htmlFor: string; children: ReactNode; className?: string}) {
    return (
        <div className={`form-field ${className ?? ''}`} data-warning={warning ? true : undefined}>
            <label className="form-field__label" htmlFor={htmlFor}>
                {label}
            </label>
            {children}
            {warning ? (
                <span className="form-field__warning" role="status">
                    {warning}
                </span>
            ) : hint ? (
                <span className="form-field__hint">{hint}</span>
            ) : null}
        </div>
    )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>

export function TextField({
    label,
    value,
    onChange,
    hint,
    warning,
    className,
    ...rest
}: InputProps & {label: string; value: string; onChange(value: string): void; hint?: ReactNode; warning?: string | null}) {
    const id = useId()

    return (
        <FieldFrame label={label} hint={hint} warning={warning} htmlFor={id} className={className}>
            <input id={id} className="form-field__input" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={warning ? true : undefined} {...rest} />
        </FieldFrame>
    )
}

type AreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>

/** Grows with what's written in it, so nothing scrolls inside a small box. */
export function TextArea({
    label,
    value,
    onChange,
    hint,
    warning,
    minRows = 2,
    formatting = false,
    className,
    onKeyDown,
    ...rest
}: AreaProps & {label: string; value: string; onChange(value: string): void; hint?: ReactNode; warning?: string | null; minRows?: number; /** Ctrl+B and Ctrl+I add bold and italic marks. */ formatting?: boolean}) {
    const id = useId()
    const ref = useRef<HTMLTextAreaElement>(null)

    useLayoutEffect(() => {
        const area = ref.current

        if (area) {
            area.style.height = 'auto'
            area.style.height = `${area.scrollHeight + 2}px`
        }
    }, [value])

    return (
        <FieldFrame label={label} hint={hint} warning={warning} htmlFor={id} className={className}>
            <textarea
                id={id}
                ref={ref}
                rows={minRows}
                className="form-field__input form-field__area"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (!(formatting && formatShortcut(event, onChange))) {
                        onKeyDown?.(event)
                    }
                }}
                {...rest}
            />
        </FieldFrame>
    )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const parseMonth = (value: string): {year: number; month: number} | null => {
    const match = /^(\d{4})-(\d{2})$/.exec(value)

    return match ? {year: Number(match[1]), month: Number(match[2])} : null
}

/**
 * A month and year, as "2023-01", picked from a year and a grid of months. With
 * `presentLabel`, it also offers "Present" for something still going on.
 */
export function MonthField({
    label,
    value,
    present = false,
    presentLabel,
    onChange,
}: {
    label: string
    value: string
    present?: boolean
    /** Offers this choice, such as "Present", for something not over yet. */
    presentLabel?: string
    onChange(value: string, present: boolean): void
}) {
    const id = useId()
    const [open, setOpen] = useState(false)
    const parsed = parseMonth(value)
    const [year, setYear] = useState(() => parsed?.year ?? new Date().getFullYear())
    const shown = present && presentLabel ? presentLabel : parsed ? `${MONTHS[parsed.month - 1]} ${parsed.year}` : ''

    const pick = (next: string, isPresent: boolean) => {
        onChange(next, isPresent)
        setOpen(false)
    }

    return (
        <FieldFrame label={label} htmlFor={id}>
            <Popover
                isOpen={open}
                onOpenChange={(next) => {
                    if (next) {
                        setYear(parsed?.year ?? new Date().getFullYear())
                    }

                    setOpen(next)
                }}
            >
                <Popover.Trigger>
                    <button type="button" id={id} className="form-field__input month-field__trigger" data-empty={shown ? undefined : true}>
                        <span>{shown || 'Choose…'}</span>
                        <Calendar size={13} aria-hidden="true" />
                    </button>
                </Popover.Trigger>
                <Popover.Content className="sun-panel month-panel" placement="bottom start" offset={4}>
                    <Popover.Dialog aria-label={label}>
                        <div className="month-panel__year">
                            <button type="button" className="icon-button" aria-label="Previous year" onClick={() => setYear((current) => current - 1)}>
                                <ChevronLeft size={14} aria-hidden="true" />
                            </button>
                            <span className="month-panel__year-value tabular">{year}</span>
                            <button type="button" className="icon-button" aria-label="Next year" onClick={() => setYear((current) => current + 1)}>
                                <ChevronRight size={14} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="month-panel__grid">
                            {MONTHS.map((name, index) => {
                                const code = `${year}-${String(index + 1).padStart(2, '0')}`

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        className="month-panel__month"
                                        aria-label={`${LONG_MONTHS[index]} ${year}`}
                                        aria-pressed={!present && value === code}
                                        onClick={() => pick(code, false)}
                                    >
                                        {name}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="month-panel__foot">
                            {presentLabel ? (
                                <button type="button" className="button" aria-pressed={present} onClick={() => pick('', true)}>
                                    {presentLabel}
                                </button>
                            ) : (
                                <span />
                            )}
                            <button type="button" className="text-button" onClick={() => pick('', false)}>
                                Clear
                            </button>
                        </div>
                    </Popover.Dialog>
                </Popover.Content>
            </Popover>
        </FieldFrame>
    )
}
