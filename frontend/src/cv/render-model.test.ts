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

        expect(model.sections.map((section) => section.title)).toEqual(['Summary', 'Experience', 'Education', 'Skills', 'Languages'])
        expect(model.sections[1]).toMatchObject({kind: 'entries', entries: [{org: 'Harbourline Payments'}]})
        expect(renderModel(emptyCv()).sections).toEqual([])
    })

    it('writes links out in full, so a parser that drops links still has the address', () => {
        const model = renderModel(sampleCv())

        expect(model.contact.map((item) => item.text)).toEqual(['+1 555 0100', 'jane.doe@example.com', 'Dhaka, Bangladesh', 'example.com/jane-doe'])
        expect(model.contact[1]).toEqual({text: 'jane.doe@example.com', url: 'mailto:jane.doe@example.com', kind: 'email'})
        expect(model.contact[3].kind).toBe('web')
    })

    it('gives a link without a scheme one, so it opens', () => {
        const cv = sampleCv()
        const model = renderModel({...cv, person: {...cv.person, links: [{id: 'l', label: '', url: 'jane.example.com'}]}})

        expect(model.contact.at(-1)).toEqual({text: 'jane.example.com', url: 'https://jane.example.com', kind: 'web'})
    })
})

describe('lists with levels', () => {
    it('reads a level from the words in brackets', () => {
        const cv = sampleCv()
        const model = renderModel({...cv, sections: [{id: 'l', kind: 'tags', title: 'Languages', visible: true, groups: [{id: 'g', visible: true, label: '', items: ['Bangla (Native/Fluent)', 'English (Advanced)', 'Go'], showLevels: true, levels: []}]}]})
        const section = model.sections[0]

        expect(section.column).toBe('side')
        expect(section.kind === 'tags' && section.groups[0].list).toEqual([
            {name: 'Bangla', note: 'Native/Fluent', level: 5},
            {name: 'English', note: 'Advanced', level: 4},
            {name: 'Go', note: '', level: 0},
        ])
    })

    it('uses a level picked by hand over the words, and draws none while levels are off', () => {
        const cv = sampleCv()
        const group = {id: 'g', visible: true, label: '', items: ['Bangla (Native)', 'English'], showLevels: true, levels: [3, 4]}
        const levelsOf = (showLevels: boolean) => {
            const section = renderModel({...cv, sections: [{id: 'l', kind: 'tags', title: 'Languages', visible: true, groups: [{...group, showLevels}]}]}).sections[0]

            return section.kind === 'tags' ? [section.groups[0].levels, section.groups[0].list.map((item) => item.level)] : null
        }

        expect(levelsOf(true)).toEqual([true, [3, 4]])
        expect(levelsOf(false)).toEqual([false, [0, 0]])
    })

    it('puts the story in the main column and lists beside it', () => {
        const columns = renderModel(sampleCv()).sections.map((section) => `${section.title}:${section.column}`)

        expect(columns).toEqual(['Summary:main', 'Experience:main', 'Education:main', 'Projects:side', 'Skills:side', 'Languages:side'])
    })
})

describe('the plain text export', () => {
    it('reads top to bottom, each job with its own dates', () => {
        const text = plainText(renderModel(sampleCv()))

        expect(text.startsWith('Jane Doe\nSenior Software Engineer\n')).toBe(true)
        expect(text).toContain('Senior Software Engineer, Harbourline Payments\nDhaka, Bangladesh | Mar 2022 – Present\n• Led the rewrite')
        expect(text.indexOf('EXPERIENCE')).toBeLessThan(text.indexOf('EDUCATION'))
    })
})

describe('a details section, as a template is given it', () => {
    it('writes each row out, drops hidden and empty rows, and sits in the side column', () => {
        const rows = [
            {id: 'a', visible: true, label: ' Nationality ', kind: 'text' as const, value: 'British'},
            {id: 'b', visible: true, label: 'Date of birth', kind: 'date' as const, date: '1996-03-12', show: 'both' as const},
            {id: 'c', visible: false, label: 'Height', kind: 'height' as const, cm: 168, show: 'both' as const},
            {id: 'd', visible: true, label: 'Blood group', kind: 'text' as const, value: ' '},
        ]
        const cv = emptyCv()
        const model = renderModel({...cv, sections: [{id: 'p', kind: 'details', title: 'Personal details', visible: true, rows}]}, new Date(2026, 5, 1))

        expect(model.sections).toEqual([
            {
                kind: 'details',
                title: 'Personal details',
                column: 'side',
                rows: [
                    {label: 'Nationality', value: 'British'},
                    {label: 'Date of birth', value: '12 March 1996 (30 years)'},
                ],
            },
        ])
        expect(plainText(model)).toContain('Nationality: British\nDate of birth: 12 March 1996 (30 years)')
    })
})
