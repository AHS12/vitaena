/**
 * A document carried into another language: the headings, labels and relations that are
 * the app's own words take the new language's, and the ones the person wrote themselves
 * stay as they are. What they wrote under them never changes.
 */

import {languageInfo, translator, type DocumentLanguage} from '../core/labels/labels'
import {scriptFontById} from './fonts'
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

/**
 * Whether a bundled script font chosen for one language suits another: not one made for a
 * single language (Zen Old Mincho for Japanese), nor one for a script the new language
 * isn't written in. Fonts the person added are kept.
 */
function suits(scriptFont: string, to: DocumentLanguage): boolean {
    const font = scriptFontById(scriptFont)
    const script = languageInfo(to).script

    return !font || ((!font.languages || font.languages.includes(to)) && (!script || font.script === script))
}

/** The document written in another language, with its design saying so. */
export function inLanguage<D extends Sectioned & {readonly design: {readonly language: string; readonly scriptFont?: string}}>(doc: D, to: DocumentLanguage): D {
    const word = translator(doc.design.language, to)
    const scriptFont = doc.design.scriptFont !== undefined && !suits(doc.design.scriptFont, to) ? {scriptFont: ''} : {}

    return {...doc, sections: doc.sections.map((section) => relabel(section, word)), design: {...doc.design, language: to, ...scriptFont}}
}
