/**
 * A list of short words as chips: type and press Enter or a comma to add, × or
 * Backspace in an empty box to remove, drag a chip to reorder. Pasting a list split by
 * commas adds each.
 */

import {X} from 'lucide-react'
import {useId, useState} from 'react'
import {SortableList} from './Sortable'

const split = (text: string): string[] =>
    text
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)

export function TagInput({label, values, onChange, placeholder}: {label: string; values: readonly string[]; onChange(values: string[]): void; placeholder?: string}) {
    const id = useId()
    const [draft, setDraft] = useState('')

    const add = (text: string) => {
        const fresh = split(text).filter((item) => !values.some((value) => value.toLowerCase() === item.toLowerCase()))

        if (fresh.length > 0) {
            onChange([...values, ...fresh])
        }

        setDraft('')
    }

    return (
        <div className="form-field">
            <label className="form-field__label" htmlFor={id}>
                {label}
            </label>
            <div className="tag-input" onClick={(event) => (event.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}>
                <SortableList
                    items={values}
                    idOf={(value, index) => `${index}:${value}`}
                    labelOf={(value) => value}
                    layout="wrap"
                    className="tag-input__chips"
                    onMove={(from, to) => {
                        const next = [...values]
                        const [moved] = next.splice(from, 1)

                        next.splice(to, 0, moved)
                        onChange(next)
                    }}
                >
                    {(value, index, handle) => (
                        <span className="tag-chip" {...handle} ref={handle.ref}>
                            {value}
                            <button
                                type="button"
                                className="tag-chip__remove"
                                aria-label={`Remove ${value}`}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => onChange(values.filter((_, at) => at !== index))}
                            >
                                <X size={11} aria-hidden="true" />
                            </button>
                        </span>
                    )}
                </SortableList>
                <input
                    id={id}
                    className="tag-input__input"
                    value={draft}
                    placeholder={values.length === 0 ? placeholder : 'Add…'}
                    onChange={(event) => {
                        const text = event.target.value

                        if (text.includes(',')) {
                            add(text)
                        } else {
                            setDraft(text)
                        }
                    }}
                    onPaste={(event) => {
                        const text = event.clipboardData.getData('text')

                        if (/[,\n]/.test(text)) {
                            event.preventDefault()
                            add(draft + text)
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            add(draft)
                        } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
                            onChange(values.slice(0, -1))
                        }
                    }}
                    onBlur={() => add(draft)}
                />
            </div>
        </div>
    )
}
