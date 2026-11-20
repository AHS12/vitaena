/**
 * Second labels: a heading, label or relation written again in another language under
 * the first, as many printed biodata have, "Date of birth" with "জন্ম তারিখ" beneath it.
 *
 * Only a biodata has them, but they're typed in the editor parts every type shares, so
 * those parts reach them through this context: without a provider, as in a CV, there's
 * no second field at all.
 */

import {createContext, useContext} from 'react'

export interface SecondLabels {
    /** The language the second labels are in, for the field's placeholder. */
    readonly language: string
    /** The second label for a section, row or member, by its id, or "". */
    get(id: string): string
    /** Types a second label, as one step to undo with the rest of the typing. */
    type(id: string, text: string): void
    commit(): void
}

const SecondLabelsContext = createContext<SecondLabels | null>(null)

export const SecondLabelsProvider = SecondLabelsContext.Provider

export const useSecondLabels = (): SecondLabels | null => useContext(SecondLabelsContext)
