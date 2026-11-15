/**
 * The hidden section an import leaves for lines it couldn't place. Kept apart from the
 * parser so the editor and Check can find it without loading the import.
 */

import type {Sectioned} from '../sections'

export const NOT_SORTED = 'Not sorted'

/** How many lines from an imported file still wait in Not sorted, or 0 when there's no such section. */
export function notSortedLines(doc: Sectioned): number {
    const section = doc.sections.find((found) => found.kind === 'text' && found.title === NOT_SORTED)

    return section?.kind === 'text' ? section.text.split('\n').filter((line) => line.trim()).length : 0
}
