/**
 * A details section in the editor: rows of a label and its value, such as
 * "Nationality: British". Each row can be renamed, moved, hidden and removed. A date or
 * a height row also picks how it shows: a date, an age or both, and feet and inches,
 * centimetres or both.
 */

import {CalendarDays, Plus, Ruler, Trash2} from 'lucide-react'
import {Segmented} from '../../components/Segmented'
import {DragHandle, SortableList, type HandleProps} from '../../components/Sortable'
import {moveItem} from '../../core/list'
import type {DetailRow as CvDetailRow, Sectioned} from '../sections'
import {cmOf, detailValue, emptyDetailRow, feetAndInches} from '../details'
import type {DocumentEdit} from '../use-cv-edit'
import {updateRow, updateRows} from './edit-ops'
import {VisibilityButton} from './VisibilityButton'

type Edit = DocumentEdit<Sectioned>

const DATE_SHOWS = [
    {value: 'date', label: 'Date'},
    {value: 'age', label: 'Age'},
    {value: 'both', label: 'Both'},
] as const

const HEIGHT_SHOWS = [
    {value: 'ft-in', label: 'Feet and inches'},
    {value: 'cm', label: 'cm'},
    {value: 'both', label: 'Both'},
] as const

const PLACEHOLDERS = {text: 'Nationality', date: 'Date of birth', height: 'Height'} as const

/** A whole number typed in a small box, or 0 when it's left empty. */
const wholeOf = (text: string, max: number): number => Math.min(max, Math.max(0, Math.floor(Number(text) || 0)))

function HeightValue({row, onChange}: {row: Extract<CvDetailRow, {kind: 'height'}>; onChange(cm: number): void}) {
    const {feet, inches} = feetAndInches(row.cm)
    const given = row.cm > 0

    if (row.show === 'cm') {
        return (
            <span className="detail-row__height">
                <input className="form-field__input" type="number" inputMode="numeric" min={0} max={300} aria-label={`${row.label || 'Height'} in centimetres`} value={given ? row.cm : ''} onChange={(event) => onChange(wholeOf(event.target.value, 300))} />
                <span className="detail-row__unit">cm</span>
            </span>
        )
    }

    return (
        <span className="detail-row__height">
            <input className="form-field__input" type="number" inputMode="numeric" min={0} max={9} aria-label={`${row.label || 'Height'}, feet`} value={given ? feet : ''} onChange={(event) => onChange(cmOf(wholeOf(event.target.value, 9), inches))} />
            <span className="detail-row__unit">ft</span>
            <input className="form-field__input" type="number" inputMode="numeric" min={0} max={11} aria-label={`${row.label || 'Height'}, inches`} value={given && inches > 0 ? inches : ''} onChange={(event) => onChange(cmOf(feet, wholeOf(event.target.value, 11)))} />
            <span className="detail-row__unit">in</span>
        </span>
    )
}

function DetailRow({sectionId, row, handle, edit}: {sectionId: string; row: CvDetailRow; handle: HandleProps; edit: Edit}) {
    const name = row.label.trim() || 'this row'
    const act = (what: string, change: Partial<CvDetailRow>) => edit.act(what, (cv) => updateRow(cv, sectionId, row.id, change))
    const type = (change: Partial<CvDetailRow>) => edit.type((cv) => updateRow(cv, sectionId, row.id, change))
    const shown = row.kind === 'text' ? '' : detailValue(row, new Date())

    return (
        <div className="detail-row" data-hidden={!row.visible || undefined} onBlur={edit.commit}>
            <DragHandle handle={handle} size={13} />
            <input className="form-field__input detail-row__label" aria-label="Label" value={row.label} placeholder={PLACEHOLDERS[row.kind]} onChange={(event) => type({label: event.target.value})} />
            <span className="detail-row__value">
                {row.kind === 'text' ? (
                    <input className="form-field__input" aria-label={`${row.label || 'Row'} value`} value={row.value} placeholder="British" onChange={(event) => type({value: event.target.value})} />
                ) : row.kind === 'date' ? (
                    <input className="form-field__input" type="date" aria-label={`${row.label || 'Date'} value`} value={row.date} onChange={(event) => act('date', {date: event.target.value})} />
                ) : (
                    <HeightValue row={row} onChange={(cm) => type({cm})} />
                )}
            </span>
            <span className="detail-row__actions">
                <VisibilityButton visible={row.visible} what={name} onToggle={() => act(row.visible ? 'hide row' : 'show row', {visible: !row.visible})} />
                <button type="button" className="icon-button" aria-label={`Remove ${name}`} title="Remove. Undo brings it back." onClick={() => edit.act('remove row', (cv) => updateRows(cv, sectionId, (rows) => rows.filter((item) => item.id !== row.id)))}>
                    <Trash2 size={13} aria-hidden="true" />
                </button>
            </span>
            {row.kind === 'text' ? null : (
                <span className="detail-row__show">
                    {row.kind === 'date' ? (
                        <Segmented label={`Show ${name} as`} value={row.show} options={DATE_SHOWS} onChange={(show) => act('show as', {show})} />
                    ) : (
                        <Segmented label={`Show ${name} as`} value={row.show} options={HEIGHT_SHOWS} onChange={(show) => act('show as', {show})} />
                    )}
                    {shown ? <span className="detail-row__preview">{shown}</span> : null}
                </span>
            )}
        </div>
    )
}

export function DetailRows({sectionId, rows, edit}: {sectionId: string; rows: readonly CvDetailRow[]; edit: Edit}) {
    // A date or height row starts named for what it's most often for, so it never shows
    // on the page as a bare value. The label can be changed like any other.
    const add = (kind: CvDetailRow['kind']) => edit.act('add row', (cv) => updateRows(cv, sectionId, (current) => [...current, emptyDetailRow(kind, kind === 'text' ? '' : PLACEHOLDERS[kind])]))

    return (
        <>
            <SortableList
                items={rows}
                idOf={(row) => row.id}
                labelOf={(row) => row.label || 'row'}
                className="detail-list"
                onMove={(from, to) => edit.act('move row', (cv) => updateRows(cv, sectionId, (current) => moveItem(current, from, to)))}
            >
                {(row, _, handle) => <DetailRow sectionId={sectionId} row={row} handle={handle} edit={edit} />}
            </SortableList>
            <div className="detail-list__add">
                <button type="button" className="button" onClick={() => add('text')}>
                    <Plus size={13} aria-hidden="true" />
                    Add a row
                </button>
                <button type="button" className="button" onClick={() => add('date')} title="A date the page can show as an age, such as a date of birth">
                    <CalendarDays size={13} aria-hidden="true" />
                    Add a date
                </button>
                <button type="button" className="button" onClick={() => add('height')} title="A height in feet and inches, centimetres or both">
                    <Ruler size={13} aria-hidden="true" />
                    Add a height
                </button>
            </div>
        </>
    )
}
