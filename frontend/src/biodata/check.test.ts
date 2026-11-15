import {describe, expect, it} from 'vitest'
import {emptyBiodata, type Biodata} from './biodata'
import {checkBiodata} from './check'
import {sampleBiodata} from './sample'

const PICTURE = 'data:image/png;base64,iVBORw0KGgo='
const levels = (biodata: Biodata, pages: number | null = 1) => Object.fromEntries(checkBiodata(biodata, pages).map((result) => [result.id, result.level]))

describe('the check on a biodata', () => {
    it('asks for the essentials a new biodata is missing', () => {
        expect(levels(emptyBiodata())).toMatchObject({name: 'warning', photo: 'warning', birth: 'warning', contact: 'warning', family: 'tip'})
    })

    it('finds them all in a filled-in biodata with a photo', () => {
        const biodata = sampleBiodata()

        expect(levels({...biodata, person: {...biodata.person, photo: PICTURE}})).toEqual({name: 'good', photo: 'good', birth: 'good', contact: 'good', length: 'good', readable: 'good'})
    })

    it('counts a date of birth written as words, and a phone outside the Contact section', () => {
        const biodata = emptyBiodata()
        const sections = biodata.sections.map((section) =>
            section.kind === 'details' && section.title === 'Personal details'
                ? {
                      ...section,
                      rows: [
                          {id: 'a', visible: true, label: 'Date of birth', kind: 'text' as const, value: '12 March 1996'},
                          {id: 'b', visible: true, label: 'Mobile', kind: 'text' as const, value: '+1 555 0100'},
                      ],
                  }
                : section.title === 'Contact'
                  ? {...section, visible: false}
                  : section,
        )

        expect(levels({...biodata, sections})).toMatchObject({birth: 'good', contact: 'good'})
    })

    it('says more than two pages is longer than families expect', () => {
        expect(levels(sampleBiodata(), 3).length).toBe('warning')
        expect(levels(sampleBiodata(), 2).length).toBe('good')
    })

    it('warns when the text would be hard to read once shared as a picture', () => {
        const biodata = sampleBiodata()
        const at = (fontSize: number) => levels({...biodata, design: {...biodata.design, fontSize}}).readable

        expect([at(8.5), at(9), at(10)]).toEqual(['warning', 'tip', 'good'])
    })
})
