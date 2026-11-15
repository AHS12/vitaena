/**
 * The CV editor: the form on the left, the pages on the right.
 *
 * This is the first working version, for trying the layout engine end to end. The
 * outline and inspector from the plan replace the form later.
 */

import './cv-editor.css'
import {useDocumentStore} from '../store/document-store'
import {emptyEntry, newId, type Cv, type CvEntry, type CvPerson, type CvSection, type CvTagGroup} from './cv'
import {CvPreview} from './CvPreview'
import {useCvEdit} from './use-cv-edit'

type Edit = ReturnType<typeof useCvEdit>

function Field({label, value, onChange, onBlur, placeholder, type = 'text'}: {label: string; value: string; onChange: (value: string) => void; onBlur: () => void; placeholder?: string; type?: string}) {
    return (
        <label className="cv-field">
            <span className="cv-field__label">{label}</span>
            <input className="cv-field__input" type={type} value={value} placeholder={placeholder} spellCheck={type === 'text'} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
        </label>
    )
}

function Area({label, value, onChange, onBlur, rows = 3, placeholder}: {label: string; value: string; onChange: (value: string) => void; onBlur: () => void; rows?: number; placeholder?: string}) {
    return (
        <label className="cv-field">
            <span className="cv-field__label">{label}</span>
            <textarea className="cv-field__input cv-field__area" rows={rows} value={value} placeholder={placeholder} spellCheck onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
        </label>
    )
}

const withSection = (cv: Cv, id: string, update: (section: CvSection) => CvSection): Cv => ({
    ...cv,
    sections: cv.sections.map((section) => (section.id === id ? update(section) : section)),
})

function PersonFields({person, edit}: {person: CvPerson; edit: Edit}) {
    const set = (key: keyof Omit<CvPerson, 'links'>) => (value: string) => edit.type((cv) => ({...cv, person: {...cv.person, [key]: value}}))
    const link = person.links[0]?.url ?? ''

    return (
        <fieldset className="cv-group">
            <legend className="cv-group__title">You</legend>
            <Field label="Name" value={person.name} onChange={set('name')} onBlur={edit.commit} />
            <Field label="Headline" value={person.headline} onChange={set('headline')} onBlur={edit.commit} placeholder="Software engineer" />
            <div className="cv-row">
                <Field label="Email" type="email" value={person.email} onChange={set('email')} onBlur={edit.commit} />
                <Field label="Phone" type="tel" value={person.phone} onChange={set('phone')} onBlur={edit.commit} />
            </div>
            <div className="cv-row">
                <Field label="Location" value={person.location} onChange={set('location')} onBlur={edit.commit} placeholder="City, Country" />
                <Field
                    label="Website or LinkedIn"
                    type="url"
                    value={link}
                    onBlur={edit.commit}
                    onChange={(url) => edit.type((cv) => ({...cv, person: {...cv.person, links: url ? [{id: cv.person.links[0]?.id ?? newId('link'), label: '', url}] : []}}))}
                />
            </div>
        </fieldset>
    )
}

function EntryFields({sectionId, entry, edit}: {sectionId: string; entry: CvEntry; edit: Edit}) {
    const update = (change: Partial<CvEntry>) =>
        edit.type((cv) =>
            withSection(cv, sectionId, (section) => (section.kind === 'entries' ? {...section, entries: section.entries.map((item) => (item.id === entry.id ? {...item, ...change} : item))} : section)),
        )

    return (
        <div className="cv-entry">
            <div className="cv-row">
                <Field label="Title" value={entry.title} onChange={(title) => update({title})} onBlur={edit.commit} placeholder="Role, degree or project" />
                <Field label="Organisation" value={entry.org} onChange={(org) => update({org})} onBlur={edit.commit} placeholder="Company or school" />
            </div>
            <div className="cv-row">
                <Field label="Location" value={entry.location} onChange={(location) => update({location})} onBlur={edit.commit} />
                <Field label="From" type="month" value={entry.start} onChange={(start) => update({start})} onBlur={edit.commit} />
                {entry.current ? null : <Field label="To" type="month" value={entry.end} onChange={(end) => update({end})} onBlur={edit.commit} />}
            </div>
            <label className="cv-check">
                <input type="checkbox" checked={entry.current} onChange={(event) => edit.act('current', (cv) => withSection(cv, sectionId, (section) => (section.kind === 'entries' ? {...section, entries: section.entries.map((item) => (item.id === entry.id ? {...item, current: event.target.checked} : item))} : section)))} />
                I'm still here
            </label>
            <Area label="Summary" value={entry.summary} onChange={(summary) => update({summary})} onBlur={edit.commit} rows={2} />
            <Area
                label="Achievements, one per line"
                value={entry.bullets.join('\n')}
                onChange={(text) => update({bullets: text.split('\n')})}
                onBlur={edit.commit}
                rows={4}
                placeholder="Cut build times by 40% by…"
            />
            <div className="cv-entry__actions">
                <button
                    type="button"
                    className="text-button"
                    onClick={() => edit.act('remove entry', (cv) => withSection(cv, sectionId, (section) => (section.kind === 'entries' ? {...section, entries: section.entries.filter((item) => item.id !== entry.id)} : section)))}
                >
                    Remove
                </button>
            </div>
        </div>
    )
}

function TagGroupFields({sectionId, group, edit}: {sectionId: string; group: CvTagGroup; edit: Edit}) {
    const update = (change: Partial<CvTagGroup>) =>
        edit.type((cv) => withSection(cv, sectionId, (section) => (section.kind === 'tags' ? {...section, groups: section.groups.map((item) => (item.id === group.id ? {...item, ...change} : item))} : section)))

    return (
        <div className="cv-row">
            <Field label="Group" value={group.label} onChange={(label) => update({label})} onBlur={edit.commit} placeholder="Languages" />
            <Field label="Skills, separated by commas" value={group.items.join(', ')} onChange={(text) => update({items: text.split(',').map((item) => item.trim())})} onBlur={edit.commit} placeholder="Go, TypeScript, SQL" />
        </div>
    )
}

function SectionFields({section, edit}: {section: CvSection; edit: Edit}) {
    return (
        <fieldset className="cv-group">
            <legend className="cv-group__title">
                <input
                    className="cv-group__heading"
                    aria-label="Section heading"
                    value={section.title}
                    onChange={(event) => edit.type((cv) => withSection(cv, section.id, (item) => ({...item, title: event.target.value})))}
                    onBlur={edit.commit}
                />
                <label className="cv-check">
                    <input type="checkbox" checked={section.visible} onChange={(event) => edit.act('show section', (cv) => withSection(cv, section.id, (item) => ({...item, visible: event.target.checked})))} />
                    Show
                </label>
            </legend>
            {section.kind === 'text' ? (
                <Area label="Text" value={section.text} rows={4} onChange={(text) => edit.type((cv) => withSection(cv, section.id, (item) => (item.kind === 'text' ? {...item, text} : item)))} onBlur={edit.commit} />
            ) : section.kind === 'entries' ? (
                <>
                    {section.entries.map((entry) => (
                        <EntryFields key={entry.id} sectionId={section.id} entry={entry} edit={edit} />
                    ))}
                    <button type="button" className="button" onClick={() => edit.act('add entry', (cv) => withSection(cv, section.id, (item) => (item.kind === 'entries' ? {...item, entries: [...item.entries, emptyEntry()]} : item)))}>
                        Add to {section.title || 'this section'}
                    </button>
                </>
            ) : (
                <>
                    {section.groups.map((group) => (
                        <TagGroupFields key={group.id} sectionId={section.id} group={group} edit={edit} />
                    ))}
                    <button
                        type="button"
                        className="button"
                        onClick={() => edit.act('add group', (cv) => withSection(cv, section.id, (item) => (item.kind === 'tags' ? {...item, groups: [...item.groups, {id: newId('group'), visible: true, label: '', items: []}]} : item)))}
                    >
                        Add a group
                    </button>
                </>
            )}
        </fieldset>
    )
}

export function CvEditor() {
    const cv = useDocumentStore((state) => state.content)
    const edit = useCvEdit()

    return (
        <main className="cv-editor">
            <div className="cv-form" data-coach="editor">
                <PersonFields person={cv.person} edit={edit} />
                {cv.sections.map((section) => (
                    <SectionFields key={section.id} section={section} edit={edit} />
                ))}
            </div>
            <CvPreview />
        </main>
    )
}
