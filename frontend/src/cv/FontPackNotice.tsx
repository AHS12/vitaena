/**
 * Asks to download the fonts a page needs that aren't on this computer, such as those
 * for Japanese, whose letters show as empty boxes until they are. In Style, `forChoice`
 * asks for them so their fonts can be chosen, and under Write in, as the language is chosen.
 */

import {Download} from 'lucide-react'
import {isInstalled, useFontPacks} from './downloaded-fonts'
import {megabytes, packLanguage, type FontPack} from './font-packs'

export function FontPackNotice({wanted, forChoice = false, forLanguage = false}: {wanted: readonly FontPack[]; forChoice?: boolean; forLanguage?: boolean}) {
    const {packs, progress, failed, download} = useFontPacks()
    const missing = wanted.filter((pack) => !isInstalled(packs, pack.id))

    if (missing.length === 0) {
        return null
    }

    return (
        <div className="font-pack-notice" role="status">
            {missing.map((pack) => {
                const fraction = progress[pack.id]
                const language = packLanguage(pack.id)

                return (
                    <p key={pack.id} className="font-pack-notice__row">
                        <span className="font-pack-notice__text">
                            {failed[pack.id]
                                ? `Couldn't download the fonts for ${language}: ${failed[pack.id]}. Check you're online, and try again.`
                                : forLanguage
                                  ? `${language[0].toUpperCase() + language.slice(1)} needs its fonts, which don't come with the app. Download them once, and every document in ${language} uses them.`
                                  : forChoice
                                  ? `More fonts for ${language} come with its download.`
                                  : `The fonts for ${language} aren't on this computer yet, so its letters show as empty boxes.`}
                        </span>
                        {fraction === undefined ? (
                            <button type="button" className="button button--primary" onClick={() => void download(pack.id)}>
                                <Download size={14} aria-hidden="true" />
                                {failed[pack.id] ? 'Try again' : `Download (${megabytes(pack.bytes)})`}
                            </button>
                        ) : (
                            <span className="font-pack-notice__progress tabular">Downloading… {Math.round(fraction * 100)}%</span>
                        )}
                    </p>
                )
            })}
        </div>
    )
}
