import JSZip from 'jszip'
import {describe, expect, it} from 'vitest'
import {biodataDocx} from './docx-export'
import {biodataRenderModel} from './render-model'
import {sampleBiodata} from './sample'

describe('a biodata as a Word file', () => {
    it('holds every value, the details and the family as tables', async () => {
        const zip = await JSZip.loadAsync(await biodataDocx(biodataRenderModel(sampleBiodata(), new Date(2026, 10, 15))))
        const xml = await zip.file('word/document.xml')!.async('string')

        for (const value of ['Jane Doe', 'Date of birth', '12 March 1996 (30 years)', '5′ 4″ (163 cm)', 'MSc in Economics, Riverside University', 'Retired civil engineer', 'Married', '+1 555 0100']) {
            expect(xml, value).toContain(value)
        }

        // Personal details, the family and the contact: three tables.
        expect(xml.match(/<w:tbl>/g)).toHaveLength(3)
    })
})
