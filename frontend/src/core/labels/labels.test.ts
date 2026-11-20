import {describe, expect, it} from 'vitest'
import {asLatinDigits, KNOWN_LABELS, LANGUAGES, labelsFor, translator, withDigits, type Labels} from './labels'

const keysOf = (labels: Labels) => ({sections: Object.keys(labels.sections), rows: Object.keys(labels.rows), page: Object.keys(labels.page)})

describe('the label tables', () => {
    it.each(LANGUAGES.map((info) => info.id))('give %s every word English has, none empty', (language) => {
        const labels = labelsFor(language)

        expect(keysOf(labels)).toEqual(keysOf(labelsFor('en')))

        for (const word of [...Object.values(labels.sections), ...Object.values(labels.rows), labels.page.present, labels.page.cm, labels.page.name, labels.page.work, labels.page.note, ...labels.page.months, ...labels.page.monthsShort]) {
            expect(word.trim()).not.toBe('')
        }

        expect(labels.page.months).toHaveLength(12)
        expect(labels.page.monthsShort).toHaveLength(12)
    })

    it('give each heading in a language a word of its own, so carrying it back finds the same one', () => {
        for (const info of LANGUAGES) {
            const sections = Object.values(labelsFor(info.id).sections)

            expect(new Set(sections.map((word) => word.toLowerCase())).size).toBe(sections.length)
        }
    })

    it('fall back to English for a language they do not have', () => {
        expect(labelsFor('xx').sections.experience).toBe('Experience')
    })

    it('know every heading in every language, lower case', () => {
        expect(KNOWN_LABELS).toContain('experience')
        expect(KNOWN_LABELS).toContain('কর্ম অভিজ্ঞতা')
    })
})

describe('carrying a word to another language', () => {
    it('takes the words the app wrote across, whatever their case', () => {
        const toBangla = translator('en', 'bn')

        expect(toBangla('Experience')).toBe('কর্ম অভিজ্ঞতা')
        expect(toBangla('date of birth')).toBe('জন্ম তারিখ')
    })

    it('leaves words the person wrote', () => {
        expect(translator('en', 'bn')('My open-source work')).toBe('My open-source work')
    })
})

describe('digits', () => {
    it('are written in Bangla when wanted, and left alone when not', () => {
        expect(withDigits('12 March 1996', 'bn', true)).toBe('১২ March ১৯৯৬')
        expect(withDigits('12 March 1996', 'bn', false)).toBe('12 March 1996')
        expect(withDigits('12 March 1996', 'en', true)).toBe('12 March 1996')
    })

    it('are read back as 0 to 9', () => {
        expect(asLatinDigits('১২/০৩/১৯৯৬')).toBe('12/03/1996')
    })
})
