/**
 * The bundled fonts for other scripts, offered to the interface too, so Bangla typed in a
 * field shows on a system that has no Bangla font of its own, as many Linux installs
 * don't. Each face covers only its script's letters, so the browser loads it only when
 * such a letter is on screen.
 */

import {SCRIPT_FONTS, scriptFontFor, type Script} from './fonts'
import {fontUrl} from './typst/font-urls'

/** The family name the interface's font list names, in styles/tokens.css. */
export const INTERFACE_FAMILY: Readonly<Record<Script, string>> = {bengali: 'Vitaena Bangla', devanagari: 'Vitaena Devanagari', arabic: 'Vitaena Urdu'}

const RANGES: Readonly<Record<Script, string>> = {bengali: 'U+0980-09FF, U+200C-200D, U+25CC', devanagari: 'U+0900-097F, U+A8E0-A8FF, U+200C-200D, U+25CC', arabic: 'U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F'}

let added = false

export function addScriptFaces(): void {
    if (added || typeof FontFace === 'undefined' || typeof document === 'undefined') {
        return
    }

    added = true

    for (const script of new Set(SCRIPT_FONTS.map((font) => font.script))) {
        const font = scriptFontFor(script, 'Sans serif')

        for (const file of font.files) {
            const weight = /700Bold/.test(file) ? '700' : '400'

            document.fonts.add(new FontFace(INTERFACE_FAMILY[script], `url(${fontUrl(file)})`, {weight, unicodeRange: RANGES[script]}))
        }
    }
}
