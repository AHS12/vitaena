/**
 * Checks a CV for what commonly trips up applicant tracking systems and the people who
 * read after them. Each check says what it found in plain words and, when something is
 * worth changing, what to do. None of them is a score: they're advice.
 */

import {LONG_BULLET} from '../components/BulletList'
import type {Cv} from './cv'
import {emailWarning} from './editor/edit-ops'
import {CV_TEMPLATES} from './templates/templates'
import {splitItem} from './levels'

export type CheckLevel = 'good' | 'tip' | 'warning'

export interface CheckResult {
    readonly id: string
    readonly level: CheckLevel
    readonly title: string
    readonly detail?: string
    /** Something the Check can do about it with one click. */
    readonly fix?: 'ats-mode'
}

/** Headings most parsers look for, and other words that mean the same. */
const KNOWN_HEADINGS = [
    'summary', 'profile', 'professional summary', 'about', 'about me', 'objective', 'career objective',
    'experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career history',
    'education', 'qualifications', 'academic background',
    'skills', 'technical skills', 'key skills', 'core skills', 'competencies', 'core competencies',
    'projects', 'certifications', 'certificates', 'licenses', 'licences', 'licenses and certifications', 'courses', 'training',
    'languages', 'awards', 'honours', 'honors', 'achievements', 'volunteering', 'volunteer experience', 'publications',
    'research', 'research interests', 'teaching', 'talks', 'presentations', 'grants', 'service', 'interests', 'references',
    'academic positions', 'supervision', 'memberships', 'affiliations',
]

const TWO_COLUMN_TEMPLATES = new Set(CV_TEMPLATES.filter((template) => template.twoColumns).map((template) => template.id))

const isKnown = (title: string): boolean => KNOWN_HEADINGS.includes(title.trim().toLowerCase())

export function checkCv(cv: Cv, pages: number | null): CheckResult[] {
    const results: CheckResult[] = []
    const {person} = cv
    const shown = cv.sections.filter((section) => section.visible)

    results.push(
        person.name.trim()
            ? {id: 'name', level: 'good', title: 'Your name is the first thing on the page'}
            : {id: 'name', level: 'warning', title: 'Add your name', detail: 'Parsers take the first line as your name.'},
    )

    const contact: string[] = []

    if (!person.email.trim()) {
        contact.push('an email address')
    }

    if (!person.phone.trim()) {
        contact.push('a phone number')
    }

    if (contact.length > 0) {
        results.push({id: 'contact', level: 'warning', title: `Add ${contact.join(' and ')}`, detail: 'Without it, a recruiter who likes your CV has no way to reach you.'})
    } else if (emailWarning(person.email)) {
        results.push({id: 'contact', level: 'warning', title: "Your email address doesn't look complete", detail: person.email})
    } else {
        results.push({id: 'contact', level: 'good', title: 'Email and phone are there, written out in full'})
    }

    if (!person.headline.trim()) {
        results.push({id: 'headline', level: 'tip', title: 'Add a headline', detail: 'The role you want, in the words a job ad would use, helps both keyword searches and people skimming.'})
    }

    const unknown = shown.filter((section) => !isKnown(section.title)).map((section) => section.title.trim() || 'An untitled section')

    results.push(
        unknown.length === 0
            ? {id: 'headings', level: 'good', title: 'Every heading is one parsers recognise'}
            : {
                  id: 'headings',
                  level: 'tip',
                  title: unknown.length === 1 ? `"${unknown[0]}" isn't a heading every parser knows` : `${unknown.length} headings aren't ones every parser knows`,
                  detail: `${unknown.length === 1 ? '' : `${unknown.map((title) => `"${title}"`).join(', ')}. `}Standard words such as Experience, Education and Skills are the safest.`,
              },
    )

    if (!shown.some((section) => section.kind === 'entries' && /experience|employment|work|positions/i.test(section.title))) {
        results.push({id: 'experience', level: 'tip', title: 'No Experience section', detail: 'Most screening looks for one, even for a first job: internships and volunteering count.'})
    }

    if (TWO_COLUMN_TEMPLATES.has(cv.design.template)) {
        results.push(
            cv.design.atsMode
                ? {id: 'columns', level: 'good', title: 'One column, in ATS mode'}
                : {id: 'columns', level: 'warning', title: 'Two columns can be read out of order', detail: 'Some systems read across both columns line by line. ATS mode puts everything in one column; Export also offers a one-column PDF for online forms.', fix: 'ats-mode'},
        )
    } else {
        results.push({id: 'columns', level: 'good', title: 'One column, read top to bottom'})
    }

    if (person.photo && !person.hide.includes('photo')) {
        results.push({id: 'photo', level: 'tip', title: 'Your CV has a photo', detail: 'Expected in much of Europe and Asia, but often left out for jobs in the US and UK. Show on the page turns it off without removing it.'})
    }

    const entries = shown.flatMap((section) => (section.kind === 'entries' ? section.entries.filter((entry) => entry.visible).map((entry) => ({section: section.title, entry})) : []))
    const undated = entries.filter(({section, entry}) => /experience|employment|work|education|positions/i.test(section) && !entry.start && !entry.end && !entry.current)

    if (undated.length > 0) {
        results.push({
            id: 'dates',
            level: 'tip',
            title: undated.length === 1 ? 'One job or school has no dates' : `${undated.length} jobs or schools have no dates`,
            detail: `${undated.map(({entry}) => entry.title || entry.org || 'Untitled').join(', ')}. Parsers work out your years of experience from them.`,
        })
    }

    const long = entries.flatMap(({entry}) => entry.bullets).filter((bullet) => bullet.trim().length > LONG_BULLET).length

    if (long > 0) {
        results.push({id: 'bullets', level: 'tip', title: long === 1 ? 'One bullet is long' : `${long} bullets are long`, detail: `Under ${LONG_BULLET} characters each reads better, for people and software.`})
    }

    const bullets = entries.flatMap(({entry}) => entry.bullets).filter((bullet) => bullet.trim())
    const measured = bullets.filter((bullet) => /\d/.test(bullet)).length

    if (bullets.length >= 4 && measured / bullets.length < 0.3) {
        results.push({id: 'numbers', level: 'tip', title: 'Few achievements have a number in them', detail: 'Results with numbers, such as "cut costs by 20%", stand out to the people who read after the software.'})
    }

    // A level drawn as dots is lost on a parser; the word beside it is what's read.
    const wordless = cv.sections
        .filter((section) => section.visible && section.kind === 'tags')
        .flatMap((section) => (section.kind === 'tags' ? section.groups : []))
        .filter((group) => group.visible && group.showLevels)
        .flatMap((group) => group.items.filter((item, index) => (group.levels[index] ?? 0) > 0 && !splitItem(item).note))

    if (wordless.length > 0) {
        results.push({
            id: 'levels',
            level: 'tip',
            title: wordless.length === 1 ? `${splitItem(wordless[0]).name} has a level but no word for it` : `${wordless.length} items have a level but no word for it`,
            detail: 'Screening systems read words, not dots. Add one beside the level, such as Fluent or B2.',
        })
    }

    if (pages !== null && pages > 2 && !shown.some((section) => /publication|research|grant|teaching/i.test(section.title))) {
        results.push({id: 'length', level: 'tip', title: `${pages} pages is long for most jobs`, detail: 'Outside academia, most readers expect one or two. Compact spacing or the Compact template can help.'})
    }

    return results
}
