import {describe, expect, it} from 'vitest'
import {parseDocument, serializeDocument} from '../core/document/document-file'
import {allAt, cefrFor, cefrOfItems, cefrOfLevel, cefrOfWords, cefrSummary, levelOfCefr} from './cefr'
import {forCountry} from './countries'
import {cvType, emptyCv, type Cv} from './cv'
import {splitItem} from './levels'
import {renderModel} from './render-model'
import {sampleCv} from './sample'

const withLanguages = (cv: Cv, group: object): Cv => ({...cv, sections: [{id: 's', kind: 'tags', title: 'Languages', visible: true, groups: [{id: 'g', visible: true, label: '', showLevels: true, ...group} as never]}]})

describe('levels on the European scale', () => {
    it('map from dots out of five, and back', () => {
        expect([5, 4, 3, 2.5, 2, 1, 0].map(cefrOfLevel)).toEqual(['C2', 'C1', 'B2', 'B1', 'A2', 'A1', ''])
        expect(levelOfCefr('C1')).toBe(4)
        expect(levelOfCefr('native')).toBe(5)
    })

    it('are read from the words a CV writes', () => {
        expect(cefrOfWords('C1')).toEqual(allAt('C1'))
        expect(cefrOfWords('B2 B2 B1 B1 A2')).toEqual(['B2', 'B2', 'B1', 'B1', 'A2'])
        expect(cefrOfWords('Muttersprache')).toEqual(allAt('native'))
        expect(cefrOfWords('Fluent')).toBeNull()
    })

    it('are said in a few words', () => {
        expect(cefrSummary(allAt('C1'), 'Native')).toBe('C1')
        expect(cefrSummary(['B2', 'B2', 'B1', 'C1', 'B2'], 'Native')).toBe('B1–C1')
        expect(cefrSummary(allAt('native'), 'Muttersprache')).toBe('Muttersprache')
        expect(cefrSummary(allAt(''), 'Native')).toBe('')
    })

    it('follow their language when the list changes', () => {
        expect(cefrFor(['German', 'French'], {items: ['French', 'German'], cefr: [allAt('B1'), allAt('C1')]})).toEqual([allAt('C1'), allAt('B1')])
        expect(cefrFor(['Polish'], {items: [], cefr: []})).toEqual([allAt('')])
    })

    it('are taken from a list that writes them, and not from one that only says Fluent', () => {
        expect(cefrOfItems(['German (B2)', 'Bangla (Native)'], splitItem)).toEqual({items: ['German', 'Bangla'], cefr: [allAt('B2'), allAt('native')]})
        expect(cefrOfItems(['Bangla (Native)', 'English (Fluent)'], splitItem)).toBeNull()
        expect(cefrOfItems(['Bangla (Native)'], splitItem)).toBeNull()
    })
})

describe('a group of languages on the European scale, on the page', () => {
    const cv = withLanguages(sampleCv(), {items: ['Bangla', 'German'], levels: [0, 0], cefr: [allAt('native'), ['B2', 'B2', 'B1', 'B1', 'A2']]})

    it('says each level in words for every template, with dots from the highest', () => {
        const section = renderModel(cv).sections[0]
        const group = section.kind === 'tags' ? section.groups[0] : null

        expect(group?.items).toBe('Bangla (Native), German (A2–B2)')
        expect(group?.list.map((item) => [item.note, item.level])).toEqual([
            ['Native', 5],
            ['A2–B2', 3],
        ])
    })

    it('gives the European template each skill, and first languages apart', () => {
        const section = renderModel(cv).sections[0]
        const group = section.kind === 'tags' ? section.groups[0] : null

        expect(group?.cefr).toEqual([
            {name: 'Bangla', native: true, levels: allAt('native').map(() => 'Native')},
            {name: 'German', native: false, levels: ['B2', 'B2', 'B1', 'B1', 'A2']},
        ])
        expect(renderModel(withLanguages(emptyCv('de'), {items: [], levels: [], cefr: []})).words.cefr.listening).toBe('Hören')
    })

    it('starts a new Europass CV, whose languages begin on the scale', () => {
        const europass = forCountry(emptyCv(), 'europass', true)
        const languages = europass.sections.find((section) => section.title === 'Languages')

        expect(languages?.kind === 'tags' && languages.groups[0].cefr).toEqual([])
    })

    it('is kept when the CV is saved and opened, and a CV from before it opens as it was', () => {
        expect(parseDocument(serializeDocument({name: 'CV', content: cv}, cvType), cvType).content).toEqual(cv)

        const old = sampleCv()
        const text = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: old}, cvType)), version: 11})

        expect(parseDocument(text, cvType).content).toEqual(old)
    })
})
