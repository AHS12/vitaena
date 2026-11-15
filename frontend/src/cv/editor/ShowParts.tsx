/**
 * Which parts of something show on the page. Turning one off keeps what was written, so
 * it can come back, but leaves it off the page and out of every export.
 */

import {Check} from 'lucide-react'

export function ShowParts<P extends string>({parts, hidden, onToggle}: {parts: readonly {readonly id: P; readonly label: string}[]; hidden: readonly P[]; onToggle(part: P): void}) {
    return (
        <div className="show-parts" role="group" aria-label="Show on the page">
            <span className="show-parts__label">Show on the page</span>
            {parts.map((part) => {
                const shown = !hidden.includes(part.id)

                return (
                    <button key={part.id} type="button" className="show-part" aria-pressed={shown} onClick={() => onToggle(part.id)}>
                        {shown ? <Check size={11} aria-hidden="true" /> : null}
                        {part.label}
                    </button>
                )
            })}
        </div>
    )
}
