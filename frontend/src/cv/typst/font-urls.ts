import {packFileUrl, packOfFile} from '../font-packs'

/**
 * Every face of every font in CV_FONTS and SCRIPT_FONTS that's bundled with the app. Vite turns each into a
 * URL, so the fonts load from the app itself and never from the network. Those for Chinese, Japanese and
 * Korean aren't bundled: they're downloaded in packs (font-packs.ts), and load from where those are kept.
 */
const FONT_URLS = import.meta.glob('../../../node_modules/@expo-google-fonts/{inter,ibm-plex-sans,lato,source-serif-4,eb-garamond,noto-sans-bengali,noto-serif-bengali,anek-bangla,baloo-da-2,tiro-bangla,noto-sans-devanagari,noto-serif-devanagari,noto-nastaliq-urdu,noto-sans-arabic,noto-naskh-arabic,cairo,ibm-plex-sans-arabic,amiri,vazirmatn,hind,mukta,tiro-devanagari-hindi,gulzar}/{400Regular,400Regular_Italic,700Bold,700Bold_Italic}/*.ttf', {
    query: '?url',
    import: 'default',
    eager: true,
}) as Record<string, string>

export const fontUrl = (file: string): string => {
    const pack = packOfFile(file)

    if (pack) {
        return packFileUrl(pack, file)
    }

    const url = FONT_URLS[`../../../node_modules/${file}`]

    if (!url) {
        throw new Error(`The font file ${file} isn't bundled.`)
    }

    return url
}
