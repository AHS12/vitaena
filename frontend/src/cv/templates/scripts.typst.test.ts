// @vitest-environment node

/**
 * Bangla in every template, CV and biodata: laid out by the real compiler with the
 * bundled fonts, and read back from the PDF. A template that sets a font of its own
 * instead of the list it's given would draw Bangla as empty boxes, and fail here.
 *
 * Typst 0.14 gives each glyph one meaning for the whole PDF, so a vowel sign seen first in
 * one word reads back as that word everywhere after; Bangla copied out of a PDF comes out
 * jumbled though it's drawn right. So the letters read back here stand alone and appear
 * nowhere else, and the joined text is checked only for being drawn in the Bangla font.
 */

import {beforeAll, describe, expect, it} from 'vitest'
import type {TypstCompiler} from '@myriaddreamin/typst.ts'
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs'
import {templatePdf, typstCompiler} from '../../tests/typst'
import {emptyBiodata} from '../../biodata/biodata'
import {biodataRenderModel} from '../../biodata/render-model'
import {withSecondLanguage} from '../../biodata/edit-ops'
import {sampleBiodata} from '../../biodata/sample'
import {BIODATA_TEMPLATES} from '../../biodata/templates/templates'
import {emptyCv, type CvSection} from '../cv'
import {cvFromLayout} from '../import/parse'
import {readPdfLayout} from '../import/read-pdf'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'

const sampleCvBangla = () => sampleCv('bn')
import {CV_TEMPLATES} from './templates'

/** Letters that each stand alone, as one glyph, and appear nowhere else on the page. */
const NAME = 'Jane Doe ঘঝঠঢ ঈঊ'
const HEADLINE = 'Software Engineer · সফটওয়্যার প্রকৌশলী'
/** Conjuncts, vowel signs before, around and after their letter, khanda ta and anusvara. */
const TEXT = 'অভিজ্ঞতা, দক্ষতা ও ক্ষমতা: কি কে কৈ কো কৌ, উৎসব, রং'

let compiler: TypstCompiler

beforeAll(async () => {
    compiler = await typstCompiler()
}, 60_000)

/**
 * The text as letters only. pdf.js reads a Bangla vowel sign drawn before its letter as
 * the right letters plus a stray control character, and puts gaps between the pieces, so
 * both are dropped before comparing.
 */
const letters = (text: string): string => text.replace(/[\p{Cc}\s]/gu, '')

async function read(pdf: Uint8Array): Promise<string> {
    const document = await getDocument({data: pdf.slice(), useSystemFonts: false}).promise
    const pages: string[] = []

    for (let number = 1; number <= document.numPages; number += 1) {
        const content = await (await document.getPage(number)).getTextContent()

        pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(''))
    }

    return letters(pages.join(''))
}

/** The base names of the fonts a PDF embeds, such as "NotoSansBengali-Regular". */
const embeddedFonts = (pdf: Uint8Array): string[] => [...new TextDecoder('latin1').decode(pdf).matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([\w-]+)/g)].map((match) => match[1])

describe.each(CV_TEMPLATES.map((template) => template.id))('Bangla in the %s CV template', (template) => {
    let pdf: Uint8Array

    beforeAll(async () => {
        const cv = sampleCv()
        const sections = cv.sections.map((section) => (section.kind === 'text' ? {...section, title: 'সারসংক্ষেপ', text: TEXT} : section))

        pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', renderModel({...cv, person: {...cv.person, name: NAME, headline: HEADLINE}, sections}))
    }, 60_000)

    it('draws Bangla letters as themselves, in order, beside the English', async () => {
        const text = await read(pdf)

        expect(text).toContain(letters(NAME))
        expect(text).toContain('SoftwareEngineer')
    })

    it('draws Bangla in the bundled Bangla font', () => {
        expect(embeddedFonts(pdf).some((font) => /^NotoS(ans|erif)Bengali/.test(font))).toBe(true)
    })
})

describe.each(BIODATA_TEMPLATES.map((template) => template.id))('Bangla in the %s biodata template', (template) => {
    it('draws Bangla letters as themselves, in the Bangla font', async () => {
        const biodata = sampleBiodata()
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel({...biodata, person: {...biodata.person, name: NAME}, heading: {...biodata.heading, text: TEXT}}))

        expect(await read(pdf)).toContain(letters(NAME))

        expect(embeddedFonts(pdf).some((font) => /^NotoS(ans|erif)Bengali/.test(font))).toBe(true)
    }, 60_000)
})

describe('the Bangla example, laid out in every template', () => {
    it.each(CV_TEMPLATES.map((template) => template.id))('fits the CV in %s, with its English parts intact', async (template) => {
        const pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', renderModel(sampleCvBangla()))

        expect(await read(pdf)).toContain('jane.doe@example.com')
        expect(embeddedFonts(pdf).some((font) => /^NotoS(ans|erif)Bengali/.test(font))).toBe(true)
    }, 60_000)

    it.each(BIODATA_TEMPLATES.map((template) => template.id))('fits the biodata in %s on one page', async (template) => {
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel(sampleBiodata('bn')))
        const document = await getDocument({data: pdf.slice(), useSystemFonts: false}).promise

        expect(document.numPages).toBe(1)
    }, 60_000)

    it('sets Bangla in a chosen Bangla font', async () => {
        const cv = sampleCvBangla()
        const pdf = await templatePdf(compiler, new URL('./classic.typ', import.meta.url), '/cv.json', renderModel({...cv, design: {...cv.design, scriptFont: 'baloo-da-2'}}))

        expect(embeddedFonts(pdf).some((font) => font.startsWith('BalooDa2'))).toBe(true)
    }, 60_000)
})

describe('second labels, laid out in every biodata template', () => {
    it.each(BIODATA_TEMPLATES.map((template) => template.id))('draws English labels under the Bangla ones in %s', async (template) => {
        const biodata = withSecondLanguage(sampleBiodata('bn'), 'en')
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel(biodata))
        // Heritage sets its headings in capitals.
        const text = (await read(pdf)).toLowerCase()

        for (const label of ['personaldetails', 'dateofbirth', 'father', 'contact']) {
            expect(text, label).toContain(label)
        }
    }, 60_000)
})

describe('Hindi and Marathi, in every template', () => {
    it.each([...CV_TEMPLATES.map((template) => template.id)])('draws Devanagari in the bundled font in the %s CV template', async (template) => {
        const cv = emptyCv('hi')
        const model = renderModel({...cv, person: {...cv.person, name: 'Jane Doe ऋऌ', headline: 'सॉफ़्टवेयर इंजीनियर'}, sections: [{id: 's', kind: 'text', title: cv.sections[0].title, visible: true, text: 'पाँच वर्षों का अनुभव, क्षमता और ज्ञान'}]})
        const pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', model)

        expect(await read(pdf)).toContain(letters('Jane Doe ऋऌ'))
        expect(embeddedFonts(pdf).some((font) => /^NotoS(ans|erif)Devanagari/.test(font))).toBe(true)
    }, 60_000)

    it.each(BIODATA_TEMPLATES.map((template) => template.id))('lays out a Marathi biodata in %s on one page', async (template) => {
        const biodata = emptyBiodata('mr')
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel({...biodata, person: {...biodata.person, name: 'Jane Doe ऋऌ'}}))
        const document = await getDocument({data: pdf.slice(), useSystemFonts: false}).promise

        expect(document.numPages).toBe(1)
        expect(await read(pdf)).toContain(letters('Jane Doe ऋऌ'))
    }, 60_000)
})


describe('Urdu, right to left, in every template', () => {
    it.each(CV_TEMPLATES.map((template) => template.id))('sets an Urdu CV in Nastaliq in %s, with its English intact', async (template) => {
        const cv = sampleCv('ur')
        const pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', renderModel({...cv, person: {...cv.person, name: 'جین ڈو', headline: 'سافٹ ویئر انجینئر'}}))

        expect(await read(pdf)).toContain('jane.doe@example.com')
        expect(embeddedFonts(pdf).some((font) => font.startsWith('NotoNastaliqUrdu'))).toBe(true)
    }, 60_000)

    it.each(BIODATA_TEMPLATES.map((template) => template.id))('lays out the Urdu biodata in %s', async (template) => {
        const biodata = sampleBiodata('ur')
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel({...biodata, person: {...biodata.person, name: 'جین ڈو'}}))
        const document = await getDocument({data: pdf.slice(), useSystemFonts: false}).promise

        expect(document.numPages).toBeLessThanOrEqual(2)
        expect(embeddedFonts(pdf).some((font) => font.startsWith('NotoNastaliqUrdu'))).toBe(true)
    }, 60_000)
})

describe('Arabic, right to left, in every template', () => {
    it.each(CV_TEMPLATES.map((template) => template.id))('sets an Arabic CV in Naskh in %s, with its English intact', async (template) => {
        const cv = sampleCv('ar')
        const pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', renderModel({...cv, person: {...cv.person, name: 'جين دو', headline: 'مهندسة برمجيات'}}))
        const fonts = embeddedFonts(pdf)

        expect(await read(pdf)).toContain('jane.doe@example.com')
        expect(fonts.some((font) => font.startsWith('NotoSansArabic') || font.startsWith('NotoNaskhArabic'))).toBe(true)
        expect(fonts.some((font) => font.startsWith('NotoNastaliqUrdu'))).toBe(false)
    }, 60_000)

    it.each(BIODATA_TEMPLATES.map((template) => template.id))('lays out the Arabic biodata in %s on at most two pages', async (template) => {
        const biodata = sampleBiodata('ar')
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel({...biodata, person: {...biodata.person, name: 'جين دو'}}))
        const document = await getDocument({data: pdf.slice(), useSystemFonts: false}).promise

        expect(document.numPages).toBeLessThanOrEqual(2)
        expect(embeddedFonts(pdf).some((font) => font.includes('Arabic'))).toBe(true)
    }, 60_000)

    it('sets Arabic in a chosen Arabic font', async () => {
        const cv = sampleCv('ar')
        const pdf = await templatePdf(compiler, new URL('./classic.typ', import.meta.url), '/cv.json', renderModel({...cv, design: {...cv.design, scriptFont: 'amiri'}}))

        expect(embeddedFonts(pdf).some((font) => font.startsWith('Amiri'))).toBe(true)
    }, 60_000)
})

describe('Persian in every template', () => {
    it.each(CV_TEMPLATES.map((template) => template.id))('sets a Persian CV in Vazirmatn in %s', async (template) => {
        const cv = sampleCv('fa')
        const pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', renderModel({...cv, person: {...cv.person, name: 'جین دو', headline: 'مهندس نرم‌افزار'}}))

        expect(await read(pdf)).toContain('jane.doe@example.com')
        expect(embeddedFonts(pdf).some((font) => font.startsWith('Vazirmatn'))).toBe(true)
    }, 60_000)
})

describe('Japanese in every template', () => {
    it.each(CV_TEMPLATES.map((template) => template.id))('sets a Japanese CV in Noto Sans JP in %s, and its text reads back', async (template) => {
        const cv = sampleCv('ja')
        const pdf = await templatePdf(compiler, new URL(`./${template}.typ`, import.meta.url), '/cv.json', renderModel({...cv, person: {...cv.person, name: '山田 花子', headline: 'ソフトウェアエンジニア'}}))
        const text = await read(pdf)

        // Chinese characters and kana map one to one, so unlike Bangla they copy out whole.
        expect(text).toContain('山田花子')
        expect(text).toContain('ソフトウェアエンジニア')
        expect(text).toContain('職務経歴')
        expect(text).toContain('2022年3月～現在')
        expect(text).toContain('jane.doe@example.com')
        expect(embeddedFonts(pdf).some((font) => font.startsWith('NotoSansJP'))).toBe(true)
    }, 60_000)

    it.each(BIODATA_TEMPLATES.map((template) => template.id))('lays out the Japanese biodata in %s', async (template) => {
        const biodata = sampleBiodata('ja')
        const pdf = await templatePdf(compiler, new URL(`../../biodata/templates/${template}.typ`, import.meta.url), '/biodata.json', biodataRenderModel({...biodata, person: {...biodata.person, name: '山田 花子'}}))

        expect(await read(pdf)).toContain('生年月日')
        expect(embeddedFonts(pdf).some((font) => font.startsWith('NotoSansJP'))).toBe(true)
    }, 60_000)

    it('comes back through import as a Japanese CV, with its headings and dates', async () => {
        const cv = sampleCv('ja')
        const pdf = await templatePdf(compiler, new URL('./classic.typ', import.meta.url), '/cv.json', renderModel(cv))
        const {cv: imported} = cvFromLayout(await readPdfLayout(pdf))
        const experience = imported.sections.find((section) => section.title === '職務経歴')

        expect(imported.design.language).toBe('ja')
        expect(imported.sections.map((section) => section.title)).toEqual(cv.sections.map((section) => section.title))
        expect(experience?.kind === 'entries' && experience.entries.map(({start, end, current}) => ({start, end, current}))).toEqual(
            (cv.sections.find((section) => section.title === '職務経歴') as Extract<CvSection, {kind: 'entries'}>).entries.map(({start, end, current}) => ({start, end, current})),
        )
    }, 60_000)
})
