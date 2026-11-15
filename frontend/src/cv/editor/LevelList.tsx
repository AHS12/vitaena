/**
 * A list whose items each have a level, such as languages: one row per item with its
 * name, five dots to pick how well, and an optional word such as "Native", which is
 * what a screening system reads, since it can't read the dots.
 */

import {Plus, Trash2} from 'lucide-react'
import {useState} from 'react'
import {DragHandle, SortableList} from '../../components/Sortable'
import {moveItem} from '../../core/list'
import {joinItem, LEVEL_NAMES, levelOfWords, splitItem} from '../levels'

export interface LevelListChange {
    readonly items: string[]
    readonly levels: number[]
}

const shown = (level: number) => (Number.isInteger(level) ? String(level) : level.toFixed(1))

/**
 * Five dots. A click on a dot's left half picks half a step, so 4.5 is the fifth dot's
 * left half; clicking the level it already has clears it. Arrow keys move by half steps.
 */
function LevelPicker({name, value, onChange}: {name: string; value: number; onChange(level: number): void}) {
    const step = (by: number) => onChange(Math.min(5, Math.max(0, value + by)))

    return (
        <span
            className="level-picker"
            role="radiogroup"
            aria-label={`Level of ${name || 'this item'}: ${value ? `${shown(value)} of 5` : 'none'}`}
            onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    step(0.5)
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    step(-0.5)
                }
            }}
        >
            {[1, 2, 3, 4, 5].map((level) => (
                <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={Math.ceil(value) === level}
                    aria-label={`${level} of 5, ${LEVEL_NAMES[level]}`}
                    title={`${level} of 5 · ${LEVEL_NAMES[level]}. Click the left half for ${level - 0.5}.`}
                    className="level-picker__dot"
                    data-fill={value >= level ? 'full' : value >= level - 0.5 ? 'half' : undefined}
                    onClick={(event) => {
                        const box = event.currentTarget.getBoundingClientRect()
                        // A keyboard press has no position, and picks the whole dot.
                        const half = event.detail > 0 && box.width > 0 && event.clientX < box.left + box.width / 2
                        const picked = half ? level - 0.5 : level

                        onChange(value === picked ? 0 : picked)
                    }}
                />
            ))}
        </span>
    )
}

/**
 * The item with a new level. A word the app filled in, or none, follows the level, so
 * there's always a word a screening system can read; a word typed by hand stays.
 */
function withLevel(item: string, level: number): string {
    const {name, note} = splitItem(item)

    return note === '' || LEVEL_NAMES.includes(note) ? joinItem(name, LEVEL_NAMES[Math.floor(level)] ?? '') : item
}

export function LevelList({
    id,
    items,
    levels,
    onAct,
    onType,
    onCommit,
}: {
    /** The group's id, so each row's id stays the same while its name is typed. */
    id: string
    items: readonly string[]
    levels: readonly number[]
    /** A change worth its own undo step: a level, an item added, moved or removed. */
    onAct(what: string, change: LevelListChange): void
    /** Typing, which joins into one undo step until the field is left. */
    onType(change: LevelListChange): void
    onCommit(): void
}) {
    const [draft, setDraft] = useState('')
    const levelAt = (index: number) => levels[index] ?? 0
    const all = () => ({items: [...items], levels: items.map((_, index) => levelAt(index))})

    const setRow = (index: number, text: string, level: number) => {
        const next = all()

        next.items[index] = text
        next.levels[index] = level
        return next
    }

    const add = () => {
        const {name, note} = splitItem(draft)

        if (!name) {
            return
        }

        const next = all()

        onAct('add item', {items: [...next.items, joinItem(name, note)], levels: [...next.levels, levelOfWords(note)]})
        setDraft('')
    }

    return (
        <div className="level-list" onBlur={onCommit}>
            <SortableList
                items={items}
                idOf={(_, index) => `${id}:${index}`}
                labelOf={(item) => splitItem(item).name || 'item'}
                className="level-list__rows"
                onMove={(from, to) => {
                    const next = all()

                    onAct('move item', {items: moveItem(next.items, from, to), levels: moveItem(next.levels, from, to)})
                }}
            >
                {(item, index, handle) => {
                    const {name, note} = splitItem(item)
                    const level = levelAt(index)

                    return (
                        <div className="level-row">
                            <DragHandle handle={handle} size={13} />
                            <input
                                className="form-field__input level-row__name"
                                aria-label="Name"
                                value={name}
                                placeholder="Name"
                                onChange={(event) => onType(setRow(index, joinItem(event.target.value, note), level))}
                            />
                            <button
                                type="button"
                                className="icon-button"
                                aria-label={`Remove ${name || 'this item'}`}
                                onClick={() => {
                                    const next = all()

                                    onAct('remove item', {items: next.items.filter((_, at) => at !== index), levels: next.levels.filter((_, at) => at !== index)})
                                }}
                            >
                                <Trash2 size={13} aria-hidden="true" />
                            </button>
                            <div className="level-row__level">
                                <LevelPicker name={name} value={level} onChange={(next) => onAct('level', setRow(index, withLevel(item, next), next))} />
                                <input
                                    className="form-field__input level-row__note"
                                    aria-label={`Word for ${name || 'the'} level`}
                                    value={note}
                                    placeholder="Fluent, B2…"
                                    title="Printed beside the level. Screening systems read this word, not the dots."
                                    onChange={(event) => onType(setRow(index, joinItem(name, event.target.value), level))}
                                />
                            </div>
                        </div>
                    )
                }}
            </SortableList>
            <div className="level-list__add">
                <input
                    className="form-field__input"
                    aria-label="Add an item"
                    value={draft}
                    placeholder="Add one, such as English (Fluent)"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault()
                            add()
                        }
                    }}
                />
                <button type="button" className="button" disabled={!draft.trim()} onClick={add}>
                    <Plus size={13} aria-hidden="true" />
                    Add
                </button>
            </div>
        </div>
    )
}
