/**
 * Dates as CVs write them: "Mar 2022 – Present", "03/2019 - 06/2021", "2016 to 2018",
 * "Sep 2023". Found anywhere in a line, so what's around them can be read as well.
 */

export interface DateRange {
    /** "2022-03", or "" when not given. */
    readonly start: string
    readonly end: string
    /** Still going: the end said Present, Now or the like. */
    readonly current: boolean
    /** Where the dates are in the text, so they can be taken out of it. */
    readonly index: number
    readonly length: number
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_NAME = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?'
const YEAR = '(?:19|20)\\d{2}'
/** One date: "Mar 2022", "March, 2022", "03/2022", "03.2022", "2022-03" or "2022". */
const ONE = `(?:${MONTH_NAME},?\\s+${YEAR}|(?:0?[1-9]|1[0-2])[/.]${YEAR}|${YEAR}[-/](?:0[1-9]|1[0-2])(?!\\d)|${YEAR})`
const NOW = '(?:present|current(?:ly)?|now|today|ongoing|to date)'
const RANGE = new RegExp(`(?<![\\w/.-])(${ONE})(?:\\s*(?:[–—-]|to|until)\\s*(${ONE}|${NOW}))?(?![\\w/])`, 'i')

/** One date as "2022-03". A year alone is January when it starts and December when it ends. */
function monthOf(text: string, end: boolean): string {
    const year = /(?:19|20)\d{2}/.exec(text)![0]
    const name = new RegExp(MONTH_NAME, 'i').exec(text)
    const number = /^(0?[1-9]|1[0-2])[/.]/.exec(text) ?? new RegExp(`^${YEAR}[-/](0[1-9]|1[0-2])`).exec(text)
    const month = name ? MONTHS.indexOf(name[0].slice(0, 3).toLowerCase()) + 1 : number ? Number(number[1]) : end ? 12 : 1

    return `${year}-${String(month).padStart(2, '0')}`
}

/** The first date or range of dates in the text, or null. */
export function findDates(text: string): DateRange | null {
    const match = RANGE.exec(text)

    if (!match) {
        return null
    }

    const [whole, from, to] = match
    const current = to !== undefined && new RegExp(`^${NOW}$`, 'i').test(to)
    const start = monthOf(from, false)
    // A single date, such as a talk given in one month, starts and ends then.
    const end = current ? '' : monthOf(to ?? from, to !== undefined)

    return {start, end: to === undefined ? start : end, current, index: match.index, length: whole.length}
}

/** The text with the dates taken out, and the separators that were left hanging. */
export function withoutDates(text: string, dates: DateRange): string {
    return `${text.slice(0, dates.index)} ${text.slice(dates.index + dates.length)}`
        .replace(/\s*[|·•—–,]\s*$/, '')
        .replace(/^\s*[|·•—–,]\s*/, '')
        .replace(/\s*([|·•])(?:\s*[|·•])+\s*/g, ' $1 ')
        .replace(/\s+/g, ' ')
        .trim()
}
