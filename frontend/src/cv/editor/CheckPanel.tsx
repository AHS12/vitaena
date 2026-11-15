/**
 * The check: what a screening system reads from the PDF, and plain advice on what
 * might trip it up. The text shown is pulled out of the real PDF, not made up from the
 * form, so what you see here is what a parser gets.
 */

import {AlertTriangle, CheckCircle2, Lightbulb} from 'lucide-react'
import {useEffect, useMemo, useState} from 'react'
import {checkCv, type CheckLevel} from '../ats-check'
import type {Cv} from '../cv'
import {renderModel} from '../render-model'

const SETTLE_MS = 700

const ICONS: Record<CheckLevel, typeof CheckCircle2> = {good: CheckCircle2, tip: Lightbulb, warning: AlertTriangle}
const ORDER: Record<CheckLevel, number> = {warning: 0, tip: 1, good: 2}

type Read = {readonly kind: 'reading'} | {readonly kind: 'read'; readonly pages: number; readonly text: string} | {readonly kind: 'failed'; readonly message: string}

export function CheckPanel({cv}: {cv: Cv}) {
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
    const results = useMemo(() => [...checkCv(cv, pages)].sort((a, b) => ORDER[a.level] - ORDER[b.level]), [cv, pages])

    return (
        <div className="check-panel">
            <section aria-label="Advice">
                <h3 className="design-group__title">Before you send it</h3>
                <ul className="checks">
                    {results.map((result) => {
                        const Icon = ICONS[result.level]

                        return (
                            <li key={result.id} className="check" data-level={result.level}>
                                <Icon size={15} aria-hidden="true" className="check__icon" />
                                <span className="check__body">
                                    <span className="check__title">{result.title}</span>
                                    {result.detail ? <span className="check__detail">{result.detail}</span> : null}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </section>
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
