import {describe, expect, it} from 'vitest'
import {parseDocument, serializeDocument} from '../core/document/document-file'
import {biodataType, emptyBiodata, NO_SECOND} from './biodata'
import {setSecondLabel, withSecondLanguage} from './edit-ops'
import {biodataRenderModel} from './render-model'
import {sampleBiodata} from './sample'

describe('second labels on a biodata', () => {
    it('fill in, in the other language, every heading, label and relation the app wrote', () => {
        const biodata = withSecondLanguage(sampleBiodata('bn'), 'en')
        const personal = biodata.sections[0]
        const family = biodata.sections.find((section) => section.kind === 'family')

        expect(biodata.second.language).toBe('en')
        expect(biodata.second.labels[personal.id]).toBe('Personal details')
        expect(personal.kind === 'details' && biodata.second.labels[personal.rows[0].id]).toBe('Date of birth')
        expect(family?.kind === 'family' && biodata.second.labels[family.members[0].id]).toBe('Father')
    })

    it('leave one the person wrote, and any they typed already', () => {
        const start = sampleBiodata()
        const mine = {...start, sections: [{...start.sections[0], title: 'All about me'}, ...start.sections.slice(1)]}
        const typed = setSecondLabel(mine, mine.sections[1].id, 'লেখাপড়া')
        const biodata = withSecondLanguage(typed, 'bn')

        expect(biodata.second.labels[mine.sections[0].id]).toBeUndefined()
        expect(biodata.second.labels[mine.sections[1].id]).toBe('লেখাপড়া')
    })

    it('go to the page under the first, and stay kept, hidden, when turned off', () => {
        const biodata = withSecondLanguage(sampleBiodata('bn'), 'en')
        const on = biodataRenderModel(biodata)
        const off = biodataRenderModel(withSecondLanguage(biodata, ''))

        expect(on.sections[0].second).toBe('Personal details')
        expect(on.sections[0].kind === 'details' && on.sections[0].rows[0].second).toBe('Date of birth')
        expect(off.sections[0].second).toBe('')
        expect(withSecondLanguage(biodata, '').second.labels).toEqual(biodata.second.labels)
    })

    it('are empty in a new biodata', () => {
        expect(emptyBiodata().second).toEqual(NO_SECOND)
    })

    it('are none in a biodata saved before they existed', () => {
        const biodata = emptyBiodata()
        const {second: _none, ...old} = biodata
        const file = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: biodata}, biodataType)), version: 2, content: old})

        expect(_none).toEqual(NO_SECOND)
        expect(parseDocument(file, biodataType).content).toEqual(biodata)
    })
})
