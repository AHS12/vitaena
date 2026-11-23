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
export type Script = 'bengali' | 'devanagari' | 'arabic' | 'cjk' | 'hangul'

/** A font for a script other than Latin, used where the chosen font has no such letters. */
export interface ScriptFont extends CvFont {
    readonly script: Script
    /** Used for its script when nothing else is chosen, beside main fonts of its kind. */
    readonly fallback: boolean
    /**
     * The document languages it's the fallback for, when it isn't for every one: Urdu is
     * read in Nastaliq, while Arabic in the same letters is read in Naskh.
     */
    readonly languages?: readonly string[]
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
 * Fonts for other scripts. Bangla has no italic tradition, so most have upright faces
 * only; italic text in Bangla stays upright, which is how it's printed. Tiro Bangla has no
 * bold, so bold text in it is regular.
 */
export const SCRIPT_FONTS: readonly ScriptFont[] = [
    {id: 'noto-sans-bengali', family: 'Noto Sans Bengali', label: 'Noto Sans Bengali', kind: 'Sans serif', script: 'bengali', fallback: true, files: faces('noto-sans-bengali', 'NotoSansBengali', ['400Regular', '700Bold'])},
    {id: 'noto-serif-bengali', family: 'Noto Serif Bengali', label: 'Noto Serif Bengali', kind: 'Serif', script: 'bengali', fallback: true, files: faces('noto-serif-bengali', 'NotoSerifBengali', ['400Regular', '700Bold'])},
    {id: 'anek-bangla', family: 'Anek Bangla', label: 'Anek Bangla', kind: 'Sans serif', script: 'bengali', fallback: false, files: faces('anek-bangla', 'AnekBangla', ['400Regular', '700Bold'])},
    {id: 'baloo-da-2', family: 'Baloo Da 2', label: 'Baloo Da 2', kind: 'Sans serif', script: 'bengali', fallback: false, files: faces('baloo-da-2', 'BalooDa2', ['400Regular', '700Bold'])},
    {id: 'tiro-bangla', family: 'Tiro Bangla', label: 'Tiro Bangla', kind: 'Serif', script: 'bengali', fallback: false, files: faces('tiro-bangla', 'TiroBangla', ['400Regular', '400Regular_Italic'])},
    {id: 'noto-sans-devanagari', family: 'Noto Sans Devanagari', label: 'Noto Sans Devanagari', kind: 'Sans serif', script: 'devanagari', fallback: true, files: faces('noto-sans-devanagari', 'NotoSansDevanagari', ['400Regular', '700Bold'])},
    {id: 'noto-serif-devanagari', family: 'Noto Serif Devanagari', label: 'Noto Serif Devanagari', kind: 'Serif', script: 'devanagari', fallback: true, files: faces('noto-serif-devanagari', 'NotoSerifDevanagari', ['400Regular', '700Bold'])},
    {id: 'hind', family: 'Hind', label: 'Hind', kind: 'Sans serif', script: 'devanagari', fallback: false, files: faces('hind', 'Hind', ['400Regular', '700Bold'])},
    {id: 'mukta', family: 'Mukta', label: 'Mukta', kind: 'Sans serif', script: 'devanagari', fallback: false, files: faces('mukta', 'Mukta', ['400Regular', '700Bold'])},
    // Like Tiro Bangla, it has no bold, so bold text in it is regular.
    {id: 'tiro-devanagari-hindi', family: 'Tiro Devanagari Hindi', label: 'Tiro Devanagari', kind: 'Serif', script: 'devanagari', fallback: false, files: faces('tiro-devanagari-hindi', 'TiroDevanagariHindi', ['400Regular', '400Regular_Italic'])},
    // Urdu is read in Nastaliq, whether the Latin font beside it is sans or serif.
    {id: 'noto-nastaliq-urdu', family: 'Noto Nastaliq Urdu', label: 'Noto Nastaliq Urdu', kind: 'Serif', script: 'arabic', fallback: true, languages: ['ur'], files: faces('noto-nastaliq-urdu', 'NotoNastaliqUrdu', ['400Regular', '700Bold'])},
    // A second Nastaliq, with no bold.
    {id: 'gulzar', family: 'Gulzar', label: 'Gulzar', kind: 'Serif', script: 'arabic', fallback: false, languages: ['ur'], files: faces('gulzar', 'Gulzar', ['400Regular'])},
    {id: 'noto-sans-arabic', family: 'Noto Sans Arabic', label: 'Noto Sans Arabic', kind: 'Sans serif', script: 'arabic', fallback: true, files: faces('noto-sans-arabic', 'NotoSansArabic', ['400Regular', '700Bold'])},
    {id: 'noto-naskh-arabic', family: 'Noto Naskh Arabic', label: 'Noto Naskh Arabic', kind: 'Serif', script: 'arabic', fallback: true, files: faces('noto-naskh-arabic', 'NotoNaskhArabic', ['400Regular', '700Bold'])},
    {id: 'cairo', family: 'Cairo', label: 'Cairo', kind: 'Sans serif', script: 'arabic', fallback: false, files: faces('cairo', 'Cairo', ['400Regular', '700Bold'])},
    {id: 'ibm-plex-sans-arabic', family: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic', kind: 'Sans serif', script: 'arabic', fallback: false, files: faces('ibm-plex-sans-arabic', 'IBMPlexSansArabic', ['400Regular', '700Bold'])},
    // Persian is read in Vazirmatn, the font Iranian sites and apps use.
    {id: 'vazirmatn', family: 'Vazirmatn', label: 'Vazirmatn', kind: 'Sans serif', script: 'arabic', fallback: true, languages: ['fa'], files: faces('vazirmatn', 'Vazirmatn', ['400Regular', '700Bold'])},
    // Chinese characters and kana, drawn as each place draws them: Japan, Taiwan and Hong
    // Kong, and mainland China, whose font also has every character the others lack, so it
    // follows them for any, and draws them in other languages' documents. The fallbacks are
    // sans, as most CVs there are printed; serif faces are choices, being far larger.
    {id: 'noto-sans-sc', family: 'Noto Sans SC', label: 'Noto Sans SC', kind: 'Sans serif', script: 'cjk', fallback: true, languages: ['zh-Hans'], files: faces('noto-sans-sc', 'NotoSansSC', ['400Regular', '700Bold'])},
    {id: 'noto-serif-sc', family: 'Noto Serif SC', label: 'Noto Serif SC', kind: 'Serif', script: 'cjk', fallback: false, languages: ['zh-Hans'], files: faces('noto-serif-sc', 'NotoSerifSC', ['400Regular', '700Bold'])},
    {id: 'noto-sans-tc', family: 'Noto Sans TC', label: 'Noto Sans TC', kind: 'Sans serif', script: 'cjk', fallback: true, languages: ['zh-Hant'], files: faces('noto-sans-tc', 'NotoSansTC', ['400Regular', '700Bold'])},
    {id: 'noto-serif-tc', family: 'Noto Serif TC', label: 'Noto Serif TC', kind: 'Serif', script: 'cjk', fallback: false, languages: ['zh-Hant'], files: faces('noto-serif-tc', 'NotoSerifTC', ['400Regular', '700Bold'])},
    {id: 'noto-sans-jp', family: 'Noto Sans JP', label: 'Noto Sans JP', kind: 'Sans serif', script: 'cjk', fallback: true, languages: ['ja'], files: faces('noto-sans-jp', 'NotoSansJP', ['400Regular', '700Bold'])},
    {id: 'm-plus-1p', family: 'M PLUS 1p', label: 'M PLUS 1p', kind: 'Sans serif', script: 'cjk', fallback: false, languages: ['ja'], files: faces('m-plus-1p', 'MPLUS1p', ['400Regular', '700Bold'])},
    {id: 'zen-kaku-gothic-new', family: 'Zen Kaku Gothic New', label: 'Zen Kaku Gothic', kind: 'Sans serif', script: 'cjk', fallback: false, languages: ['ja'], files: faces('zen-kaku-gothic-new', 'ZenKakuGothicNew', ['400Regular', '700Bold'])},
    {id: 'zen-old-mincho', family: 'Zen Old Mincho', label: 'Zen Old Mincho', kind: 'Serif', script: 'cjk', fallback: false, languages: ['ja'], files: faces('zen-old-mincho', 'ZenOldMincho', ['400Regular', '700Bold'])},
    // Hangul, which the Chinese and Japanese fonts haven't.
    {id: 'noto-sans-kr', family: 'Noto Sans KR', label: 'Noto Sans KR', kind: 'Sans serif', script: 'hangul', fallback: true, files: faces('noto-sans-kr', 'NotoSansKR', ['400Regular', '700Bold'])},
    {id: 'nanum-gothic', family: 'NanumGothic', label: 'Nanum Gothic', kind: 'Sans serif', script: 'hangul', fallback: false, files: faces('nanum-gothic', 'NanumGothic', ['400Regular', '700Bold'])},
    {id: 'ibm-plex-sans-kr', family: 'IBM Plex Sans KR', label: 'IBM Plex Sans KR', kind: 'Sans serif', script: 'hangul', fallback: false, files: faces('ibm-plex-sans-kr', 'IBMPlexSansKR', ['400Regular', '700Bold'])},
    {id: 'nanum-myeongjo', family: 'NanumMyeongjo', label: 'Nanum Myeongjo', kind: 'Serif', script: 'hangul', fallback: false, files: faces('nanum-myeongjo', 'NanumMyeongjo', ['400Regular', '700Bold'])},
    {id: 'amiri', family: 'Amiri', label: 'Amiri', kind: 'Serif', script: 'arabic', fallback: false, files: faces('amiri', 'Amiri')},
]

/** The letters of each script, by Unicode script. */
const SCRIPT_LETTERS: Readonly<Record<Script, RegExp>> = {
    bengali: /\p{Script=Bengali}/u,
    devanagari: /\p{Script=Devanagari}/u,
    arabic: /\p{Script=Arabic}/u,
    cjk: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
    hangul: /\p{Script=Hangul}/u,
}

/**
 * A font the person added is named in a design by its family: "custom:Kalpurush". The
 * files are theirs, kept in the app; a document naming one on a computer that hasn't
 * it falls back to the bundled fonts after it in the list.
 */
export const ADDED = 'custom:'

export const isAddedFont = (id: string): boolean => id.startsWith(ADDED) && id.length > ADDED.length

export const addedFamily = (id: string): string => id.slice(ADDED.length)

export const addedFontId = (family: string): string => ADDED + family

/** A built-in font by id, a font the person added as one of its kind, or Inter. */
export const fontById = (id: string): CvFont =>
    isAddedFont(id) ? {id, family: addedFamily(id), label: addedFamily(id), kind: 'Sans serif', files: []} : (CV_FONTS.find((font) => font.id === id) ?? CV_FONTS[0])

/**
 * The script font that suits a main font, sans with sans and serif with serif, among the
 * fallbacks for the document's language: its own when it has them (Nastaliq for Urdu),
 * else those for every language.
 */
export function scriptFontFor(script: Script, kind: FontKind, language = 'en'): ScriptFont {
    const fallbacks = SCRIPT_FONTS.filter((font) => font.script === script && font.fallback)
    const own = fallbacks.filter((font) => font.languages?.includes(language))
    const general = fallbacks.filter((font) => !font.languages)
    // A script whose every fallback belongs to a language, as CJK's do, falls back on the first.
    const pool = own.length > 0 ? own : general.length > 0 ? general : fallbacks

    return pool.find((font) => font.kind === kind) ?? pool[0]
}

export const scriptFontById = (id: string): ScriptFont | undefined => SCRIPT_FONTS.find((font) => font.id === id)

/**
 * The families a template is given, in the order Typst looks for each letter in them:
 * the main font, the script font chosen (or the one that suits the main font), then Inter.
 * A language's own font is followed by its script's general one, for any letter it lacks.
 */
export function fontFamilies(id: string, scriptFont = '', language = 'en'): string[] {
    const main = fontById(id)
    const chosen = scriptFontById(scriptFont)
    const scripts = [...new Set(SCRIPT_FONTS.map((font) => font.script))].flatMap((script) => {
        const font = chosen?.script === script ? chosen : scriptFontFor(script, main.kind, language)

        return font.languages ? [font.family, scriptFontFor(script, main.kind).family] : [font.family]
    })
    // A script font the person added comes first, with the bundled one behind it for any
    // letter it lacks, or for a computer that hasn't it.
    const added = isAddedFont(scriptFont) ? [addedFamily(scriptFont)] : []

    // Letters the chosen font lacks, such as Lato's Turkish and Cyrillic ones, come from a
    // bundled font of the same kind that has them, before any script font could supply its own.
    const cover = fontById(main.kind === 'Serif' ? 'source-serif-4' : 'inter').family

    return [...new Set([main.family, ...added, cover, ...scripts, CV_FONTS[0].family])]
}

/** The scripts that appear in some text, such as a document's render model as JSON. */
export const scriptsIn = (text: string): Script[] => (Object.keys(SCRIPT_LETTERS) as Script[]).filter((script) => SCRIPT_LETTERS[script].test(text))

/**
 * The script fonts' files a render model needs, given as JSON: for each script in it, the
 * fallbacks of both kinds, since a template may pick either, and any it names, such as
 * a language's own fallback.
 */
export const scriptFilesFor = (text: string): string[] => {
    const scripts = new Set(scriptsIn(text))

    return SCRIPT_FONTS.filter((font) => scripts.has(font.script) && ((font.fallback && !font.languages) || text.includes(`"${font.family}"`))).flatMap((font) => font.files)
}
