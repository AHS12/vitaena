import {describe, expect, it} from 'vitest'
import {biodataType, emptyBiodata} from '../biodata/biodata'
import {biodataRenderModel} from '../biodata/render-model'
import {sampleBiodata} from '../biodata/sample'
import {parseDocument, serializeDocument} from '../core/document/document-file'
import {checkCv} from './ats-check'
import {cvType, emptyCv} from './cv'
import {detailValue} from './details'
import {cvSectionChoices} from './editor/edit-ops'
import {dayOf, heightOf} from './import/biodata-parse'
import {findDates} from './import/dates'
import {knownHeading} from './import/headings'
import {languageOfHeadings} from './import/parse'
import {datesText, renderModel} from './render-model'
import {sampleCv} from './sample'

const BANGLA = {language: 'bn', digits: 'native'} as const

/** A design as files before version 9 of a CV, and 2 of a biodata, saved it. */
function withoutWriting(design: object): object {
    const old: Record<string, unknown> = {...design}

    delete old.language
    delete old.digits
    delete old.scriptFont

    return old
}
const BANGLA_LATIN_DIGITS = {language: 'bn', digits: 'latin'} as const

describe('a document in Bangla', () => {
    it('starts with its headings and labels in Bangla', () => {
        expect(emptyCv('bn').sections.map((section) => section.title)).toEqual(['সারসংক্ষেপ', 'কর্ম অভিজ্ঞতা', 'শিক্ষাগত যোগ্যতা', 'দক্ষতা'])
        expect(emptyBiodata('bn').sections[0].title).toBe('ব্যক্তিগত তথ্য')
        expect(emptyCv('bn').design.language).toBe('bn')
    })

    it('adds sections with Bangla headings from an English menu', () => {
        const experience = cvSectionChoices('bn').find((choice) => choice.id === 'Experience')

        expect(experience?.label).toBe('Experience · কর্ম অভিজ্ঞতা')
        expect(experience?.make().title).toBe('কর্ম অভিজ্ঞতা')
    })

    it('writes dates with Bangla months, "বর্তমান" and Bangla digits', () => {
        expect(datesText({start: '2020-01', end: '', current: true}, BANGLA)).toBe('জানুয়ারি ২০২০ – বর্তমান')
        expect(datesText({start: '2019-03', end: '2021-11', current: false}, BANGLA_LATIN_DIGITS)).toBe('মার্চ 2019 – নভেম্বর 2021')
    })

    it('writes a date of birth, an age and a height in Bangla', () => {
        const today = new Date(2026, 10, 15)

        expect(detailValue({id: 'r', visible: true, label: '', kind: 'date', date: '1996-03-12', show: 'both'}, today, BANGLA)).toBe('১২ মার্চ ১৯৯৬ (৩০ বছর)')
        expect(detailValue({id: 'r', visible: true, label: '', kind: 'height', cm: 163, show: 'both'}, today, BANGLA)).toBe('৫′ ৪″ (১৬৩ সেমি)')
    })

    it('tells the templates its language, and that it is not in Latin letters', () => {
        const {design} = renderModel(sampleCv('bn'))

        expect(design.lang).toBe('bn')
        expect(design.latin).toBe(false)
        expect(biodataRenderModel(sampleBiodata('bn')).design.lang).toBe('bn')
    })

    it("leaves the person's own numbers as they wrote them", () => {
        const cv = sampleCv('bn')
        const model = renderModel({...cv, design: {...cv.design, digits: 'native'}, sections: [{id: 's', kind: 'text', title: 'সারসংক্ষেপ', visible: true, text: 'Nine years, 2 million a day'}]})

        expect(JSON.stringify(model.sections)).toContain('Nine years, 2 million a day')
    })

    it('gets the Bangla font chosen for it, after the main font', () => {
        const cv = sampleCv('bn')

        expect(renderModel({...cv, design: {...cv.design, scriptFont: 'tiro-bangla'}}).design.fonts).toEqual(['Inter', 'Tiro Bangla', 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans JP'])
    })

    it('is told in Check that screening software looks for English headings', () => {
        const results = checkCv(sampleCv('bn'), 2)

        expect(results.find((result) => result.id === 'language')?.title).toBe('Your headings are in Bangla')
        expect(results.find((result) => result.id === 'headings')?.level).toBe('good')
        expect(results.some((result) => result.id === 'experience')).toBe(false)
    })
})

describe('files saved before documents had a language', () => {
    it('open as English, with 0 to 9 in a CV and the matching Bangla font', () => {
        const cv = emptyCv()
        const oldDesign = withoutWriting(cv.design)
        const old = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: cv}, cvType)), version: 8, content: {...cv, design: oldDesign}})

        expect(parseDocument(old, cvType).content).toEqual(cv)
    })

    it('open as English for a biodata too', () => {
        const biodata = emptyBiodata()
        const oldDesign = withoutWriting(biodata.design)
        const old = JSON.stringify({...JSON.parse(serializeDocument({name: 'Old', content: biodata}, biodataType)), version: 1, content: {...biodata, design: oldDesign}})

        expect(parseDocument(old, biodataType).content).toEqual(biodata)
    })
})

describe('importing a document written in Bangla', () => {
    it('knows Bangla headings and what they start', () => {
        expect(knownHeading('কর্ম অভিজ্ঞতা')).toBe('entries')
        expect(knownHeading('শিক্ষাগত যোগ্যতা')).toBe('entries')
        expect(knownHeading('পারিবারিক তথ্য')).toBe('family')
        expect(knownHeading('দক্ষতা:')).toBe('tags')
    })

    it('reads dates with Bangla digits, months and "বর্তমান"', () => {
        expect(findDates('সফটওয়্যার ইঞ্জিনিয়ার, জানুয়ারি ২০২০ – বর্তমান')).toMatchObject({start: '2020-01', end: '', current: true})
        expect(findDates('০৩/২০১৯ - ০৬/২০২১')).toMatchObject({start: '2019-03', end: '2021-06', current: false})
    })

    it('reads a Bangla date of birth and height', () => {
        expect(dayOf('১২ মার্চ ১৯৯৬')).toBe('1996-03-12')
        expect(heightOf('১৬৩ সেমি')).toEqual({cm: 163, show: 'cm'})
    })

    it('is made in Bangla when most of its headings are', () => {
        expect(languageOfHeadings(['কর্ম অভিজ্ঞতা', 'শিক্ষাগত যোগ্যতা', 'Skills'])).toBe('bn')
        expect(languageOfHeadings(['Experience', 'Education', 'ভাষা'])).toBe('en')
    })
})

describe('a document in Hindi or Marathi', () => {
    it('starts with its headings in that language', () => {
        expect(emptyCv('hi').sections.map((section) => section.title)).toEqual(['सारांश', 'कार्य अनुभव', 'शैक्षणिक योग्यता', 'कौशल'])
        expect(emptyBiodata('mr').sections[0].title).toBe('वैयक्तिक माहिती')
    })

    it('writes dates and ages with Devanagari months and digits', () => {
        expect(datesText({start: '2020-01', end: '', current: true}, {language: 'hi', digits: 'native'})).toBe('जनवरी २०२० – वर्तमान')
        expect(detailValue({id: 'r', visible: true, label: '', kind: 'date', date: '1996-03-12', show: 'both'}, new Date(2026, 10, 15), {language: 'mr', digits: 'native'})).toBe('१२ मार्च १९९६ (३० वर्षे)')
    })

    it('is read back on import', () => {
        expect(knownHeading('कार्य अनुभव')).toBe('entries')
        expect(knownHeading('कौटुंबिक माहिती')).toBe('family')
        expect(findDates('जनवरी २०२० – वर्तमान')).toMatchObject({start: '2020-01', current: true})
        expect(dayOf('१२ मार्च १९९६')).toBe('1996-03-12')
        expect(languageOfHeadings(['कार्य अनुभव', 'शैक्षणिक योग्यता'])).toBe('hi')
    })
})

describe('a document in Urdu', () => {
    it('starts with its headings in Urdu, and tells the templates it runs right to left', () => {
        expect(emptyCv('ur').sections.map((section) => section.title)).toEqual(['خلاصہ', 'تجربہ', 'تعلیمی قابلیت', 'مہارتیں'])
        expect(renderModel(emptyCv('ur')).design.rtl).toBe(true)
        expect(renderModel(emptyCv('hi')).design.rtl).toBe(false)
    })

    it('writes dates with Urdu months and digits', () => {
        expect(datesText({start: '2020-01', end: '', current: true}, {language: 'ur', digits: 'native'})).toBe('جنوری ۲۰۲۰ – تاحال')
    })

    it('is read back on import', () => {
        expect(knownHeading('تعلیمی قابلیت')).toBe('entries')
        expect(findDates('جنوری ۲۰۲۰ – تاحال')).toMatchObject({start: '2020-01', current: true})
        expect(languageOfHeadings(['تجربہ', 'تعلیمی قابلیت'])).toBe('ur')
    })
})

describe('a document in Arabic', () => {
    it('starts with its headings in Arabic, right to left, in Naskh rather than Nastaliq', () => {
        expect(emptyCv('ar').sections.map((section) => section.title)).toEqual(['الملخص المهني', 'الخبرة العملية', 'المؤهلات العلمية', 'المهارات'])
        expect(renderModel(emptyCv('ar')).design.rtl).toBe(true)
        expect(renderModel(emptyCv('ar')).design.fonts).toContain('Noto Sans Arabic')
        expect(renderModel(emptyCv('ar')).design.fonts).not.toContain('Noto Nastaliq Urdu')
        expect(renderModel(emptyCv('ur')).design.fonts).toContain('Noto Nastaliq Urdu')
    })

    it('writes dates with Arabic months, and Arabic-Indic digits when asked', () => {
        expect(datesText({start: '2020-01', end: '', current: true}, {language: 'ar', digits: 'native'})).toBe('يناير ٢٠٢٠ – حتى الآن')
        expect(datesText({start: '2020-01', end: '2021-09', current: false}, {language: 'ar', digits: 'latin'})).toBe('يناير 2020 – سبتمبر 2021')
    })

    it('counts years in the form Arabic uses for the number', () => {
        const years = (count: number) => detailValue({id: 'r', visible: true, label: '', kind: 'date', date: `${2026 - count}-01-01`, show: 'age'}, new Date(2026, 5, 1), {language: 'ar', digits: 'latin'})

        expect([1, 2, 5, 30].map(years)).toEqual(['سنة واحدة', 'سنتان', '5 سنوات', '30 سنة'])
    })

    it('is read back on import, with the months of the Levant and the Maghreb too', () => {
        expect(knownHeading('الخبرة العملية')).toBe('entries')
        expect(findDates('يناير ٢٠٢٠ – حتى الآن')).toMatchObject({start: '2020-01', current: true})
        expect(findDates('شباط 2019 – أيلول 2021')).toMatchObject({start: '2019-02', end: '2021-09'})
        expect(findDates('جانفي 2018 – أوت 2019')).toMatchObject({start: '2018-01', end: '2019-08'})
        expect(dayOf('١٢ مارس ١٩٩٦')).toBe('1996-03-12')
        expect(heightOf('١٦٣ سم')).toEqual({cm: 163, show: 'cm'})
    })

    it('is told apart from Urdu by its letters', () => {
        expect(languageOfHeadings(['الخبرة العملية', 'المؤهلات العلمية'])).toBe('ar')
        expect(languageOfHeadings(['تجربہ', 'تعلیمی قابلیت'])).toBe('ur')
    })
})

describe('a document in Persian', () => {
    it('starts with its headings in Persian, right to left, in Vazirmatn', () => {
        expect(emptyCv('fa').sections.map((section) => section.title)).toEqual(['خلاصه', 'سوابق کاری', 'تحصیلات', 'مهارت‌ها'])
        expect(renderModel(emptyCv('fa')).design.rtl).toBe(true)
        expect(renderModel(emptyCv('fa')).design.fonts).toContain('Vazirmatn')
        expect(renderModel(emptyCv('ar')).design.fonts).not.toContain('Vazirmatn')
    })

    it('writes dates with Persian month names and digits', () => {
        expect(datesText({start: '2020-01', end: '', current: true}, {language: 'fa', digits: 'native'})).toBe('ژانویه ۲۰۲۰ – تاکنون')
    })

    it('is read back on import, and told apart from Urdu and Arabic', () => {
        expect(knownHeading('سوابق کاری')).toBe('entries')
        expect(findDates('ژانویه ۲۰۲۰ – تاکنون')).toMatchObject({start: '2020-01', current: true})
        expect(heightOf('۱۶۳ سانتی‌متر')).toEqual({cm: 163, show: 'cm'})
        expect(languageOfHeadings(['سوابق کاری', 'تحصیلات', 'مهارت‌ها'])).toBe('fa')
    })
})

describe('a document in Japanese', () => {
    it('starts with its headings in Japanese, set in Noto Sans JP with looser lines', () => {
        expect(emptyCv('ja').sections.map((section) => section.title)).toEqual(['職務要約', '職務経歴', '学歴', 'スキル'])
        expect(renderModel(emptyCv('ja')).design).toMatchObject({lang: 'ja', latin: false, rtl: false, cjk: true})
        expect(renderModel(emptyCv('ja')).design.fonts).toContain('Noto Sans JP')
        expect(renderModel(emptyCv('en')).design.cjk).toBe(false)
    })

    it('writes dates year first, with 〜 between them', () => {
        expect(datesText({start: '2020-04', end: '', current: true}, {language: 'ja', digits: 'latin'})).toBe('2020年4月～現在')
        expect(datesText({start: '2018-10', end: '2020-03', current: false}, {language: 'ja', digits: 'latin'})).toBe('2018年10月～2020年3月')
        expect(detailValue({id: 'r', visible: true, label: '', kind: 'date', date: '1996-03-12', show: 'both'}, new Date(2026, 10, 15), {language: 'ja', digits: 'latin'})).toBe('1996年3月12日 (30歳)')
    })

    it('is read back on import, as pdf.js gives it, with spaces around the numbers', () => {
        expect(knownHeading('職務経歴')).toBe('entries')
        expect(findDates('2020 年 4 月 ～ 現在')).toMatchObject({start: '2020-04', current: true})
        expect(findDates('2018年10月〜2020年3月')).toMatchObject({start: '2018-10', end: '2020-03'})
        expect(dayOf('1996年3月12日')).toBe('1996-03-12')
        expect(languageOfHeadings(['職務要約', '職務経歴', 'スキル'])).toBe('ja')
    })

    it('leaves English dates with November alone, now that 1月 is a month name too', () => {
        expect(dayOf('11 November 1996')).toBe('1996-11-11')
        expect(findDates('Nov 2019 – Present')).toMatchObject({start: '2019-11', current: true})
    })
})
