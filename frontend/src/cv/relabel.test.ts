import {describe, expect, it} from 'vitest'
import {emptyBiodata} from '../biodata/biodata'
import {emptyCv} from './cv'
import {inLanguage} from './relabel'

describe('carrying a document into another language', () => {
    it('gives the app own headings the new language', () => {
        const cv = inLanguage(emptyCv(), 'bn')

        expect(cv.design.language).toBe('bn')
        expect(cv.sections.map((section) => section.title)).toEqual(['সারসংক্ষেপ', 'কর্ম অভিজ্ঞতা', 'শিক্ষাগত যোগ্যতা', 'দক্ষতা'])
    })

    it('keeps a heading the person wrote themselves', () => {
        const cv = emptyCv()
        const mine = {...cv, sections: [{...cv.sections[0], title: 'What I do'}, ...cv.sections.slice(1)]}

        expect(inLanguage(mine, 'bn').sections[0].title).toBe('What I do')
    })

    it('carries labels and relations in a biodata, and back again', () => {
        const biodata = inLanguage(emptyBiodata(), 'bn')
        const family = biodata.sections.find((section) => section.kind === 'family')

        expect(family?.kind === 'family' && family.members.map((member) => member.relation)).toEqual(['পিতা', 'মাতা'])
        const words = (doc: ReturnType<typeof emptyBiodata>) => doc.sections.flatMap((section) => [section.title, ...(section.kind === 'details' ? section.rows.map((row) => row.label) : []), ...(section.kind === 'family' ? section.members.map((member) => member.relation) : [])])

        expect(words(inLanguage(biodata, 'en'))).toEqual(words(emptyBiodata()))
    })

    it('leaves what the person wrote under the headings', () => {
        const cv = emptyCv()
        const filled = {...cv, sections: [{...cv.sections[0], kind: 'text' as const, text: 'Summary of my career'}]}
        const moved = inLanguage(filled, 'bn').sections[0]

        expect(moved.kind === 'text' && moved.text).toBe('Summary of my career')
    })
})
