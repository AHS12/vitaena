/**
 * A family section in the editor: one row for each of the family, with their relation,
 * name, work and a note such as "Married". Rows can be moved, hidden and removed.
 */

import {Plus, Trash2} from 'lucide-react'
import {DragHandle, SortableList, type HandleProps} from '../../components/Sortable'
import {moveItem} from '../../core/list'
import {emptyFamilyMember, type FamilyMember, type Sectioned} from '../sections'
import type {DocumentEdit} from '../use-cv-edit'
import {updateMember, updateMembers} from './edit-ops'
import {VisibilityButton} from './VisibilityButton'

type Edit = DocumentEdit<Sectioned>

function MemberRow({sectionId, member, handle, edit}: {sectionId: string; member: FamilyMember; handle: HandleProps; edit: Edit}) {
    const what = [member.relation, member.name].map((part) => part.trim()).filter(Boolean).join(', ') || 'this person'
    const type = (change: Partial<FamilyMember>) => edit.type((doc) => updateMember(doc, sectionId, member.id, change))

    return (
        <div className="member-row" data-hidden={!member.visible || undefined} onBlur={edit.commit}>
            <DragHandle handle={handle} size={13} />
            <input className="form-field__input member-row__relation" aria-label="Relation" value={member.relation} placeholder="Brother" onChange={(event) => type({relation: event.target.value})} />
            <input className="form-field__input" aria-label={`${member.relation || 'Their'} name`} value={member.name} placeholder="Name" onChange={(event) => type({name: event.target.value})} />
            <span className="member-row__actions">
                <VisibilityButton visible={member.visible} what={what} onToggle={() => edit.act(member.visible ? 'hide person' : 'show person', (doc) => updateMember(doc, sectionId, member.id, {visible: !member.visible}))} />
                <button type="button" className="icon-button" aria-label={`Remove ${what}`} title="Remove. Undo brings it back." onClick={() => edit.act('remove person', (doc) => updateMembers(doc, sectionId, (members) => members.filter((item) => item.id !== member.id)))}>
                    <Trash2 size={13} aria-hidden="true" />
                </button>
            </span>
            <input className="form-field__input member-row__work" aria-label={`${member.relation || 'Their'} work`} value={member.work} placeholder="Work, such as Engineer" onChange={(event) => type({work: event.target.value})} />
            <input className="form-field__input member-row__note" aria-label={`Note on ${member.relation || 'them'}`} value={member.note} placeholder="Note, such as Married" onChange={(event) => type({note: event.target.value})} />
        </div>
    )
}

export function FamilyRows({sectionId, members, edit}: {sectionId: string; members: readonly FamilyMember[]; edit: Edit}) {
    return (
        <>
            <SortableList
                items={members}
                idOf={(member) => member.id}
                labelOf={(member) => member.relation || member.name || 'person'}
                className="detail-list"
                onMove={(from, to) => edit.act('move person', (doc) => updateMembers(doc, sectionId, (current) => moveItem(current, from, to)))}
            >
                {(member, _, handle) => <MemberRow sectionId={sectionId} member={member} handle={handle} edit={edit} />}
            </SortableList>
            <button type="button" className="button panel__add" onClick={() => edit.act('add person', (doc) => updateMembers(doc, sectionId, (current) => [...current, emptyFamilyMember()]))}>
                <Plus size={13} aria-hidden="true" />
                Add someone
            </button>
        </>
    )
}
