/**
 * The fonts a CV can use. All are under the SIL Open Font License and come from npm
 * packages, so nothing is downloaded at run time. Each has the four faces a CV needs.
 */

export interface CvFont {
    readonly id: string
    /** The family name inside the font files, which is what Typst matches on. */
    readonly family: string
    readonly label: string
    readonly kind: 'Sans serif' | 'Serif'
    /** Each face's file, as an npm package path. */
    readonly files: readonly string[]
}

const faces = (pkg: string, prefix: string): string[] =>
    ['400Regular', '400Regular_Italic', '700Bold', '700Bold_Italic'].map((face) => `@expo-google-fonts/${pkg}/${face}/${prefix}_${face}.ttf`)

export const CV_FONTS: readonly CvFont[] = [
    {id: 'inter', family: 'Inter', label: 'Inter', kind: 'Sans serif', files: faces('inter', 'Inter')},
    {id: 'ibm-plex-sans', family: 'IBM Plex Sans', label: 'IBM Plex Sans', kind: 'Sans serif', files: faces('ibm-plex-sans', 'IBMPlexSans')},
    {id: 'lato', family: 'Lato', label: 'Lato', kind: 'Sans serif', files: faces('lato', 'Lato')},
    {id: 'source-serif-4', family: 'Source Serif 4', label: 'Source Serif', kind: 'Serif', files: faces('source-serif-4', 'SourceSerif4')},
    {id: 'eb-garamond', family: 'EB Garamond', label: 'EB Garamond', kind: 'Serif', files: faces('eb-garamond', 'EBGaramond')},
]

export const fontById = (id: string): CvFont => CV_FONTS.find((font) => font.id === id) ?? CV_FONTS[0]
