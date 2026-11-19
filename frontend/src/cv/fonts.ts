/**
 * The fonts a document can use. All are under the SIL Open Font License and come from npm
 * packages, so nothing is downloaded at run time.
 *
 * Typst sees only the fonts the app gives it, never the system's, and takes each letter
 * from the first font in a list that has it. So a template is given a list: the chosen
 * font, then fonts for other scripts, such as Bangla, that suit it. English then comes
 * from the chosen font and Bangla from a matching Bangla font, on the same line.
 */

export type FontKind = 'Sans serif' | 'Serif'

export interface CvFont {
    readonly id: string
    /** The family name inside the font files, which is what Typst matches on. */
    readonly family: string
    readonly label: string
    readonly kind: FontKind
    /** Each face's file, as an npm package path. */
    readonly files: readonly string[]
}

/** The writing systems the bundled fonts cover, beyond the Latin letters every font has. */
export type Script = 'bengali'

/** A font for a script other than Latin, used where the chosen font has no such letters. */
export interface ScriptFont extends CvFont {
    readonly script: Script
}

const face = (pkg: string, prefix: string, name: string): string => `@expo-google-fonts/${pkg}/${name}/${prefix}_${name}.ttf`

const faces = (pkg: string, prefix: string, names: readonly string[] = ['400Regular', '400Regular_Italic', '700Bold', '700Bold_Italic']): string[] => names.map((name) => face(pkg, prefix, name))

export const CV_FONTS: readonly CvFont[] = [
    {id: 'inter', family: 'Inter', label: 'Inter', kind: 'Sans serif', files: faces('inter', 'Inter')},
    {id: 'ibm-plex-sans', family: 'IBM Plex Sans', label: 'IBM Plex Sans', kind: 'Sans serif', files: faces('ibm-plex-sans', 'IBMPlexSans')},
    {id: 'lato', family: 'Lato', label: 'Lato', kind: 'Sans serif', files: faces('lato', 'Lato')},
    {id: 'source-serif-4', family: 'Source Serif 4', label: 'Source Serif', kind: 'Serif', files: faces('source-serif-4', 'SourceSerif4')},
    {id: 'eb-garamond', family: 'EB Garamond', label: 'EB Garamond', kind: 'Serif', files: faces('eb-garamond', 'EBGaramond')},
]

/**
 * Fonts for other scripts. Bangla has no italic tradition, so these have upright faces
 * only; italic text in Bangla stays upright, which is how it's printed.
 */
export const SCRIPT_FONTS: readonly ScriptFont[] = [
    {id: 'noto-sans-bengali', family: 'Noto Sans Bengali', label: 'Noto Sans Bengali', kind: 'Sans serif', script: 'bengali', files: faces('noto-sans-bengali', 'NotoSansBengali', ['400Regular', '700Bold'])},
    {id: 'noto-serif-bengali', family: 'Noto Serif Bengali', label: 'Noto Serif Bengali', kind: 'Serif', script: 'bengali', files: faces('noto-serif-bengali', 'NotoSerifBengali', ['400Regular', '700Bold'])},
]

/** The letters of each script, as Unicode blocks. */
const SCRIPT_LETTERS: Readonly<Record<Script, RegExp>> = {
    bengali: /[ঀ-৿]/,
}

export const fontById = (id: string): CvFont => CV_FONTS.find((font) => font.id === id) ?? CV_FONTS[0]

/** The script font that suits a main font: sans with sans, serif with serif. */
export const scriptFontFor = (script: Script, kind: FontKind): ScriptFont => SCRIPT_FONTS.find((font) => font.script === script && font.kind === kind) ?? SCRIPT_FONTS.find((font) => font.script === script)!

/** The families a template is given, in the order Typst looks for each letter in them. */
export function fontFamilies(id: string): string[] {
    const main = fontById(id)
    const scripts = [...new Set(SCRIPT_FONTS.map((font) => font.script))].map((script) => scriptFontFor(script, main.kind).family)

    return [...new Set([main.family, ...scripts, CV_FONTS[0].family])]
}

/** The scripts that appear in some text, such as a document's render model as JSON. */
export const scriptsIn = (text: string): Script[] => (Object.keys(SCRIPT_LETTERS) as Script[]).filter((script) => SCRIPT_LETTERS[script].test(text))

/** The script fonts' files that text needs, both kinds, since the template may pick either. */
export const scriptFilesFor = (text: string): string[] => {
    const scripts = new Set(scriptsIn(text))

    return SCRIPT_FONTS.filter((font) => scripts.has(font.script)).flatMap((font) => font.files)
}
