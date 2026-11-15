import {describe, expect, it} from 'vitest'
import {parseAnyDocument, serializeDocument} from '../core/document/document-file'
import {DOCUMENT_TYPES} from '../store/document-types'
import {biodataType, emptyBiodata} from './biodata'
import {BIODATA_SECTION_CHOICES} from './edit-ops'
import {biodataRenderModel, isBlank} from './render-model'
import {sampleBiodata} from './sample'

const ON = new Date(2026, 10, 15)

describe('a new biodata', () => {
    it('has the usual sections in order, with labels and nothing filled in', () => {
        const biodata = emptyBiodata()

        expect(biodata.sections.map((section) => section.title)).toEqual(['Personal details', 'Education', 'Work', 'Family', 'About me', 'Expectations', 'Contact'])
        expect(biodata.heading).toEqual({text: '', image: ''})
        expect(isBlank(biodataRenderModel(biodata, ON))).toBe(true)
    })

    it('is saved as a biodata, and opens again as one', () => {
        const biodata = sampleBiodata()
        const text = serializeDocument({name: 'Jane', content: biodata}, biodataType)
        const loaded = parseAnyDocument(text, DOCUMENT_TYPES)

        expect(JSON.parse(text).kind).toBe('biodata')
        expect(loaded.type.kind).toBe('biodata')
        expect(loaded.content).toEqual(biodata)
    })
})

describe('what a biodata template is given', () => {
    it('writes out the age and the height, and the family without the empty rows', () => {
        const biodata = sampleBiodata()
        const model = biodataRenderModel(
            {
                ...biodata,
                sections: biodata.sections.map((section) => (section.kind === 'family' ? {...section, members: [...section.members, {id: 'x', visible: true, relation: 'Uncle', name: '', work: '', note: ''}]} : section)),
            },
            ON,
        )
        const personal = model.sections.find((section) => section.title === 'Personal details')
        const family = model.sections.find((section) => section.kind === 'family')

        expect(personal?.kind === 'details' && personal.rows.slice(0, 2)).toEqual([
            {label: 'Date of birth', value: '12 March 1996 (30 years)'},
            {label: 'Height', value: '5′ 4″ (163 cm)'},
        ])
        expect(family?.kind === 'family' && family.members.map((member) => member.relation)).toEqual(['Father', 'Mother', 'Brother', 'Sister'])
    })

    it('leaves out a picture kept off the page', () => {
        const picture = 'data:image/png;base64,iVBORw0KGgo='
        const biodata = {...sampleBiodata(), person: {name: 'Jane Doe', photo: picture, fullPhoto: picture, hide: ['fullPhoto' as const]}}
        const model = biodataRenderModel(biodata, ON)

        expect([model.photo, model.fullPhoto]).toEqual([picture, ''])
    })
})

describe('"Add a section" in a biodata', () => {
    it('offers ready sets with labels only, and never a value', () => {
        const sets = BIODATA_SECTION_CHOICES.filter((choice) => choice.group === 'sets').map((choice) => choice.make())

        expect(sets.map((section) => section.title)).toEqual(['Horoscope', 'Religious practice', 'Lifestyle', 'More about me'])

        for (const section of sets) {
            expect(section.kind).toBe('details')
            expect(section.kind === 'details' && section.rows.every((row) => row.label !== '' && row.kind === 'text' && row.value === '')).toBe(true)
        }
    })
})
