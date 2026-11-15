/**
 * Checks a biodata for what the family reading it looks for first, and for how it
 * travels: most are shared as a picture in a chat, which makes them smaller. Each check
 * says what it found in plain words. None of them is a score: they're advice.
 */

import type {CheckResult} from '../cv/ats-check'
import {notSortedLines} from '../cv/import/not-sorted'
import type {Biodata} from './biodata'

/**
 * Chat apps shrink a shared picture to about 1600 pixels on its long side. An A4 page is
 * 842 points tall, so a point becomes about 1.9 pixels, and text under 9 points, with
 * the smaller notes under it, gets hard to read on a phone.
 */
const SMALLEST_READABLE = 9
const COMFORTABLE = 10

/** A row the person filled in, whatever its kind. */
type Row = Extract<Biodata['sections'][number], {kind: 'details'}>['rows'][number]

const filled = (row: Row): boolean => row.visible && (row.kind === 'text' ? row.value.trim() !== '' : row.kind === 'date' ? row.date !== '' : row.cm > 0)

export function checkBiodata(biodata: Biodata, pages: number | null): CheckResult[] {
    const results: CheckResult[] = []
    const {person} = biodata
    const shown = biodata.sections.filter((section) => section.visible)
    const rows = shown.flatMap((section) => (section.kind === 'details' ? section.rows.filter(filled).map((row) => ({section: section.title, row})) : []))

    const unsorted = notSortedLines(biodata)

    // Lines an import couldn't place are hidden, so nothing else would point them out.
    if (unsorted > 0) {
        results.push({
            id: 'not-sorted',
            level: 'warning',
            title: unsorted === 1 ? "One line from your file isn't sorted yet" : `${unsorted} lines from your file aren't sorted yet`,
            detail: 'They wait in Not sorted, which is hidden from the page. Move each where it belongs, then remove that section.',
        })
    }

    results.push(person.name.trim() ? {id: 'name', level: 'good', title: 'Your name is at the top'} : {id: 'name', level: 'warning', title: 'Add your name'})

    if (!person.photo) {
        results.push({id: 'photo', level: 'warning', title: 'Add a photo', detail: 'Most families look at the photo first.'})
    } else if (person.hide.includes('photo')) {
        results.push({id: 'photo', level: 'tip', title: 'Your photo is hidden', detail: 'Show on the page, under You, brings it back.'})
    } else {
        results.push({id: 'photo', level: 'good', title: 'Your photo is on the page'})
    }

    const birth = rows.some(({row}) => row.kind === 'date' || /birth|\bage\b|\bdob\b/i.test(row.label))

    results.push(
        birth
            ? {id: 'birth', level: 'good', title: 'Your date of birth is there'}
            : {id: 'birth', level: 'warning', title: 'Add your date of birth', detail: 'It can show as the date, your age, or both.'},
    )

    const contact = rows.some(({section, row}) => /contact/i.test(section) || /phone|mobile|contact|whatsapp|email/i.test(row.label))

    results.push(
        contact
            ? {id: 'contact', level: 'good', title: 'There is someone to contact'}
            : {id: 'contact', level: 'warning', title: 'Add someone to contact', detail: 'Usually a parent or guardian, with a phone number.'},
    )

    const family = shown.some((section) => section.kind === 'family' && section.members.some((member) => member.visible && member.name.trim() !== ''))

    if (!family) {
        results.push({id: 'family', level: 'tip', title: 'Add your family', detail: 'Most biodata name the parents, brothers and sisters, with their work.'})
    }

    if (pages !== null) {
        results.push(
            pages > 2
                ? {id: 'length', level: 'warning', title: `It runs to ${pages} pages`, detail: 'Most families expect one or two. Compact spacing, narrow margins or a shorter About me can bring it in.'}
                : {id: 'length', level: 'good', title: pages === 1 ? 'It fits on one page' : 'It fits on two pages'},
        )
    }

    const size = biodata.design.fontSize

    results.push(
        size < SMALLEST_READABLE
            ? {id: 'readable', level: 'warning', title: 'The text is too small to read in a shared picture', detail: 'Chat apps make pictures smaller. Choose a text size of 10 or more in Style.'}
            : size < COMFORTABLE
              ? {id: 'readable', level: 'tip', title: 'The text is small for a shared picture', detail: 'It can still be read, but a text size of 10 or more is easier on a phone.'}
              : {id: 'readable', level: 'good', title: 'The text reads well in a shared picture'},
    )

    return results
}
