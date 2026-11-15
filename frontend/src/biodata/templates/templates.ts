/**
 * The templates a biodata can use. The layout of each is a Typst file beside this one,
 * reading the biodata from /biodata.json, and every one must pass templates.test.ts.
 */

export interface BiodataTemplate {
    readonly id: string
    readonly name: string
    /** What it's like, in a few words. */
    readonly about: string
    /** Facts that help choose. */
    readonly facts: string
    /** Whether a biodata started in it has a border. It can be turned off in Style. */
    readonly border: boolean
}

export const BIODATA_TEMPLATES: readonly BiodataTemplate[] = [
    {id: 'heritage', name: 'Heritage', about: 'Traditional: a double border with corner ornaments, everything centred, and the family in a ruled table.', facts: 'One column · Photo · Border', border: true},
    {id: 'clean', name: 'Clean', about: 'One column, a thin rule under each heading and the photo beside the name. No ornament.', facts: 'One column · Photo', border: false},
    {id: 'portrait', name: 'Portrait', about: 'Led by the photos: the main one and a full-length one in a column on the left, everything else beside them.', facts: 'Two columns · Two photos', border: false},
]
