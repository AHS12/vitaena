/**
 * The types of document this app makes. A file's `kind` picks its type, so the library
 * can hold documents of every type at once, and each opens as what it is.
 */

import {pluralOf, type DocumentType} from '../core/document/document-file'
import {cvType, type Cv} from '../cv/cv'

/** What any document in this app holds. */
export type Content = Cv

/** Every type, the one a new document gets by default first. */
export const DOCUMENT_TYPES: readonly DocumentType<Content>[] = [cvType]

/** The type a new document gets when nothing says otherwise. */
export const defaultType = (): DocumentType<Content> => DOCUMENT_TYPES[0]

/** The type a file's `kind` names, or null when this build has none of that kind. */
export const typeOfKind = (kind: string | null): DocumentType<Content> | null => DOCUMENT_TYPES.find((type) => type.kind === kind) ?? null

/** True when the library can hold more than one type, so each document is marked with its own. */
export const hasSeveralTypes = (): boolean => DOCUMENT_TYPES.length > 1

/**
 * What the app calls its documents all together: the one type's own words when it has
 * one, "document" when it has several.
 */
export function libraryWords(): {readonly noun: string; readonly plural: string} {
    if (hasSeveralTypes()) {
        return {noun: 'document', plural: 'documents'}
    }

    const type = defaultType()

    return {noun: type.noun, plural: pluralOf(type)}
}

/** "1 CV", or "3 documents". */
export function libraryCount(count: number): string {
    const words = libraryWords()

    return `${count} ${count === 1 ? words.noun : words.plural}`
}

/** The word for a saved document's type, such as "CV", or null when its kind is unknown. */
export const nounOfKind = (kind: string | null): string | null => typeOfKind(kind)?.noun ?? null
