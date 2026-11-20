/**
 * Section names CVs use, and what kind of section each one is. A heading not here keeps
 * its name, and its kind is guessed from what is under it.
 */

import {LANGUAGE_IDS, labelsFor, type Labels} from '../../core/labels/labels'

/** What a heading starts: a section, or more about the person (merged into theirs). */
export type HeadingKind = 'text' | 'entries' | 'tags' | 'details' | 'contact' | 'family'

/** The kind each of the app's own headings starts, so the same headings in every language are known. */
const KIND_OF_LABEL: Readonly<Record<keyof Labels['sections'], HeadingKind>> = {
    summary: 'text',
    experience: 'entries',
    education: 'entries',
    skills: 'tags',
    projects: 'entries',
    certifications: 'entries',
    languages: 'tags',
    volunteering: 'entries',
    awards: 'entries',
    publications: 'entries',
    interests: 'tags',
    personalDetails: 'details',
    custom: 'text',
    details: 'details',
    work: 'entries',
    family: 'family',
    aboutMe: 'text',
    expectations: 'text',
    hobbies: 'tags',
    contact: 'contact',
    horoscope: 'details',
    religiousPractice: 'details',
    lifestyle: 'details',
    moreAboutMe: 'details',
}

/** Other words Bangla CVs and biodata use for the same headings. */
const MORE_BANGLA: readonly [HeadingKind, readonly string[]][] = [
    ['text', ['ক্যারিয়ার উদ্দেশ্য', 'পেশাগত সারসংক্ষেপ', 'উদ্দেশ্য', 'আমার সম্পর্কে']],
    ['entries', ['অভিজ্ঞতা', 'চাকরির অভিজ্ঞতা', 'পেশাগত অভিজ্ঞতা', 'শিক্ষা', 'শিক্ষাগত তথ্য', 'প্রশিক্ষণ', 'কর্মজীবন']],
    ['tags', ['ভাষাজ্ঞান', 'কম্পিউটার দক্ষতা']],
    ['details', ['ব্যক্তিগত বিবরণ']],
    ['family', ['পরিবার', 'পারিবারিক বিবরণ']],
    ['contact', ['যোগাযোগের ঠিকানা', 'যোগাযোগের তথ্য']],
    ['entries', ['अनुभव', 'शिक्षा', 'शैक्षिक योग्यता', 'शिक्षण', 'अनुभव']],
    ['family', ['परिवार', 'कुटुंब']],
    ['tags', ['कौशल्य', 'مہارت']],
    ['entries', ['تعلیم', 'ملازمت', 'تجربۂ کار']],
    ['family', ['خاندان', 'گھرانہ']],
    ['text', ['الملخص', 'نبذة مختصرة', 'نبذة عني', 'الهدف الوظيفي', 'الملف الشخصي']],
    ['entries', ['الخبرات', 'الخبرة', 'الخبرات العملية', 'الخبرة المهنية', 'التعليم', 'المؤهلات', 'المؤهل العلمي', 'الدورات التدريبية']],
    ['tags', ['المهارات التقنية', 'المهارات الشخصية']],
    ['details', ['المعلومات الشخصية']],
    ['contact', ['معلومات التواصل', 'بيانات الاتصال', 'معلومات الاتصال']],
]

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

const IN_LANGUAGES: readonly [HeadingKind, readonly string[]][] = LANGUAGE_IDS.filter((language) => language !== 'en').flatMap((language) =>
    (Object.keys(KIND_OF_LABEL) as (keyof Labels['sections'])[]).filter((key) => key !== 'custom').map((key) => [KIND_OF_LABEL[key], [labelsFor(language).sections[key]]] as [HeadingKind, readonly string[]]),
)

const BY_NAME = new Map([...KNOWN, ...IN_LANGUAGES, ...MORE_BANGLA].flatMap(([kind, names]) => names.map((name) => [headingKey(name), kind] as const)))

/** A heading as compared: lower case, "&" as "and", with no punctuation. */
export function headingKey(text: string): string {
    return text
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^\p{L}\p{M}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/** The kind a known heading starts, or null for one not known. */
export const knownHeading = (text: string): HeadingKind | null => BY_NAME.get(headingKey(text)) ?? null
