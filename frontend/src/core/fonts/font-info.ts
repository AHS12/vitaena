/**
 * What a font file the person adds is, and what to say about it: which writing systems
 * it has letters for, whether it's serif, and what it lacks. Pure, so it's tested on
 * made-up font info as well as real fonts.
 */

/** Writing systems a font may cover, as the app talks about them. */
export type FontScript = 'latin' | 'bengali' | 'devanagari' | 'arabic' | 'cjk' | 'hangul'

/** What the layout engine reads from one font in a file. */
export interface FontFace {
    readonly family: string
    readonly style: string
    readonly weight: number
    readonly flags: string
    /** Codepoints it has, as runs: so many not covered, so many covered, and so on, from 0. */
    readonly coverage: readonly number[]
}

/** A few letters each script can't do without: a font that has them all covers it. */
const NEEDED: Readonly<Record<FontScript, readonly number[]>> = {
    latin: [...'AZaz'].map((letter) => letter.codePointAt(0)!),
    bengali: [0x0985, 0x0995, 0x09be, 0x09bf, 0x09cd],
    devanagari: [0x0905, 0x0915, 0x093e, 0x093f, 0x094d],
    arabic: [0x0627, 0x0628, 0x0644, 0x0645],
    // 一, 人, 中 and 日: in every Chinese and Japanese font.
    cjk: [0x4e00, 0x4eba, 0x4e2d, 0x65e5],
    // 가, 나 and 한.
    hangul: [0xac00, 0xb098, 0xd55c],
}

export const SCRIPT_NAMES: Readonly<Record<FontScript, string>> = {latin: 'English', bengali: 'Bangla', devanagari: 'Hindi and Marathi', arabic: 'Arabic and Urdu', cjk: 'Chinese and Japanese', hangul: 'Korean'}

/** The codepoints a coverage says a font has, as covered ranges [from, to). */
export function coveredRanges(coverage: readonly number[]): [number, number][] {
    const ranges: [number, number][] = []
    let at = 0

    coverage.forEach((length, index) => {
        if (index % 2 === 1 && length > 0) {
            ranges.push([at, at + length])
        }

        at += length
    })

    return ranges
}

export function covers(coverage: readonly number[], codepoint: number): boolean {
    return coveredRanges(coverage).some(([from, to]) => codepoint >= from && codepoint < to)
}

/** The scripts a font has letters for. */
export const scriptsOf = (coverage: readonly number[]): FontScript[] => (Object.keys(NEEDED) as FontScript[]).filter((script) => NEEDED[script].every((codepoint) => covers(coverage, codepoint)))

export const isSerif = (face: FontFace): boolean => /SERIF/.test(face.flags)

export const isVariable = (face: FontFace): boolean => /VARIABLE/.test(face.flags)

/**
 * A Bijoy font, such as SutonnyMJ, draws Bangla on English letters' codes. Text typed for
 * it is English letters that only look Bangla in that font, so it can't be searched or
 * read, and shaping never runs. Told by its name, or by a Bangla name with no Bangla in it.
 */
export function isBijoy(face: FontFace, fileName = ''): boolean {
    const names = [face.family, fileName.replace(/\.[a-z]+$/i, '')]

    return !scriptsOf(face.coverage).includes('bengali') && names.some((name) => /MJ$|\bMJ\b|sutonny|bijoy/i.test(name.trim()))
}

/** "regular", "bold italic": a face as people name it. */
export function faceName(face: Pick<FontFace, 'style' | 'weight'>): string {
    const weight = face.weight >= 600 ? 'bold' : face.weight <= 300 ? 'light' : 'regular'
    const italic = face.style !== 'normal'

    return italic ? (weight === 'regular' ? 'italic' : `${weight} italic`) : weight
}

/** What the app says when a font is added, in plain words, once. */
export function addedMessage(family: string, faces: readonly Pick<FontFace, 'style' | 'weight' | 'flags'>[], scripts: readonly FontScript[]): string {
    const names = [...new Set(faces.map(faceName))]
    const covered = scripts.map((script) => SCRIPT_NAMES[script])
    const parts = [`${family}: ${names.join(', ')}.`]

    parts.push(covered.length > 0 ? `Has letters for ${joined(covered)}.` : "Has none of the letters Vitaena knows, so it may not show your text.")

    if (faces.some((face) => /VARIABLE/.test(face.flags))) {
        parts.push('Its weights are in one file, and Vitaena uses only one of them. Add the separate file for bold if you have it.')
    } else if (!faces.some((face) => face.weight >= 600 && face.style === 'normal')) {
        parts.push('Bold text will use the regular face. Add the bold file if you have it.')
    }

    return parts.join(' ')
}

const joined = (words: readonly string[]): string => (words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`)
