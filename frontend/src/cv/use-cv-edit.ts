/**
 * Editing the CV in hand from a form.
 *
 * Each change shows at once, and a burst of them becomes one step to undo once typing
 * pauses, so Undo takes back a phrase rather than a letter.
 */

import {useEffect, useRef} from 'react'
import {useDocumentStore} from '../store/document-store'
import type {Cv} from './cv'

/** How long typing has to pause before it counts as one step to undo. */
const TYPING_STEP_MS = 800

export function useCvEdit() {
    const before = useRef<Cv | null>(null)
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

    /** A change while typing: shown now, recorded as a step once typing pauses. */
    const type = (update: (cv: Cv) => Cv) => {
        const store = useDocumentStore.getState()

        before.current ??= store.content
        store.previewEdit(update(store.content))
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(commit, TYPING_STEP_MS)
    }

    /** A change that is a step of its own, such as adding or removing something. */
    const act = (label: string, update: (cv: Cv) => Cv) => {
        commit()
        useDocumentStore.getState().edit(label, update)
    }

    return {type, act, commit}
}
