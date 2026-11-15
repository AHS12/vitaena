/**
 * A few choices side by side, one of them on: a radio group drawn as joined buttons.
 * The arrows move between choices, as in any radio group.
 */

import type {KeyboardEvent} from 'react'

export function Segmented<T extends string | number>({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: T
    options: readonly {readonly value: T; readonly label: string}[]
    onChange(value: T): void
}) {
    const index = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    )

    const onKeyDown = (event: KeyboardEvent) => {
        const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0

        if (step !== 0) {
            event.preventDefault()

            const next = options[(index + step + options.length) % options.length]

            onChange(next.value)
            ;(event.currentTarget.querySelectorAll('button')[options.indexOf(next)] as HTMLButtonElement | undefined)?.focus()
        }
    }

    return (
        <div className="segmented" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
            {options.map((option, at) => (
                <button key={String(option.value)} type="button" role="radio" aria-checked={at === index} tabIndex={at === index ? 0 : -1} className="segmented__option" onClick={() => onChange(option.value)}>
                    {option.label}
                </button>
            ))}
        </div>
    )
}
