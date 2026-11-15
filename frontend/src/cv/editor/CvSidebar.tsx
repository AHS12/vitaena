/** The editor's side pane: you at the top, then each section, in the order they print. */

import {Dropdown} from '@heroui/react'
import {ChevronRight, Plus, Trash2} from 'lucide-react'
import {TextField} from '../../components/fields'
import {SortableList} from '../../components/Sortable'
import {newId, type Cv, type CvPerson} from '../cv'
import type {useCvEdit} from '../use-cv-edit'
import {emailWarning, linkWarning, moveSection, newSection, SECTION_CHOICES, toggled, updatePerson} from './edit-ops'
import {useEditorStore} from './editor-store'
import {CheckPanel} from './CheckPanel'
import {DesignPanel} from './DesignPanel'
import {SectionPanel} from './SectionPanel'
import {ShowParts} from './ShowParts'

type Edit = ReturnType<typeof useCvEdit>

const PERSON = 'person'

const PERSON_PARTS = [
    {id: 'email', label: 'Email'},
    {id: 'phone', label: 'Phone'},
    {id: 'location', label: 'Location'},
] as const

const TAB_LABELS = {content: 'Content', design: 'Design', check: 'Check'} as const

function PersonPanel({person, edit}: {person: CvPerson; edit: Edit}) {
    const closed = useEditorStore((state) => state.closedSections.has(PERSON))
    const toggle = useEditorStore((state) => state.toggleSection)
    const set = (key: keyof Omit<CvPerson, 'links'>) => (value: string) => edit.type((cv) => updatePerson(cv, {[key]: value}))

    return (
        <section className="panel" data-open={!closed || undefined} aria-label="You">
            <header className="panel__head">
                <button type="button" className="icon-button panel__toggle" aria-expanded={!closed} aria-label={closed ? 'Open your details' : 'Fold your details'} onClick={() => toggle(PERSON)}>
                    <ChevronRight size={14} className="disclosure-chevron" aria-hidden="true" />
                </button>
                <span className="panel__title panel__title--fixed">You</span>
            </header>
            {closed ? null : (
                <div className="panel__body" onBlur={edit.commit}>
                    <TextField label="Full name" value={person.name} placeholder="Nadia Rahman" autoComplete="name" onChange={set('name')} />
                    <TextField label="Headline" value={person.headline} placeholder="Senior Software Engineer" hint="The role you want, in the words a job ad would use." onChange={set('headline')} />
                    <div className="form-row">
                        <TextField label="Email" type="email" value={person.email} placeholder="you@example.com" autoComplete="email" warning={emailWarning(person.email)} onChange={set('email')} />
                        <TextField label="Phone" type="tel" value={person.phone} placeholder="+880 1700 000000" autoComplete="tel" onChange={set('phone')} />
                    </div>
                    <TextField label="Location" value={person.location} placeholder="City, Country" onChange={set('location')} />
                    <ShowParts
                        parts={PERSON_PARTS}
                        hidden={person.hide}
                        onToggle={(part) => edit.act('show part', (cv) => updatePerson(cv, {hide: toggled(cv.person.hide, part)}))}
                    />
                    <div className="form-field">
                        <span className="form-field__label">Links</span>
                        {person.links.map((link) => (
                            <div className="link-row" key={link.id}>
                                <TextField
                                    label="Link"
                                    className="link-row__field"
                                    type="url"
                                    value={link.url}
                                    placeholder="linkedin.com/in/your-name"
                                    warning={linkWarning(link.url)}
                                    onChange={(url) => edit.type((cv) => updatePerson(cv, {links: cv.person.links.map((item) => (item.id === link.id ? {...item, url} : item))}))}
                                />
                                <button type="button" className="icon-button" aria-label={`Remove ${link.url || 'this link'}`} onClick={() => edit.act('remove link', (cv) => updatePerson(cv, {links: cv.person.links.filter((item) => item.id !== link.id)}))}>
                                    <Trash2 size={14} aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                        <button type="button" className="text-button bullets__add" onClick={() => edit.act('add link', (cv) => updatePerson(cv, {links: [...cv.person.links, {id: newId('link'), label: '', url: ''}]}))}>
                            <Plus size={12} aria-hidden="true" />
                            Add a link: LinkedIn, GitHub, a portfolio
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}

function AddSection({cv, edit}: {cv: Cv; edit: Edit}) {
    const openEntry = useEditorStore((state) => state.openEntry)
    const taken = new Set(cv.sections.map((section) => section.title.trim().toLowerCase()))

    const add = (title: string, kind: Cv['sections'][number]['kind']) => {
        const section = newSection(title, kind)

        if (section.kind === 'entries') {
            section.entries.forEach((entry) => openEntry(entry.id))
        }

        edit.act('add section', (current) => ({...current, sections: [...current.sections, section]}))
    }

    return (
        <Dropdown>
            <Dropdown.Trigger className="button add-section">
                <Plus size={13} aria-hidden="true" />
                Add a section
            </Dropdown.Trigger>
            <Dropdown.Popover className="menu-popover" placement="bottom start" offset={4}>
                <Dropdown.Menu
                    className="menu-list"
                    aria-label="Add a section"
                    onAction={(key) => {
                        const id = String(key)

                        if (id === 'custom-text') {
                            add('Custom section', 'text')
                        } else if (id === 'custom-list') {
                            add('Custom section', 'entries')
                        } else {
                            const choice = SECTION_CHOICES.find((item) => item.title === id)

                            if (choice) {
                                add(choice.title, choice.kind)
                            }
                        }
                    }}
                    disabledKeys={SECTION_CHOICES.filter((choice) => taken.has(choice.title.toLowerCase())).map((choice) => choice.title)}
                >
                    {[
                        ...SECTION_CHOICES.map((choice) => (
                            <Dropdown.Item key={choice.title} id={choice.title} textValue={choice.title} className="menu-item">
                                <span className="menu-item__label">{choice.title}</span>
                            </Dropdown.Item>
                        )),
                        <Dropdown.Item key="divider" id="divider" isDisabled className="menu-divider" textValue="" aria-hidden="true" />,
                        <Dropdown.Item key="custom-text" id="custom-text" textValue="Custom text" className="menu-item">
                            <span className="menu-item__label">Custom: a paragraph</span>
                        </Dropdown.Item>,
                        <Dropdown.Item key="custom-list" id="custom-list" textValue="Custom list" className="menu-item">
                            <span className="menu-item__label">Custom: a list of entries</span>
                        </Dropdown.Item>,
                    ]}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}

export function CvSidebar({cv, edit}: {cv: Cv; edit: Edit}) {
    const tab = useEditorStore((state) => state.tab)
    const setTab = useEditorStore((state) => state.setTab)

    return (
        <div className="cv-side">
            <div className="cv-tabs" role="tablist" aria-label="Edit">
                {(['content', 'design', 'check'] as const).map((id) => (
                    <button key={id} type="button" role="tab" id={`cv-tab-${id}`} aria-selected={tab === id} aria-controls="cv-tab-panel" className="cv-tabs__tab" onClick={() => setTab(id)}>
                        {TAB_LABELS[id]}
                    </button>
                ))}
            </div>
            <div className="cv-sidebar" id="cv-tab-panel" role="tabpanel" aria-labelledby={`cv-tab-${tab}`} data-coach="editor">
                {tab === 'content' ? <ContentPanel cv={cv} edit={edit} /> : tab === 'design' ? <DesignPanel cv={cv} edit={edit} /> : <CheckPanel cv={cv} />}
            </div>
        </div>
    )
}

function ContentPanel({cv, edit}: {cv: Cv; edit: Edit}) {
    return (
        <>
            <PersonPanel person={cv.person} edit={edit} />
            <SortableList
                items={cv.sections}
                idOf={(section) => section.id}
                labelOf={(section) => section.title || 'section'}
                className="section-list"
                onMove={(from, to) => edit.act('move section', (current) => moveSection(current, from, to))}
            >
                {(section, _, handle) => <SectionPanel section={section} handle={handle} edit={edit} />}
            </SortableList>
            <AddSection cv={cv} edit={edit} />
            <p className="cv-sidebar__tip">Drag the grips, or press Alt+↑/↓, to change the order. Undo with Ctrl+Z.</p>
        </>
    )
}
