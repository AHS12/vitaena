import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'
import manifest from '../../../backend/fontpacks/packs.json'
import {FONT_PACKS, megabytes, packFileUrl, packOfFile, packOfFont, packsWanted} from './font-packs'
import {fontFamilies, SCRIPT_FONTS, scriptFontById} from './fonts'

const json = (text: string) => JSON.stringify({name: text})

describe('the font packs', () => {
    it('hold every Chinese, Japanese and Korean font, and nothing else', () => {
        const big = SCRIPT_FONTS.filter((font) => font.script === 'cjk' || font.script === 'hangul')
        const packed = SCRIPT_FONTS.filter((font) => packOfFont(font))

        expect(packed.map((font) => font.id)).toEqual(big.map((font) => font.id))
        expect(FONT_PACKS.flatMap((pack) => pack.files).sort()).toEqual(big.flatMap((font) => font.files).sort())
    })

    it('are one for each language, named by it', () => {
        expect(FONT_PACKS.map((pack) => pack.id)).toEqual(['ja', 'zh-Hans', 'zh-Hant', 'ko'])
        expect(packOfFont(scriptFontById('zen-old-mincho')!)?.id).toBe('ja')
        expect(packOfFont(scriptFontById('nanum-gothic')!)?.id).toBe('ko')
    })

    it('list the very files the npm packages have, so the app accepts what the release holds', () => {
        for (const font of manifest.packs.flatMap((pack) => pack.fonts)) {
            const bytes = readFileSync(join(import.meta.dirname, '../../node_modules', font.path))

            expect({path: font.path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')}).toEqual(font)
        }
    })

    it('are read from where Go keeps them', () => {
        const file = scriptFontById('noto-sans-jp')!.files[0]

        expect(packFileUrl(packOfFile(file)!, file)).toBe('/font-packs/ja/NotoSansJP_400Regular.ttf')
    })

    it('say their size in whole megabytes', () => {
        expect(megabytes(17_422_645)).toBe('17 MB')
        expect(megabytes(1000)).toBe('1 MB')
    })
})

describe('the packs a page needs', () => {
    it('are none for a page in English or Bangla', () => {
        expect(packsWanted(json('Jane জেন'), fontFamilies('inter'))).toEqual([])
    })

    it('is the Japanese one for a page in Japanese, and not the Chinese one that only fills in rare letters', () => {
        expect(packsWanted(json('山田 花子'), fontFamilies('inter', '', 'ja')).map((pack) => pack.id)).toEqual(['ja'])
    })

    it('is the one of the font chosen for the script', () => {
        expect(packsWanted(json('김민준'), fontFamilies('inter', 'nanum-myeongjo', 'ko')).map((pack) => pack.id)).toEqual(['ko'])
    })

    it('is the simplified Chinese one for Chinese letters in an English page', () => {
        expect(packsWanted(json('Li Wei 李伟'), fontFamilies('inter')).map((pack) => pack.id)).toEqual(['zh-Hans'])
    })
})
