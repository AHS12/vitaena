/**
 * The templates a CV can use. The layout of each is a Typst file beside this one, and
 * every one must pass ats.test.ts.
 */

export interface CvTemplate {
    readonly id: string
    readonly name: string
    /** What it's like, in a few words. */
    readonly about: string
    /** Facts that help choose: columns, how much fits. */
    readonly facts: string
    /** Has a side column, and so an ATS mode that makes it one. */
    readonly twoColumns: boolean
}

export const CV_TEMPLATES: readonly CvTemplate[] = [
    {id: 'classic', name: 'Classic', about: 'Name on top, coloured section rules. Suits almost any job.', facts: 'One column · ATS-friendly', twoColumns: false},
    {id: 'modern', name: 'Modern', about: 'A tinted name band, with skills and languages in a side column.', facts: 'Two columns · ATS mode makes it one', twoColumns: true},
    {id: 'minimal', name: 'Minimal', about: 'Quiet and spacious. Only the name carries colour.', facts: 'One column · ATS-friendly', twoColumns: false},
    {id: 'professional', name: 'Professional', about: 'A bold name, contact icons and a round photo, with skills and projects in a side column.', facts: 'Two columns · Photo · ATS mode makes it one', twoColumns: true},
    {id: 'compact', name: 'Compact', about: 'Each heading and its dates on one line. Fits more on a page.', facts: 'One column · Made for one page', twoColumns: false},
]
