/**
 * Which panels of the editor are open. Not part of the CV: it never saves or undoes.
 *
 * Sections start open and entries start closed, so a long CV reads as an outline; an
 * entry just added opens, ready to fill in.
 */

import {create} from 'zustand'

export type EditorTab = 'content' | 'design' | 'check'

interface EditorStore {
    /** What the side pane shows: what the CV says, or how it looks. */
    tab: EditorTab
    setTab(tab: EditorTab): void
    /** Sections someone folded away. */
    closedSections: ReadonlySet<string>
    /** Entries someone opened. */
    openEntries: ReadonlySet<string>
    toggleSection(id: string): void
    toggleEntry(id: string): void
    openEntry(id: string): void
}

const toggled = (set: ReadonlySet<string>, id: string): Set<string> => {
    const next = new Set(set)

    if (!next.delete(id)) {
        next.add(id)
    }

    return next
}

export const useEditorStore = create<EditorStore>((set) => ({
    tab: 'content',
    setTab: (tab) => set({tab}),
    closedSections: new Set(),
    openEntries: new Set(),
    toggleSection: (id) => set((state) => ({closedSections: toggled(state.closedSections, id)})),
    toggleEntry: (id) => set((state) => ({openEntries: toggled(state.openEntries, id)})),
    openEntry: (id) => set((state) => ({openEntries: new Set(state.openEntries).add(id)})),
}))
