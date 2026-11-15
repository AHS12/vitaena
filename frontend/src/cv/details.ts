/**
 * How a details row is written on the page: words as they are, a date as a date, an age
 * or both, and a height in feet and inches, centimetres or both.
 */

import {newId, type DetailRow as CvDetailRow} from './sections'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const parseDay = (value: string): {year: number; month: number; day: number} | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

    return match ? {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])} : null
}

/** "1996-03-12" as "12 March 1996". */
export function dayText(value: string): string {
    const day = parseDay(value)

    return day ? `${day.day} ${MONTHS[day.month - 1]} ${day.year}` : ''
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
export function heightText(cm: number, show: 'ft-in' | 'cm' | 'both'): string {
    if (cm <= 0) {
        return ''
    }

    const {feet, inches} = feetAndInches(cm)
    const imperial = `${feet}′ ${inches}″`
    const metric = `${Math.round(cm)} cm`

    return show === 'cm' ? metric : show === 'ft-in' ? imperial : `${imperial} (${metric})`
}

/** What a row says on the page, or "" when it says nothing yet. */
export function detailValue(row: CvDetailRow, today: Date): string {
    if (row.kind === 'text') {
        return row.value.trim()
    }

    if (row.kind === 'height') {
        return heightText(row.cm, row.show)
    }

    const date = dayText(row.date)
    const age = ageOn(row.date, today)
    const years = age === null ? '' : `${age} ${age === 1 ? 'year' : 'years'}`

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
