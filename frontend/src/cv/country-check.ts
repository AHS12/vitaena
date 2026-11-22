/**
 * Check's advice for the place a CV is for: what that place's employers notice, such as
 * a photo in the US or a third page in Germany. Each says why and what to do; none of it
 * is forced, since a job advert's own instructions win.
 */

import {LANGUAGE_IDS, labelsFor, type Labels} from '../core/labels/labels'
import type {CheckResult} from './ats-check'
import {countryOf} from './countries'
import type {Cv} from './cv'

/** Rows that tell an employer a person's age, family or origin, in every language. */
const PERSONAL: readonly (keyof Labels['rows'])[] = ['dateOfBirth', 'maritalStatus', 'nationality', 'placeOfBirth', 'religion']

const personalWords = (key: keyof Labels['rows']): Set<string> => new Set(LANGUAGE_IDS.map((language) => labelsFor(language).rows[key].toLowerCase()))

const WORDS = Object.fromEntries(PERSONAL.map((key) => [key, personalWords(key)])) as Record<(typeof PERSONAL)[number], Set<string>>

/** CEFR levels, as Europass writes them: A1 to C2. */
const CEFR = /\b[ABC][12]\b/

/** The rows shown on the page, by what they say: "Date of birth" and the like. */
function personalRows(cv: Cv): string[] {
    return cv.sections
        .filter((section) => section.visible && section.kind === 'details')
        .flatMap((section) => (section.kind === 'details' ? section.rows.filter((row) => row.visible) : []))
        .filter((row) => row.kind === 'date' || PERSONAL.some((key) => WORDS[key].has(row.label.trim().toLowerCase())))
        .map((row) => row.label.trim() || 'A date')
}

const hasRow = (cv: Cv, key: keyof Labels['rows']): boolean =>
    cv.sections.some((section) => section.visible && section.kind === 'details' && section.rows.some((row) => row.visible && personalWords(key).has(row.label.trim().toLowerCase())))

/** The advice for the CV's place, or none for Anywhere. */
export function checkCountry(cv: Cv, pages: number | null): CheckResult[] {
    const country = countryOf(cv.design.country)

    if (country.id === 'any') {
        return []
    }

    const results: CheckResult[] = []
    const photo = cv.person.photo !== '' && !cv.person.hide.includes('photo')
    const add = (result: Omit<CheckResult, 'country'>) => results.push({...result, country: true})

    if (photo && country.photo === 'leave-out') {
        add({
            id: 'country-photo',
            level: country.id === 'us' || country.id === 'ca' ? 'warning' : 'tip',
            title: `${country.employers} usually expect no photo`,
            detail: country.id === 'us' || country.id === 'ca' ? 'A photo invites discrimination claims there, so many employers set such resumes aside. Hiding it keeps it in your CV for another place.' : 'Most CVs there have none. Hiding it keeps it in your CV for another place.',
            fix: 'hide-photo',
        })
    } else if (!photo && country.photo === 'usual') {
        add({id: 'country-photo', level: 'tip', title: `A photo is usual for ${country.short}`, detail: 'Not required, but common. A recent, plain portrait suits best; Professional, Sidebar and Bold show one.'})
    }

    const personal = personalRows(cv)

    if (personal.length > 0 && country.personal === 'leave-out') {
        add({
            id: 'country-personal',
            level: country.id === 'us' || country.id === 'ca' ? 'warning' : 'tip',
            title: `${country.employers} don't expect personal details`,
            detail: `${personal.join(', ')}. Age, family and origin aren't asked for there, and anti-discrimination law leads many employers to prefer CVs without them. Hide those rows for this CV.`,
        })
    }

    if (country.id === 'gulf' && !hasRow(cv, 'nationality')) {
        add({id: 'country-nationality', level: 'tip', title: 'Add your nationality', detail: 'Gulf employers look for it near the top, with your visa status, as it decides how you can be hired.'})
    }

    if (cv.design.paper !== country.paper) {
        add({
            id: 'country-paper',
            level: 'tip',
            title: country.paper === 'us-letter' ? `${country.employers} print on US Letter` : `${country.employers} print on A4`,
            detail: country.paper === 'us-letter' ? 'A4 pages print with their foot cut off there.' : 'US Letter is shorter and wider, so pages print with a wide bottom margin.',
            fix: 'paper',
            fixLabel: country.paper === 'us-letter' ? 'Use US Letter' : 'Use A4',
        })
    }

    if (pages !== null && country.pages > 0 && pages > country.pages) {
        add({id: 'country-length', level: 'tip', title: `${pages} pages is long for ${country.short}`, detail: `Readers there expect at most ${country.pages}. Compact spacing, or leaving out older jobs, can help.`})
    } else if (pages !== null && country.id === 'us' && pages > 1) {
        add({id: 'country-length', level: 'tip', title: 'One page is usual in the US', detail: 'Two pages suit ten years or more of experience; with less, recruiters expect one.'})
    }

    if (country.closing && !cv.closing.show) {
        add({id: 'country-closing', level: 'tip', title: `CVs for ${country.short} often end with place, date and signature`, detail: 'Not required, but common: "Berlin, 19.11.2026" and a signature under it. Turn it on at the end of Content.'})
    }

    if (country.id === 'dach' && cv.design.dateStyle === 'year') {
        add({id: 'country-dates', level: 'tip', title: 'German employers expect months', detail: 'A Lebenslauf gives each job and school its months, as 03.2020 – 06.2022, so gaps can be seen. Choose 01.2020 in Style, Dates.'})
    }

    if (country.id === 'europass') {
        const languages = cv.sections.find((section) => section.visible && section.kind === 'tags' && section.title.trim().toLowerCase() === labelsFor(cv.design.language).sections.languages.toLowerCase())
        const items = languages?.kind === 'tags' ? languages.groups.filter((group) => group.visible).flatMap((group) => group.items) : []
        const unlevelled = items.filter((item) => !CEFR.test(item) && !/native|mother/i.test(item))

        if (unlevelled.length > 0) {
            add({id: 'country-cefr', level: 'tip', title: unlevelled.length === 1 ? 'One language has no European level' : `${unlevelled.length} languages have no European level`, detail: 'Europass gives each language a level from A1 to C2, such as "German (B2)", so readers across Europe can compare them.'})
        }
    }

    return results
}
