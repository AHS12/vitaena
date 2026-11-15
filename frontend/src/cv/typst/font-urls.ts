/**
 * Every face of every font in CV_FONTS, bundled with the app. Vite turns each into a URL,
 * so the fonts load from the app itself and never from the network.
 */
const FONT_URLS = import.meta.glob('../../../node_modules/@expo-google-fonts/*/{400Regular,400Regular_Italic,700Bold,700Bold_Italic}/*.ttf', {
    query: '?url',
    import: 'default',
    eager: true,
}) as Record<string, string>

export const fontUrl = (file: string): string => {
    const url = FONT_URLS[`../../../node_modules/${file}`]

    if (!url) {
        throw new Error(`The font file ${file} isn't bundled.`)
    }

    return url
}
