import {describe, expect, it} from 'vitest'
import {parseDocument, serializeDocument} from '../core/document/document-file'
import {checkCv} from './ats-check'
import {forCountry} from './countries'
import {cvType, emptyCv, NO_CLOSING, type Cv} from './cv'
import {closingText, renderModel} from './render-model'
import {sampleCv} from './sample'

const ON = new Date(2026, 10, 19)

const closing = (cv: Cv, values: Partial<Cv['closing']>): Cv => ({...cv, closing: {...cv.closing, show: true, ...values}})

describe('the closing line', () => {
    it('says nothing until it is turned on', () => {
        expect(renderModel(sampleCv(), ON)).toMatchObject({closing: '', signature: ''})
    })

    it('writes the place and today’s date in the CV’s date style and language', () => {
        const german = {...emptyCv('de'), design: {...emptyCv('de').design, dateStyle: 'numeric-dot' as const}}

        expect(closingText(closing(german, {place: 'Berlin'}), ON)).toBe('Berlin, 19.11.2026')
        expect(closingText(closing(emptyCv(), {place: 'Dhaka'}), ON)).toBe('Dhaka, 19 November 2026')
        expect(closingText(closing(emptyCv('bn'), {place: 'ঢাকা'}), ON)).toBe('ঢাকা, 19 নভেম্বর 2026')
        expect(closingText(closing(emptyCv(), {}), ON)).toBe('19 November 2026')
    })

    it('keeps a fixed day', () => {
        expect(closingText(closing(emptyCv(), {place: 'Paris', date: '2026-01-05'}), ON)).toBe('Paris, 5 January 2026')
    })

    it('hands the signature to the template only while the line is on', () => {
        const signed = closing(sampleCv(), {signature: 'data:image/png;base64,AAAA'})

        expect(renderModel(signed, ON).signature).toBe('data:image/png;base64,AAAA')
        expect(renderModel({...signed, closing: {...signed.closing, show: false}}, ON).signature).toBe('')
    })

    it('starts on for a new CV for Germany or South Asia, and Check suggests it there', () => {
        expect(forCountry(emptyCv('de'), 'dach', true).closing.show).toBe(true)
        expect(forCountry(emptyCv(), 'south-asia', true).closing.show).toBe(true)
        expect(forCountry(emptyCv(), 'us', true).closing.show).toBe(false)

        const german = {...sampleCv(), design: {...sampleCv().design, country: 'dach' as const}}

        expect(checkCv(german, 1).some((result) => result.id === 'country-closing')).toBe(true)
        expect(checkCv(closing(german, {}), 1).some((result) => result.id === 'country-closing')).toBe(false)
    })

    it('is off in a CV saved before it existed', () => {
        const cv = sampleCv()
        const {closing: _closing, ...old} = cv
        const text = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: cv}, cvType)), version: 10, content: old})

        expect(_closing).toEqual(NO_CLOSING)
        expect(parseDocument(text, cvType).content.closing).toEqual(NO_CLOSING)
    })
})
