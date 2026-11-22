import {describe, expect, it} from 'vitest'
import {fontFamilies, scriptFilesFor, scriptsIn} from './fonts'

describe('the fonts a template is given', () => {
    it('starts with the chosen font and follows a sans with the sans Bangla font', () => {
        expect(fontFamilies('lato')).toEqual(['Lato', 'Inter', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans SC', 'Noto Sans KR'])
    })

    it('follows a serif with Source Serif, for letters it lacks, then the serif Bangla font', () => {
        expect(fontFamilies('eb-garamond')).toEqual(['EB Garamond', 'Source Serif 4', 'Noto Serif Bengali', 'Noto Serif Devanagari', 'Noto Naskh Arabic', 'Noto Sans SC', 'Noto Sans KR', 'Inter'])
    })

    it('names Inter only once when it is the chosen font', () => {
        expect(fontFamilies('inter')).toEqual(['Inter', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans SC', 'Noto Sans KR'])
    })

    it('falls back to Inter for a font it does not know', () => {
        expect(fontFamilies('gone')[0]).toBe('Inter')
    })
})

describe('the scripts in a document', () => {
    it('finds Bangla letters among English ones', () => {
        expect(scriptsIn('{"name":"Jane জেন"}')).toEqual(['bengali'])
    })

    it('finds none in English', () => {
        expect(scriptsIn('Jane Doe, Engineer')).toEqual([])
        expect(scriptFilesFor('Jane Doe')).toEqual([])
    })

    it('needs both Bangla fonts once there is Bangla, since a template may pick either', () => {
        const files = scriptFilesFor('অভিজ্ঞতা')

        expect(files.some((file) => file.includes('noto-sans-bengali'))).toBe(true)
        expect(files.some((file) => file.includes('noto-serif-bengali'))).toBe(true)
    })
})

describe('a font the person added', () => {
    it('is named by its family, before the bundled fonts', () => {
        expect(fontFamilies('custom:Merriweather')).toEqual(['Merriweather', 'Inter', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans SC', 'Noto Sans KR'])
    })

    it('for Bangla, comes before the bundled Bangla font, which takes any letter it lacks', () => {
        expect(fontFamilies('inter', 'custom:Kalpurush')).toEqual(['Inter', 'Kalpurush', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans SC', 'Noto Sans KR'])
    })
})
