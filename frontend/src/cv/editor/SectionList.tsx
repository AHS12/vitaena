/** A document's sections in the editor, in the order they print, and the way to add one. */

import {SortableList} from '../../components/Sortable'
import type {Sectioned} from '../sections'
import type {DocumentEdit} from '../use-cv-edit'
import {AddSection, type SectionChoice} from './AddSection'
import {moveSection} from './edit-ops'
import {SectionPanel} from './SectionPanel'

export function SectionList({doc, edit, choices}: {doc: Sectioned; edit: DocumentEdit<Sectioned>; choices: readonly SectionChoice[]}) {
    return (
        <>
            <SortableList
                items={doc.sections}
                idOf={(section) => section.id}
                labelOf={(section) => section.title || 'section'}
                className="section-list"
                onMove={(from, to) => edit.act('move section', (current) => moveSection(current, from, to))}
            >
                {(section, _, handle) => <SectionPanel section={section} handle={handle} edit={edit} />}
            </SortableList>
            <AddSection choices={choices} doc={doc} edit={edit} />
            <p className="cv-sidebar__tip">Drag the grips, or press Alt+↑/↓, to change the order. Undo with Ctrl+Z.</p>
        </>
    )
}
