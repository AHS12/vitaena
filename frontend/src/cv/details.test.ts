import {describe, expect, it} from 'vitest'
import {ageOn, cmOf, dayText, detailValue, emptyDetailRow, feetAndInches, heightText} from './details'
import {cvType, emptyCv} from './cv'
import {parseDocument, serializeDocument} from '../core/document/document-file'

const ON = new Date(2026, 2, 12)

describe('a date on a details row', () => {
    it('is written as the day, the month in full and the year', () => {
        expect(dayText('1996-03-12')).toBe('12 March 1996')
        expect(dayText('')).toBe('')
    })

    it('turns a year older on the birthday itself, not the day before', () => {
        expect(ageOn('1996-03-12', ON)).toBe(30)
        expect(ageOn('1996-03-13', ON)).toBe(29)
        expect(ageOn('2030-01-01', ON)).toBeNull()
    })

    it('shows as the date, the age or both, as the person picked', () => {
        const row = {...emptyDetailRow('date', 'Date of birth'), date: '1996-03-12'}

        expect(detailValue({...row, show: 'date'} as typeof row, ON)).toBe('12 March 1996')
        expect(detailValue({...row, show: 'age'} as typeof row, ON)).toBe('30 years')
        expect(detailValue({...row, show: 'both'} as typeof row, ON)).toBe('12 March 1996 (30 years)')
    })
})

describe('a height on a details row', () => {
    it('is kept in centimetres and shown in feet and inches to the nearest inch', () => {
        expect(feetAndInches(168)).toEqual({feet: 5, inches: 6})
        expect(heightText(168, 'ft-in')).toBe('5′ 6″')
        expect(heightText(168, 'cm')).toBe('168 cm')
        expect(heightText(168, 'both')).toBe('5′ 6″ (168 cm)')
        expect(heightText(0, 'both')).toBe('')
    })

    it('comes back as the same feet and inches it was typed in', () => {
        for (let inches = 48; inches < 90; inches += 1) {
            expect(feetAndInches(cmOf(Math.floor(inches / 12), inches % 12))).toEqual({feet: Math.floor(inches / 12), inches: inches % 12})
        }
    })
})

describe('a CV saved before details sections', () => {
    it('opens unchanged, as the current version', () => {
        const cv = emptyCv()
        const old = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: cv}, cvType)), version: 7})

        expect(parseDocument(old, cvType).content).toEqual(cv)
    })
})
