/** Above Content after an import, while lines from the file wait in Not sorted. */

import type {Sectioned} from '../sections'
import {notSortedLines} from './not-sorted'

export function NotSortedNote({doc}: {doc: Sectioned}) {
    const unsorted = notSortedLines(doc)

    if (unsorted === 0) {
        return null
    }

    return (
        <p className="import-note" role="note">
            {unsorted === 1 ? 'One line' : `${unsorted} lines`} from your file had no clear place, so {unsorted === 1 ? 'it waits' : 'they wait'} in Not sorted at the end, hidden from the page. Move each where it belongs, then remove that section.
        </p>
    )
}
