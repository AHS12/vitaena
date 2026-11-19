import {describe, expect, it} from 'vitest'
import {addedMessage, coveredRanges, covers, faceName, isBijoy, scriptsOf, type FontFace} from './font-info'

/** A coverage for these ranges [from, to), as Typst writes it: runs of not covered and covered. */
function coverageOf(ranges: [number, number][]): number[] {
    const runs: number[] = []
    let at = 0

    for (const [from, to] of ranges) {
        runs.push(from - at, to - from)
        at = to
    }

    return runs
}

const LATIN: [number, number] = [0x20, 0x7f]
const BENGALI: [number, number] = [0x0980, 0x0a00]

const face = (family: string, ranges: [number, number][], extra: Partial<FontFace> = {}): FontFace => ({family, style: 'normal', weight: 400, flags: '', coverage: coverageOf(ranges), ...extra})

describe('what a font has letters for', () => {
    it('reads the runs of a coverage', () => {
        expect(coveredRanges([32, 95, 33, 140])).toEqual([[32, 127], [160, 300]])
        expect(covers([32, 95], 65)).toBe(true)
        expect(covers([32, 95], 200)).toBe(false)
    })

    it('finds English and Bangla in a Bangla font that has both', () => {
        expect(scriptsOf(face('Kalpurush', [LATIN, BENGALI]).coverage)).toEqual(['latin', 'bengali'])
    })

    it('finds only English in a Latin font', () => {
        expect(scriptsOf(face('Merriweather', [LATIN]).coverage)).toEqual(['latin'])
    })
})

describe('a Bijoy font', () => {
    it('is told by its name, with no Bangla letters in it', () => {
        expect(isBijoy(face('SutonnyMJ', [LATIN]))).toBe(true)
        expect(isBijoy(face('Some Font', [LATIN]), 'SutonnyOMJ.ttf')).toBe(true)
    })

    it('is not a Unicode Bangla font, whatever its name', () => {
        expect(isBijoy(face('Kalpurush', [LATIN, BENGALI]))).toBe(false)
        expect(isBijoy(face('Merriweather', [LATIN]), 'Merriweather-Bold.ttf')).toBe(false)
    })
})

describe('what the app says when a font is added', () => {
    it('names its faces and its scripts, and says bold will use regular when there is no bold', () => {
        expect(addedMessage('Kalpurush', [{style: 'normal', weight: 400, flags: ''}], ['latin', 'bengali'])).toBe('Kalpurush: regular. Has letters for English and Bangla. Bold text will use the regular face. Add the bold file if you have it.')
    })

    it('says nothing more when the family has its bold', () => {
        expect(
            addedMessage(
                'Merriweather',
                [
                    {style: 'normal', weight: 400, flags: ''},
                    {style: 'normal', weight: 700, flags: ''},
                ],
                ['latin'],
            ),
        ).toBe('Merriweather: regular, bold. Has letters for English.')
    })

    it('warns that a variable font gives one weight', () => {
        expect(addedMessage('Inter', [{style: 'normal', weight: 400, flags: 'VARIABLE'}], ['latin'])).toContain('Vitaena uses only one of them')
    })

    it('names faces as people do', () => {
        expect(faceName({style: 'italic', weight: 700})).toBe('bold italic')
        expect(faceName({style: 'italic', weight: 400})).toBe('italic')
    })
})
