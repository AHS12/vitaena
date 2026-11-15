/**
 * Ctrl+Z and Ctrl+Y in an editor: the document's history, not a field's own, which knows
 * nothing of saving or of changes made elsewhere.
 */

import type {KeyboardEvent} from 'react'
import {useDocumentStore} from '../store/document-store'

/** Handles the keys for an editor's root element. Finishing the step first means Undo takes back the typing. */
export function useHistoryKeys(edit: {commit(): void}): (event: KeyboardEvent) => void {
    return (event) => {
        const key = event.key.toLowerCase()

        if (!(event.ctrlKey || event.metaKey) || (key !== 'z' && key !== 'y')) {
            return
        }

        event.preventDefault()
        edit.commit()

        const store = useDocumentStore.getState()

        if (key === 'y' || event.shiftKey) {
            store.redo()
        } else {
            store.undo()
        }
    }
}
