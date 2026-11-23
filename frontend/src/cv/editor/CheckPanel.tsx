/**
 * The check: what a screening system reads from the PDF, and plain advice on what
 * might trip it up. The text shown is pulled out of the real PDF, not made up from the
 * form, so what you see here is what a parser gets.
 */

import {AlertTriangle, CheckCircle2, Lightbulb} from 'lucide-react'
import {useEffect, useMemo, useState} from 'react'
import {missingFontResults, useAddedFonts} from '../added-fonts'
import {checkCv, type CheckLevel, type CheckResult} from '../ats-check'
import {countryOf} from '../countries'
import type {Cv} from '../cv'
import {renderModel} from '../render-model'

const SETTLE_MS = 700

const ICONS: Record<CheckLevel, typeof CheckCircle2> = {good: CheckCircle2, tip: Lightbulb, warning: AlertTriangle}
const ORDER: Record<CheckLevel, number> = {warning: 0, tip: 1, good: 2}

export type CheckFix = NonNullable<CheckResult['fix']>

const FIX_LABELS: Readonly<Record<CheckFix, string>> = {'ats-mode': 'Turn on ATS mode', 'hide-photo': 'Hide the photo', paper: 'Change the paper'}

/** Advice, the most pressing first. `onFix` serves a CV's one-click fixes. */
export function CheckList({results, onFix}: {results: readonly CheckResult[]; onFix?(fix: CheckFix): void}) {
    const sorted = [...results].sort((a, b) => ORDER[a.level] - ORDER[b.level])

    return (
        <ul className="checks">
            {sorted.map((result) => {
                const Icon = ICONS[result.level]

                return (
                    <li key={result.id} className="check" data-level={result.level}>
                        <Icon size={15} aria-hidden="true" className="check__icon" />
                        <span className="check__body">
                            <span className="check__title">{result.title}</span>
                            {result.detail ? <span className="check__detail">{result.detail}</span> : null}
                            {result.fix && onFix ? (
                                <button type="button" className="button button--primary check__fix" onClick={() => result.fix && onFix(result.fix)}>
                                    {result.fixLabel ?? FIX_LABELS[result.fix]}
                                </button>
                            ) : null}
                        </span>
                    </li>
                )
            })}
        </ul>
    )
}

type Read = {readonly kind: 'reading'} | {readonly kind: 'read'; readonly pages: number; readonly text: string} | {readonly kind: 'failed'; readonly message: string}

export function CheckPanel({cv, onFix}: {cv: Cv; onFix(fix: CheckFix): void}) {
    const [read, setRead] = useState<Read>({kind: 'reading'})

    useEffect(() => {
        let current = true
        const timer = window.setTimeout(() => {
            void (async () => {
                try {
                    const [{pdf}, {pdfText}] = await Promise.all([import('../typst/engine'), import('../pdf-text')])
                    const result = await pdfText(await pdf(renderModel(cv), cv.design.template))

                    if (current) {
                        setRead({kind: 'read', pages: result.pages, text: result.text})
                    }
                } catch (error) {
                    if (current) {
                        setRead({kind: 'failed', message: error instanceof Error ? error.message : String(error)})
                    }
                }
            })()
        }, SETTLE_MS)

        return () => {
            current = false
            window.clearTimeout(timer)
        }
    }, [cv])

    const pages = read.kind === 'read' ? read.pages : null
    const added = useAddedFonts((state) => state.fonts)
    const results = useMemo(() => [...missingFontResults(cv.design, added), ...checkCv(cv, pages)], [cv, pages, added])
    const country = countryOf(cv.design.country)
    const forCountry = results.filter((result) => result.country)

    return (
        <div className="check-panel">
            <section aria-label="Advice">
                <h3 className="design-group__title">Before you send it</h3>
                <CheckList results={results.filter((result) => !result.country)} onFix={onFix} />
            </section>
            {country.id !== 'any' ? (
                <section aria-label={`For ${country.name}`}>
                    <h3 className="design-group__title">For {country.name}</h3>
                    {forCountry.length > 0 ? <CheckList results={forCountry} onFix={onFix} /> : <p className="design-panel__tip">Nothing to change: it suits what employers there expect. A job advert&apos;s own instructions always come first.</p>}
                </section>
            ) : null}
            <section aria-label="What a screening system reads">
                <h3 className="design-group__title">What a screening system reads</h3>
                <p className="design-panel__tip">The text pulled out of your PDF, in the order a parser gets it. If something is missing or jumbled here, it is for them too.</p>
                {read.kind === 'reading' ? (
                    <p className="design-panel__tip">Reading the PDF…</p>
                ) : read.kind === 'failed' ? (
                    <p className="form-field__warning">Couldn&apos;t read the PDF. {read.message}</p>
                ) : (
                    <pre className="ats-text" tabIndex={0}>
                        {read.text}
                    </pre>
                )}
            </section>
        </div>
    )
}
