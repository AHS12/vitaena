/**
 * Ctrl+B and Ctrl+I in a text box: wrap the selection in ** or *, the plain-text marks
 * the CV reads as bold and italic. With nothing selected, the marks go in with the
 * cursor between them, ready to type.
 */

import type {KeyboardEvent} from 'react'

const MARKS: Readonly<Record<string, string>> = {b: '**', i: '*'}

/** What formatting text boxes accept, for their hint. */
export const FORMATTING_HINT = '**bold**, *italic* and [links](example.com) work here. Ctrl+B and Ctrl+I wrap what you select.'

/** Handles the key if it's a formatting shortcut, and says whether it did. */
export function formatShortcut(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, onChange: (value: string) => void): boolean {
    const mark = MARKS[event.key.toLowerCase()]

    if (!mark || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
        return false
    }

    event.preventDefault()
    // The app's own shortcuts listen on the window; this key belongs to the text box.
    event.stopPropagation()

    const box = event.currentTarget
    const start = box.selectionStart ?? box.value.length
    const end = box.selectionEnd ?? start
    const value = box.value

    onChange(value.slice(0, start) + mark + value.slice(start, end) + mark + value.slice(end))

    // After the new text is drawn, select the same words inside their marks.
    requestAnimationFrame(() => box.setSelectionRange(start + mark.length, end + mark.length))

    return true
}
