/**
 * The templates a biodata can use. The layout of each is a Typst file beside this one,
 * reading the biodata from /biodata.json.
 */

export interface BiodataTemplate {
    readonly id: string
    readonly name: string
    /** What it's like, in a few words. */
    readonly about: string
    /** Facts that help choose. */
    readonly facts: string
}

export const BIODATA_TEMPLATES: readonly BiodataTemplate[] = [
    {id: 'clean', name: 'Clean', about: 'One column, a thin rule under each heading and the photo beside the name. No ornament.', facts: 'One column · Photo'},
]
