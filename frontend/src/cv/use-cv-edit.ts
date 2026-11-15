/**
 * Editing the document in hand from a form.
 *
 * Each change shows at once, and a burst of them becomes one step to undo once typing
 * pauses, so Undo takes back a phrase rather than a letter.
 */

import {useEffect, useRef} from 'react'
import {useDocumentStore, type Content} from '../store/document-store'
import type {Cv} from './cv'

/** How a form changes the document in hand, typed as the document it edits. */
export interface DocumentEdit<D> {
    /** A change while typing: shown now, recorded as a step once typing pauses. */
    type(update: (document: D) => D): void
    /** A change that is a step of its own, such as adding or removing something. */
    act(label: string, update: (document: D) => D): void
    /** Finishes the step being typed. */
    commit(): void
}

/** How long typing has to pause before it counts as one step to undo. */
const TYPING_STEP_MS = 800

/** The editor of each type knows its document's shape; the store holds any type's. */
export function useDocumentEdit<D extends Content>(): DocumentEdit<D> {
    const before = useRef<Content | null>(null)
    const timer = useRef<number | undefined>(undefined)

    const commit = () => {
        window.clearTimeout(timer.current)

        if (before.current) {
            useDocumentStore.getState().commitEdit('editing', before.current)
            before.current = null
        }
    }

    // Leaving the editor finishes the step, so Undo on another page still has it.
    useEffect(() => commit, [])

    const type = (update: (document: D) => D) => {
        const store = useDocumentStore.getState()

        before.current ??= store.content
        store.previewEdit(update(store.content as D))
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(commit, TYPING_STEP_MS)
    }

    const act = (label: string, update: (document: D) => D) => {
        commit()
        useDocumentStore.getState().edit(label, (content) => update(content as D))
    }

    return {type, act, commit}
}

export const useCvEdit = (): DocumentEdit<Cv> => useDocumentEdit<Cv>()
