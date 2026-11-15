/**
 * Section names CVs use, and what kind of section each one is. A heading not here keeps
 * its name, and its kind is guessed from what is under it.
 */

/** What a heading starts: a section, or more about the person (merged into theirs). */
export type HeadingKind = 'text' | 'entries' | 'tags' | 'details' | 'contact' | 'family'

const KNOWN: readonly [HeadingKind, readonly string[]][] = [
    ['text', ['summary', 'professional summary', 'career summary', 'profile', 'professional profile', 'personal profile', 'about', 'about me', 'objective', 'career objective', 'personal statement', 'overview', 'references', 'expectations', 'partner preferences', 'preferences', 'looking for']],
    [
        'entries',
        [
            'experience',
            'work',
            'occupation',
            'profession',
            'work experience',
            'professional experience',
            'relevant experience',
            'employment',
            'employment history',
            'work history',
            'career history',
            'education',
            'education and training',
            'academic background',
            'projects',
            'personal projects',
            'selected projects',
            'certifications',
            'certificates',
            'licenses and certifications',
            'publications',
            'awards',
            'honors',
            'honours',
            'awards and honors',
            'achievements',
            'volunteering',
            'volunteer experience',
            'leadership',
            'activities',
            'research',
            'research experience',
            'teaching',
            'teaching experience',
            'courses',
            'training',
        ],
    ],
    ['tags', ['skills', 'technical skills', 'key skills', 'core skills', 'core competencies', 'competencies', 'expertise', 'areas of expertise', 'languages', 'tools', 'technologies', 'tools and technologies', 'interests', 'hobbies', 'hobbies and interests']],
    ['details', ['personal details', 'personal information', 'personal data', 'details', 'horoscope', 'religious practice', 'lifestyle', 'more about me']],
    ['family', ['family', 'family details', 'family background', 'family information', 'parents', 'siblings']],
    ['contact', ['contact', 'contact details', 'contact information', 'contact me', 'get in touch']],
]

const BY_NAME = new Map(KNOWN.flatMap(([kind, names]) => names.map((name) => [name, kind] as const)))

/** A heading as compared: lower case, "&" as "and", with no punctuation. */
export const headingKey = (text: string): string =>
    text
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^\p{L}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()

/** The kind a known heading starts, or null for one not known. */
export const knownHeading = (text: string): HeadingKind | null => BY_NAME.get(headingKey(text)) ?? null
