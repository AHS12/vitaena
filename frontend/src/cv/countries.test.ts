import {describe, expect, it} from 'vitest'
import {parseDocument, serializeDocument} from '../core/document/document-file'
import {checkCv} from './ats-check'
import {COUNTRIES, forCountry, templatesFor, withFix} from './countries'
import {cvType, emptyCv, type Cv} from './cv'
import {datesText, renderModel} from './render-model'
import {sampleCv} from './sample'
import {CV_TEMPLATES} from './templates/templates'

const PHOTO = 'data:image/png;base64,AAAA'

const forPlace = (cv: Cv, country: Cv['design']['country']) => checkCv({...cv, design: {...cv.design, country}}, 1).filter((result) => result.country)

describe('choosing where a CV is for', () => {
    it('sets the paper and how dates are written', () => {
        const us = forCountry(emptyCv(), 'us', true)
        const germany = forCountry(emptyCv('de'), 'dach', true)

        expect(us.design).toMatchObject({country: 'us', paper: 'us-letter', dateStyle: 'month-name'})
        expect(germany.design).toMatchObject({country: 'dach', paper: 'a4', dateStyle: 'numeric-dot'})
    })

    it('gives a new CV the sections CVs there usually have, in its language', () => {
        const germany = forCountry(emptyCv('de'), 'dach', true)

        expect(germany.sections.map((section) => section.title)).toEqual(['Profil', 'Persönliche Daten', 'Berufserfahrung', 'Ausbildung', 'Kenntnisse', 'Sprachen'])

        const details = germany.sections[1]

        expect(details.kind === 'details' && details.rows.map((row) => [row.label, row.kind])).toEqual([
            ['Geburtsdatum', 'date'],
            ['Geburtsort', 'text'],
            ['Staatsangehörigkeit', 'text'],
            ['Familienstand', 'text'],
        ])
        expect(forCountry(emptyCv(), 'gulf', true).sections[1]).toMatchObject({kind: 'details', rows: [{label: 'Nationality'}, {label: 'Visa status'}, {label: 'Driving licence'}, {label: 'Date of birth', show: 'date'}, {label: 'Marital status'}]})
        expect(forCountry(emptyCv(), 'europass', true).sections.map((section) => section.title)).toContain('Digital skills')
        expect(forCountry(emptyCv(), 'us', true).sections).toHaveLength(4)
    })

    it('leaves the sections of a CV with work in it, and its photo, as they are', () => {
        const cv = {...sampleCv(), person: {...sampleCv().person, photo: PHOTO}}
        const placed = forCountry(cv, 'us', false)

        expect(placed.sections).toBe(cv.sections)
        expect(placed.person).toBe(cv.person)
    })

    it('leaves the paper and dates alone for Anywhere', () => {
        const cv = forCountry(emptyCv(), 'us', true)

        expect(forCountry(cv, 'any', false).design).toMatchObject({country: 'any', paper: 'us-letter'})
    })

    it('puts the templates that suit it first, and keeps every other', () => {
        const ids = CV_TEMPLATES.map((template) => template.id)
        const {suited, rest} = templatesFor(ids, 'us')

        expect(suited[0]).toBe(COUNTRIES.find((country) => country.id === 'us')!.templates.find((id) => ids.includes(id)))
        expect([...suited, ...rest].sort()).toEqual([...ids].sort())
        expect(templatesFor(ids, 'any')).toEqual({suited: [], rest: ids})
    })
})

describe('dates in the place’s way', () => {
    const entry = {start: '2020-01', end: '2022-06', current: false}

    it('writes months by name, as numbers with a slash or a dot, or years alone', () => {
        expect(datesText(entry, {language: 'en', digits: 'latin', dateStyle: 'month-name'})).toBe('Jan 2020 – Jun 2022')
        expect(datesText(entry, {language: 'en', digits: 'latin', dateStyle: 'numeric-slash'})).toBe('01/2020 – 06/2022')
        expect(datesText(entry, {language: 'de', digits: 'latin', dateStyle: 'numeric-dot'})).toBe('01.2020 – 06.2022')
        expect(datesText({...entry, end: '', current: true}, {language: 'de', digits: 'latin', dateStyle: 'numeric-dot'})).toBe('01.2020 – heute')
        expect(datesText(entry, {language: 'en', digits: 'latin', dateStyle: 'year'})).toBe('2020 – 2022')
        expect(datesText({start: '2020-01', end: '2020-09', current: false}, {language: 'en', digits: 'latin', dateStyle: 'year'})).toBe('2020')
    })

    it('reach the page through the render model', () => {
        const cv = sampleCv()
        const section = renderModel({...cv, design: {...cv.design, dateStyle: 'numeric-slash'}}).sections.find((each) => each.kind === 'entries')

        expect(section?.kind === 'entries' && section.entries[0].dates).toMatch(/^\d{2}\/\d{4} – /)
    })
})

describe('a CV saved before places and date styles', () => {
    it('opens for Anywhere, with dates by name, and lays out as before', () => {
        const cv = sampleCv()
        const oldDesign: Record<string, unknown> = {...cv.design}

        delete oldDesign.country
        delete oldDesign.dateStyle

        const old = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: cv}, cvType)), version: 9, content: {...cv, design: oldDesign}})
        const opened = parseDocument(old, cvType).content

        expect(opened.design).toMatchObject({country: 'any', dateStyle: 'month-name'})
        expect(renderModel(opened)).toEqual(renderModel(cv))
    })
})

describe('Check for a place', () => {
    const withPhoto = {...sampleCv(), person: {...sampleCv().person, photo: PHOTO}}

    it('says nothing of its own for Anywhere', () => {
        expect(forPlace(withPhoto, 'any')).toEqual([])
    })

    it('warns that US employers set aside resumes with a photo, and offers to hide it', () => {
        const photo = forPlace(withPhoto, 'us').find((result) => result.id === 'country-photo')

        expect(photo).toMatchObject({level: 'warning', fix: 'hide-photo'})
        expect(forPlace(withFix(withPhoto, 'hide-photo'), 'us').some((result) => result.id === 'country-photo')).toBe(false)
        expect(checkCv({...withPhoto, design: {...withPhoto.design, country: 'us'}}, 1).some((result) => result.id === 'photo')).toBe(false)
    })

    it('suggests a photo where one is usual', () => {
        expect(forPlace(sampleCv(), 'dach').find((result) => result.id === 'country-photo')).toMatchObject({level: 'tip'})
    })

    it('points out personal details for the US, gently for the UK', () => {
        const german = forCountry(emptyCv(), 'dach', true)
        const filled = {...german, sections: german.sections.map((section) => (section.kind === 'details' ? {...section, rows: section.rows.map((row) => (row.kind === 'date' ? {...row, date: '1996-03-12'} : row.kind === 'text' ? {...row, value: 'x'} : row))} : section))}

        expect(forPlace(filled, 'us').find((result) => result.id === 'country-personal')).toMatchObject({level: 'warning'})
        expect(forPlace(filled, 'us').find((result) => result.id === 'country-personal')?.detail).toContain('Date of birth')
        expect(forPlace(filled, 'uk-ie').find((result) => result.id === 'country-personal')).toMatchObject({level: 'tip'})
        expect(forPlace(filled, 'dach').some((result) => result.id === 'country-personal')).toBe(false)
    })

    it('offers the place’s paper', () => {
        const paper = forPlace(sampleCv(), 'us').find((result) => result.id === 'country-paper')

        expect(paper).toMatchObject({fix: 'paper', fixLabel: 'Use US Letter'})
        expect(withFix({...sampleCv(), design: {...sampleCv().design, country: 'us'}}, 'paper').design.paper).toBe('us-letter')
    })

    it('counts pages against what the place expects', () => {
        const cv = {...sampleCv(), design: {...sampleCv().design, country: 'dach' as const}}

        expect(checkCv(cv, 3).find((result) => result.id === 'country-length')?.title).toBe('3 pages is long for Germany, Austria and Switzerland')
        expect(checkCv(cv, 2).some((result) => result.id === 'country-length')).toBe(false)
        expect(checkCv({...cv, design: {...cv.design, country: 'us'}}, 2).find((result) => result.id === 'country-length')?.title).toBe('One page is usual in the US')
    })

    it('asks the Gulf for a nationality, and Europass for language levels', () => {
        expect(forPlace(sampleCv(), 'gulf').some((result) => result.id === 'country-nationality')).toBe(true)
        expect(forPlace(forCountry(emptyCv(), 'gulf', true), 'gulf').some((result) => result.id === 'country-nationality')).toBe(false)

        const cv = sampleCv()
        const languages = cv.sections.map((section) => (section.kind === 'tags' && section.title === 'Languages' ? {...section, groups: [{id: 'g', visible: true, label: '', items: ['German (B2)', 'French'], showLevels: false, levels: []}]} : section))

        expect(forPlace({...cv, sections: languages}, 'europass').find((result) => result.id === 'country-cefr')?.title).toBe('One language has no European level')
    })
})
