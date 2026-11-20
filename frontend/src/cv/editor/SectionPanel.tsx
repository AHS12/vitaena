/**
 * One section of the CV in the editor: a card that folds, with its heading, a switch to
 * leave it off the page, and what it holds: text, entries, groups of skills, rows of
 * details or the family.
 */

import {ChevronRight, Plus, Trash2} from 'lucide-react'
import {BulletList} from '../../components/BulletList'
import {FORMATTING_HINT} from '../../components/format-keys'
import {MonthField, TextArea, TextField} from '../../components/fields'
import {DragHandle, SortableList, type HandleProps} from '../../components/Sortable'
import {moveItem} from '../../core/list'
import {Switch} from '../../components/controls'
import {TagInput} from '../../components/TagInput'
import {levelsFor} from '../levels'
import {LevelList} from './LevelList'
import {emptyEntry, type Entry, type Section, type Sectioned, type TagGroup} from '../sections'
import {datesText} from '../render-model'
import type {DocumentEdit} from '../use-cv-edit'
import {emptyGroup, entryWords, removeSection, toggled, updateEntries, updateEntry, updateGroup, updateGroups, updateSection} from './edit-ops'
import {useEditorStore} from './editor-store'
import {ShowParts} from './ShowParts'
import {DetailRows} from './DetailRows'
import {FamilyRows} from './FamilyRows'
import {SecondLabel} from './second-labels'
import {VisibilityButton} from './VisibilityButton'

type Edit = DocumentEdit<Sectioned>

const ENTRY_PARTS = [
    {id: 'location', label: 'Location'},
    {id: 'dates', label: 'Dates'},
    {id: 'summary', label: 'Summary'},
] as const

function EntryCard({sectionId, sectionTitle, entry, handle, edit}: {sectionId: string; sectionTitle: string; entry: Entry; handle: HandleProps; edit: Edit}) {
    const open = useEditorStore((state) => state.openEntries.has(entry.id))
    const toggle = useEditorStore((state) => state.toggleEntry)
    const words = entryWords(sectionTitle)
    const update = (change: Partial<Entry>) => edit.type((cv) => updateEntry(cv, sectionId, entry.id, change))
    const name = [entry.title, entry.org].filter((part) => part.trim()).join(', ') || `New ${words.title.toLowerCase()}`
    const dates = datesText(entry)

    return (
        <div className="entry-card" data-open={open || undefined} data-hidden={!entry.visible || undefined}>
            <div className="entry-card__head">
                <DragHandle handle={handle} />
                <button type="button" className="entry-card__toggle" aria-expanded={open} onClick={() => toggle(entry.id)}>
                    <ChevronRight size={14} className="disclosure-chevron" aria-hidden="true" />
                    <span className="entry-card__name">{name}</span>
                    {dates ? <span className="entry-card__dates">{dates}</span> : null}
                </button>
                <VisibilityButton visible={entry.visible} what={name} onToggle={() => edit.act(entry.visible ? 'hide entry' : 'show entry', (cv) => updateEntry(cv, sectionId, entry.id, {visible: !entry.visible}))} />
                <button type="button" className="icon-button" aria-label={`Remove ${name}`} title="Remove. Undo brings it back." onClick={() => edit.act('remove entry', (cv) => updateEntries(cv, sectionId, (entries) => entries.filter((item) => item.id !== entry.id)))}>
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </div>
            {open ? (
                <div className="entry-card__body" onBlur={edit.commit}>
                    <div className="form-row">
                        <TextField label={words.title} value={entry.title} placeholder={words.titleExample} onChange={(title) => update({title})} />
                        <TextField label={words.org} value={entry.org} placeholder={words.orgExample} onChange={(org) => update({org})} />
                    </div>
                    <div className="form-row form-row--dates">
                        <TextField label="Location" value={entry.location} placeholder="City, Country" onChange={(location) => update({location})} />
                        <MonthField label="From" value={entry.start} onChange={(start) => edit.act('dates', (cv) => updateEntry(cv, sectionId, entry.id, {start}))} />
                        <MonthField label="To" value={entry.end} present={entry.current} presentLabel="Present" onChange={(end, current) => edit.act('dates', (cv) => updateEntry(cv, sectionId, entry.id, {end, current}))} />
                    </div>
                    <TextArea label="Summary" value={entry.summary} minRows={1} formatting hint="Optional. One or two lines on the role as a whole." onChange={(summary) => update({summary})} />
                    <BulletList label="Achievements" values={entry.bullets} placeholder="Cut build times by 40% by…" onChange={(bullets) => update({bullets})} />
                    <ShowParts
                        parts={ENTRY_PARTS}
                        hidden={entry.hide}
                        onToggle={(part) => edit.act('show part', (cv) => updateEntry(cv, sectionId, entry.id, {hide: toggled(entry.hide, part)}))}
                    />
                </div>
            ) : null}
        </div>
    )
}

function GroupRow({sectionId, group, handle, edit, single}: {sectionId: string; group: TagGroup; handle: HandleProps; edit: Edit; single: boolean}) {
    return (
        <div className="group-row" data-hidden={!group.visible || undefined} onBlur={edit.commit}>
            <DragHandle handle={handle} />
            <div className="group-row__fields">
                <TextField label="Group" value={group.label} placeholder={single ? 'Optional, such as Languages' : 'Languages'} onChange={(label) => edit.type((cv) => updateGroup(cv, sectionId, group.id, {label}))} />
                {group.showLevels ? (
                    <LevelList
                        id={group.id}
                        items={group.items}
                        levels={group.levels}
                        onAct={(what, change) => edit.act(what, (cv) => updateGroup(cv, sectionId, group.id, change))}
                        onType={(change) => edit.type((cv) => updateGroup(cv, sectionId, group.id, change))}
                        onCommit={edit.commit}
                    />
                ) : (
                    <TagInput
                        label="Items"
                        values={group.items}
                        placeholder="Type one, then Enter"
                        onChange={(items) => edit.act('skills', (cv) => updateGroup(cv, sectionId, group.id, {items, levels: levelsFor(items, group)}))}
                    />
                )}
                <div className="group-row__levels">
                    <Switch
                        label="Show levels"
                        value={group.showLevels}
                        onChange={(showLevels) => edit.act(showLevels ? 'show levels' : 'hide levels', (cv) => updateGroup(cv, sectionId, group.id, {showLevels, levels: levelsFor(group.items, group)}))}
                    />
                    <span className="group-row__levels-text">
                        Show levels
                        <span className="group-row__levels-hint">Dots or a bar beside each item, as for languages</span>
                    </span>
                </div>
            </div>
            <div className="group-row__actions">
                <VisibilityButton visible={group.visible} what={group.label || 'this group'} onToggle={() => edit.act('show group', (cv) => updateGroup(cv, sectionId, group.id, {visible: !group.visible}))} />
                <button type="button" className="icon-button" aria-label={`Remove ${group.label || 'this group'}`} onClick={() => edit.act('remove group', (cv) => updateGroups(cv, sectionId, (groups) => groups.filter((item) => item.id !== group.id)))}>
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </div>
        </div>
    )
}

export function SectionPanel({section, handle, edit}: {section: Section; handle: HandleProps; edit: Edit}) {
    const closed = useEditorStore((state) => state.closedSections.has(section.id))
    const toggle = useEditorStore((state) => state.toggleSection)
    const openEntry = useEditorStore((state) => state.openEntry)
    const count = section.kind === 'entries' ? section.entries.length : section.kind === 'tags' ? section.groups.length : section.kind === 'details' ? section.rows.length : section.kind === 'family' ? section.members.length : 0

    return (
        <section className="panel" data-open={!closed || undefined} data-hidden={!section.visible || undefined} aria-label={section.title || 'Untitled section'}>
            <header className="panel__head">
                <DragHandle handle={handle} />
                <button type="button" className="icon-button panel__toggle" aria-expanded={!closed} aria-label={closed ? `Open ${section.title}` : `Fold ${section.title}`} onClick={() => toggle(section.id)}>
                    <ChevronRight size={14} className="disclosure-chevron" aria-hidden="true" />
                </button>
                <input
                    className="panel__title"
                    aria-label="Section heading"
                    value={section.title}
                    placeholder="Section heading"
                    onChange={(event) => edit.type((cv) => updateSection(cv, section.id, (item) => ({...item, title: event.target.value})))}
                    onBlur={edit.commit}
                />
                {closed && count > 0 ? <span className="panel__count tabular">{count}</span> : null}
                <VisibilityButton visible={section.visible} what={section.title} onToggle={() => edit.act(section.visible ? 'hide section' : 'show section', (cv) => updateSection(cv, section.id, (item) => ({...item, visible: !item.visible})))} />
                <button type="button" className="icon-button" aria-label={`Remove the ${section.title} section`} title="Remove the section. Undo brings it back." onClick={() => edit.act('remove section', (cv) => removeSection(cv, section.id))}>
                    <Trash2 size={14} aria-hidden="true" />
                </button>
            </header>
            <SecondLabel id={section.id} of={section.title} />
            {closed ? null : (
                <div className="panel__body">
                    {section.kind === 'text' ? (
                        <TextArea
                            label="Text"
                            value={section.text}
                            minRows={3}
                            formatting
                            hint={FORMATTING_HINT}
                            placeholder="Two or three sentences on who you are and what you're best at."
                            onChange={(text) => edit.type((cv) => updateSection(cv, section.id, (item) => (item.kind === 'text' ? {...item, text} : item)))}
                            onBlur={edit.commit}
                        />
                    ) : section.kind === 'entries' ? (
                        <>
                            <SortableList
                                items={section.entries}
                                idOf={(entry) => entry.id}
                                labelOf={(entry) => entry.title || entry.org || 'entry'}
                                className="entry-list"
                                onMove={(from, to) => edit.act('move entry', (cv) => updateEntries(cv, section.id, (entries) => moveItem(entries, from, to)))}
                            >
                                {(entry, _, entryHandle) => <EntryCard sectionId={section.id} sectionTitle={section.title} entry={entry} handle={entryHandle} edit={edit} />}
                            </SortableList>
                            <button
                                type="button"
                                className="button panel__add"
                                onClick={() => {
                                    const entry = emptyEntry()

                                    openEntry(entry.id)
                                    edit.act('add entry', (cv) => updateEntries(cv, section.id, (entries) => [...entries, entry]))
                                }}
                            >
                                <Plus size={13} aria-hidden="true" />
                                Add {entryWords(section.title).title.toLowerCase()}
                            </button>
                        </>
                    ) : section.kind === 'details' ? (
                        <DetailRows sectionId={section.id} rows={section.rows} edit={edit} />
                    ) : section.kind === 'family' ? (
                        <FamilyRows sectionId={section.id} members={section.members} edit={edit} />
                    ) : (
                        <>
                            <SortableList
                                items={section.groups}
                                idOf={(group) => group.id}
                                labelOf={(group) => group.label || 'group'}
                                className="group-list"
                                onMove={(from, to) => edit.act('move group', (cv) => updateGroups(cv, section.id, (groups) => moveItem(groups, from, to)))}
                            >
                                {(group, _, groupHandle) => <GroupRow sectionId={section.id} group={group} handle={groupHandle} edit={edit} single={section.groups.length === 1} />}
                            </SortableList>
                            <button type="button" className="button panel__add" onClick={() => edit.act('add group', (cv) => updateGroups(cv, section.id, (groups) => [...groups, emptyGroup()]))}>
                                <Plus size={13} aria-hidden="true" />
                                Add a group
                            </button>
                        </>
                    )}
                </div>
            )}
        </section>
    )
}
