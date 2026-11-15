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
}

export const CV_TEMPLATES: readonly CvTemplate[] = [
    {id: 'classic', name: 'Classic', about: 'Name on top, coloured section rules. Suits almost any job.', facts: 'One column · ATS-friendly'},
]
