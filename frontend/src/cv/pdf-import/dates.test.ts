import {describe, expect, it} from 'vitest'
import {findDates, withoutDates} from './dates'

const range = (text: string) => {
    const dates = findDates(text)

    return dates && {start: dates.start, end: dates.end, current: dates.current}
}

describe('dates in a CV', () => {
    it.each([
        ['Mar 2022 – Present', {start: '2022-03', end: '', current: true}],
        ['January 2019 - February 2022', {start: '2019-01', end: '2022-02', current: false}],
        ['Sept. 2016 — Dec 2018', {start: '2016-09', end: '2018-12', current: false}],
        ['03/2019 - 06/2021', {start: '2019-03', end: '2021-06', current: false}],
        ['2019-03 to 2021-06', {start: '2019-03', end: '2021-06', current: false}],
        ['2016 – 2018', {start: '2016-01', end: '2018-12', current: false}],
        ['2020 - current', {start: '2020-01', end: '', current: true}],
        ['Sep 2023', {start: '2023-09', end: '2023-09', current: false}],
    ])('reads "%s"', (text, expected) => {
        expect(range(text)).toEqual(expected)
    })

    it('finds them inside a line, and says where', () => {
        const text = 'Dhaka, Bangladesh | Jan 2019 – Feb 2022'
        const dates = findDates(text)!

        expect(text.slice(dates.index, dates.index + dates.length)).toBe('Jan 2019 – Feb 2022')
        expect(withoutDates(text, dates)).toBe('Dhaka, Bangladesh')
    })

    it('takes them out of the middle of a line with the separators around them', () => {
        const text = 'Harbourline Payments · Mar 2022 – Present · Dhaka'

        expect(withoutDates(text, findDates(text)!)).toBe('Harbourline Payments · Dhaka')
    })

    it('reads no dates in numbers that are not years', () => {
        for (const text of ['+1 555 0100', 'Used by 300+ projects', 'Cut it to 25 minutes', 'Reviews 2 million a day', 'ISO 27001']) {
            expect(findDates(text), text).toBeNull()
        }
    })
})
