import {describe, expect, it} from 'vitest'
import {plainText} from './cv-export'
import {emptyCv} from './cv'
import {datesText, monthText, renderModel} from './render-model'
import {sampleCv} from './sample'

describe('dates on a CV', () => {
    it('writes a month as its short name and year', () => {
        expect(monthText('2023-01')).toBe('Jan 2023')
        expect(monthText('')).toBe('')
    })

    it('says Present for a job someone is still in', () => {
        expect(datesText({start: '2020-01', end: '', current: true})).toBe('Jan 2020 – Present')
    })

    it('writes one date once, when it starts and ends in the same month', () => {
        expect(datesText({start: '2023-09', end: '2023-09', current: false})).toBe('Sep 2023')
    })

    it('writes whichever end is known', () => {
        expect(datesText({start: '', end: '2021-03', current: false})).toBe('Mar 2021')
    })
})

describe('what a template is given', () => {
    it('leaves out hidden sections, hidden entries and empty sections', () => {
        const cv = sampleCv()
        const sections = cv.sections.map((section) => {
            if (section.id === 'projects') {
                return {...section, visible: false}
            }

            if (section.kind === 'entries' && section.id === 'experience') {
                return {...section, entries: section.entries.map((entry, index) => ({...entry, visible: index === 0}))}
            }

            return section
        })
        const model = renderModel({...cv, sections})

        expect(model.sections.map((section) => section.title)).toEqual(['Summary', 'Experience', 'Education', 'Skills'])
        expect(model.sections[1]).toMatchObject({kind: 'entries', entries: [{org: 'Bkash Labs'}]})
        expect(renderModel(emptyCv()).sections).toEqual([])
    })

    it('writes links out in full, so a parser that drops links still has the address', () => {
        const model = renderModel(sampleCv())

        expect(model.contact.map((item) => item.text)).toEqual(['nadia.rahman@example.com', '+880 1700 000000', 'Dhaka, Bangladesh', 'linkedin.com/in/nadia-rahman-example'])
        expect(model.contact[0].url).toBe('mailto:nadia.rahman@example.com')
    })

    it('gives a link without a scheme one, so it opens', () => {
        const cv = sampleCv()
        const model = renderModel({...cv, person: {...cv.person, links: [{id: 'l', label: '', url: 'nadia.dev'}]}})

        expect(model.contact.at(-1)).toEqual({text: 'nadia.dev', url: 'https://nadia.dev'})
    })
})

describe('the plain text export', () => {
    it('reads top to bottom, each job with its own dates', () => {
        const text = plainText(renderModel(sampleCv()))

        expect(text.startsWith('Nadia Rahman\nSenior Software Engineer\n')).toBe(true)
        expect(text).toContain('Senior Software Engineer, Bkash Labs\nDhaka, Bangladesh | Mar 2022 – Present\n• Led the rewrite')
        expect(text.indexOf('EXPERIENCE')).toBeLessThan(text.indexOf('EDUCATION'))
    })
})
