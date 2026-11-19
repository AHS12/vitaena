/**
 * How a details row is written on the page: words as they are, a date as a date, an age
 * or both, and a height in feet and inches, centimetres or both. Dates, ages and heights
 * are written in the document's language and digits; the person's own words never change.
 */

import {labelsFor, withDigits} from '../core/labels/labels'
import {ENGLISH, newId, type DetailRow as CvDetailRow, type Writing} from './sections'

/** Numbers the app writes, in the document's digits. */
export const numbersIn = (text: string, writing: Writing): string => withDigits(text, writing.language, writing.digits === 'native')

const parseDay = (value: string): {year: number; month: number; day: number} | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

    return match ? {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])} : null
}

/** "1996-03-12" as "12 March 1996", or "১২ মার্চ ১৯৯৬". */
export function dayText(value: string, writing: Writing = ENGLISH): string {
    const day = parseDay(value)

    return day ? numbersIn(`${day.day} ${labelsFor(writing.language).page.months[day.month - 1]} ${day.year}`, writing) : ''
}

/** Whole years from the date to `today`, or null for no date or one still to come. */
export function ageOn(value: string, today: Date): number | null {
    const day = parseDay(value)

    if (!day) {
        return null
    }

    const month = today.getMonth() + 1
    const before = month < day.month || (month === day.month && today.getDate() < day.day)
    const age = today.getFullYear() - day.year - (before ? 1 : 0)

    return age >= 0 ? age : null
}

const CM_PER_INCH = 2.54

/** Centimetres as whole feet and inches, rounded to the nearest inch. */
export function feetAndInches(cm: number): {feet: number; inches: number} {
    const total = Math.round(cm / CM_PER_INCH)

    return {feet: Math.floor(total / 12), inches: total % 12}
}

export const cmOf = (feet: number, inches: number): number => Math.round((feet * 12 + inches) * CM_PER_INCH)

/** "5′ 6″", "168 cm", or "5′ 6″ (168 cm)". */
export function heightText(cm: number, show: 'ft-in' | 'cm' | 'both', writing: Writing = ENGLISH): string {
    if (cm <= 0) {
        return ''
    }

    const {feet, inches} = feetAndInches(cm)
    const imperial = `${feet}′ ${inches}″`
    const metric = `${Math.round(cm)} ${labelsFor(writing.language).page.cm}`

    return numbersIn(show === 'cm' ? metric : show === 'ft-in' ? imperial : `${imperial} (${metric})`, writing)
}

/** What a row says on the page, or "" when it says nothing yet. */
export function detailValue(row: CvDetailRow, today: Date, writing: Writing = ENGLISH): string {
    if (row.kind === 'text') {
        return row.value.trim()
    }

    if (row.kind === 'height') {
        return heightText(row.cm, row.show, writing)
    }

    const date = dayText(row.date, writing)
    const age = ageOn(row.date, today)
    const years = age === null ? '' : numbersIn(labelsFor(writing.language).page.years(String(age), age === 1), writing)

    if (row.show === 'date' || !years) {
        return date
    }

    return row.show === 'age' ? years : `${date} (${years})`
}

export const emptyDetailRow = (kind: CvDetailRow['kind'] = 'text', label = ''): CvDetailRow => {
    const base = {id: newId('row'), visible: true, label}

    if (kind === 'date') {
        return {...base, kind, date: '', show: 'both'}
    }

    if (kind === 'height') {
        return {...base, kind, cm: 0, show: 'both'}
    }

    return {...base, kind, value: ''}
}
