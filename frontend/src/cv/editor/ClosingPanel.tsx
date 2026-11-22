/**
 * The closing line, at the foot of Content: place and date, and a signature or a line to
 * sign on, as German and South Asian CVs end. Off unless asked for, or a place that
 * expects it was chosen for a new CV.
 */

import {ChevronRight} from 'lucide-react'
import {Segmented} from '../../components/Segmented'
import {Switch} from '../../components/controls'
import {TextField} from '../../components/fields'
import {PhotoField} from '../../components/PhotoField'
import type {Cv, CvClosing} from '../cv'
import {closingText} from '../render-model'
import type {DocumentEdit} from '../use-cv-edit'
import {useEditorStore} from './editor-store'

const CLOSING = 'closing'

const SIGNATURE = {kind: 'whole', longest: 800, format: 'png'} as const

export function ClosingPanel({cv, edit}: {cv: Cv; edit: DocumentEdit<Cv>}) {
    const closed = useEditorStore((state) => state.closedSections.has(CLOSING))
    const toggle = useEditorStore((state) => state.toggleSection)
    const {closing} = cv
    const change = (label: string, values: Partial<CvClosing>) => edit.act(label, (current) => ({...current, closing: {...current.closing, ...values}}))
    const today = new Date()
    const fixed = closing.date !== ''

    return (
        <section className="panel" data-open={(closing.show && !closed) || undefined} aria-label="Closing line">
            <header className="panel__head">
                <button type="button" className="icon-button panel__toggle" aria-expanded={closing.show && !closed} aria-label={closed ? 'Open the closing line' : 'Fold the closing line'} disabled={!closing.show} onClick={() => toggle(CLOSING)}>
                    <ChevronRight size={14} className="disclosure-chevron" aria-hidden="true" />
                </button>
                <span className="panel__title panel__title--fixed">Place, date and signature</span>
                <Switch label="End the CV with place, date and signature" value={closing.show} onChange={(show) => change(show ? 'add closing line' : 'remove closing line', {show})} />
            </header>
            {closing.show && !closed ? (
                <div className="panel__body" onBlur={edit.commit}>
                    <p className="form-field__hint">Printed at the end, as German and South Asian CVs close: {closingText({...cv, closing: {...closing, place: closing.place || 'Berlin'}}, today)}.</p>
                    <TextField label="Place" value={closing.place} placeholder="Berlin" onChange={(place) => edit.type((current) => ({...current, closing: {...current.closing, place}}))} />
                    <div className="form-field">
                        <span className="form-field__label">Date</span>
                        <Segmented
                            label="Date"
                            value={fixed ? 'fixed' : 'today'}
                            options={[
                                {value: 'today', label: 'The day it’s printed'},
                                {value: 'fixed', label: 'A fixed day'},
                            ]}
                            onChange={(choice) => change('closing date', {date: choice === 'today' ? '' : (closing.date || today.toISOString().slice(0, 10))})}
                        />
                        {fixed ? <input className="form-field__input" type="date" aria-label="Closing date" value={closing.date} onChange={(event) => event.target.value && change('closing date', {date: event.target.value})} /> : null}
                    </div>
                    <PhotoField
                        label="Signature"
                        value={closing.signature}
                        shape={SIGNATURE}
                        noun="signature"
                        hint="A picture of your signature, ideally dark ink on a clear background. Without one, a line is left to sign on by hand."
                        onChange={(signature) => change(signature ? 'signature' : 'remove signature', {signature})}
                    />
                </div>
            ) : null}
        </section>
    )
}
