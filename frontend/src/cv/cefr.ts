/**
 * Language levels on the European scale (CEFR), as Europass gives them: A1 to C2 for each
 * of five skills, or a first language. A group of languages can keep its levels this way
 * instead of as dots out of five; every template still writes "English (C1)", and the
 * European template draws the grid.
 */

import {LANGUAGE_IDS, labelsFor} from '../core/labels/labels'

/** The app's own words for languages, in every language a document is written in. */
const LANGUAGE_WORDS = new Set(LANGUAGE_IDS.flatMap((language) => [labelsFor(language).sections.languages, labelsFor(language).rows.languagesKnown]).map((word) => word.trim().toLowerCase()))

/** A heading or a group's label that names languages, which is where European levels are offered. */
export const isLanguages = (title: string): boolean => LANGUAGE_WORDS.has(title.trim().toLowerCase()) || /\blanguages?\b|sprach|langues|idiomas|lingue|talen|języki/i.test(title)

export const CEFR_LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]

/** The five skills, in Europass's order. */
export const CEFR_SKILLS = ['listening', 'reading', 'interaction', 'production', 'writing'] as const

export type CefrSkill = (typeof CEFR_SKILLS)[number]

const ORDER: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const AS_LEVEL: Readonly<Record<CefrLevel, number>> = {'': 0, A1: 1, A2: 2, B1: 2.5, B2: 3, C1: 4, C2: 5, native: 5}

/** A level out of five as the European scale names it, for a group switched to it: 5 is C2, 3 is B2. */
export function cefrOfLevel(level: number): CefrLevel {
    return level >= 5 ? 'C2' : level >= 4 ? 'C1' : level >= 3 ? 'B2' : level >= 2.5 ? 'B1' : level >= 2 ? 'A2' : level >= 1 ? 'A1' : ''
}

/** The level out of five a European level is drawn as, for templates that draw dots. */
export const levelOfCefr = (level: CefrLevel): number => AS_LEVEL[level]

/** The words for a first language, in the languages a CV is written in. */
const NATIVE = /native|mother|muttersprach|langue maternelle|lengua materna|madrelingua|língua materna|moedertaal|ojczyst|ana ?dil|родн|рідн|মাতৃভাষা|मातृभाषा|مادری|اللغة الأم|母語|母语|모국어/i

/** Five of one level. */
export const allAt = (level: CefrLevel): CefrLevel[] => CEFR_SKILLS.map(() => level)

/**
 * The European levels a note's words name: "C1" for all five skills, "B2 B2 B1 B1 A2"
 * for each, a first language, or null when the words name none.
 */
export function cefrOfWords(note: string): CefrLevel[] | null {
    if (NATIVE.test(note)) {
        return allAt('native')
    }

    const found = note.toUpperCase().match(/\b[ABC][12]\b/g) as CefrLevel[] | null

    if (!found) {
        return null
    }

    return found.length >= CEFR_SKILLS.length ? found.slice(0, CEFR_SKILLS.length) : allAt(found[found.length - 1])
}

/** The levels in a few words: "C1", "B1–C1", or the word for a first language. */
export function cefrSummary(levels: readonly CefrLevel[], native: string): string {
    if (levels.length > 0 && levels.every((level) => level === 'native')) {
        return native
    }

    const set = levels.filter((level) => ORDER.includes(level)).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))

    if (set.length === 0) {
        return ''
    }

    return set[0] === set[set.length - 1] ? set[0] : `${set[0]}–${set[set.length - 1]}`
}

/** The highest of an item's levels, as dots out of five. */
export const cefrLevel = (levels: readonly CefrLevel[]): number => Math.max(0, ...levels.map(levelOfCefr))

/** Each item's European levels, carried across a change to the items by name, as levelsFor does for dots. */
export function cefrFor(items: readonly string[], before: {readonly items: readonly string[]; readonly cefr?: readonly (readonly CefrLevel[])[]}): CefrLevel[][] {
    const known = new Map(before.items.map((item, index) => [item.trim().toLowerCase(), before.cefr?.[index] ?? allAt('')]))

    return items.map((item) => [...(known.get(item.trim().toLowerCase()) ?? allAt(''))])
}

/**
 * Items that all name a European level in words, "German (B2)", "Bangla (Native)", as
 * names and levels, for a group read from a file; null when any names none, or none
 * names one from A1 to C2.
 */
export function cefrOfItems(items: readonly string[], split: (item: string) => {name: string; note: string}): {items: string[]; cefr: CefrLevel[][]} | null {
    const parts = items.map(split)
    const cefr = parts.map((part) => cefrOfWords(part.note))

    if (items.length === 0 || cefr.some((levels) => levels === null) || !parts.some((part) => /\b[ABC][12]\b/i.test(part.note))) {
        return null
    }

    return {items: parts.map((part) => part.name), cefr: cefr as CefrLevel[][]}
}
