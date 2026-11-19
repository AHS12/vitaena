/**
 * A document carried into another language: the headings, labels and relations that are
 * the app's own words take the new language's, and the ones the person wrote themselves
 * stay as they are. What they wrote under them never changes.
 */

import {translator, type DocumentLanguage} from '../core/labels/labels'
import type {Section, Sectioned} from './sections'

function relabel(section: Section, word: (text: string) => string): Section {
    const title = word(section.title)

    switch (section.kind) {
        case 'details':
            return {...section, title, rows: section.rows.map((row) => ({...row, label: word(row.label)}))}
        case 'family':
            return {...section, title, members: section.members.map((member) => ({...member, relation: word(member.relation)}))}
        case 'tags':
            return {...section, title, groups: section.groups.map((group) => ({...group, label: word(group.label)}))}
        default:
            return {...section, title}
    }
}

/** The document written in another language, with its design saying so. */
export function inLanguage<D extends Sectioned & {readonly design: {readonly language: string}}>(doc: D, to: DocumentLanguage): D {
    const word = translator(doc.design.language, to)

    return {...doc, sections: doc.sections.map((section) => relabel(section, word)), design: {...doc.design, language: to}}
}
