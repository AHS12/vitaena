/** The editor's side pane: you at the top, then each section, in the order they print. */

import {ChevronRight, Plus, Trash2} from 'lucide-react'
import {TextField} from '../../components/fields'
import {PhotoField} from '../../components/PhotoField'
import {newId, type Cv, type CvPerson} from '../cv'
import type {Sectioned} from '../sections'
import type {DocumentEdit} from '../use-cv-edit'
import {CV_SECTION_CHOICES, emailWarning, linkWarning, toggled, updatePerson} from './edit-ops'
import {useEditorStore} from './editor-store'
import {CheckPanel} from './CheckPanel'
import {StylePanel, TemplatesPanel} from './DesignPanel'
import {SectionList} from './SectionList'
import {ShowParts} from './ShowParts'

type Edit = DocumentEdit<Cv>

const PERSON = 'person'

const PERSON_PARTS = [
    {id: 'email', label: 'Email'},
    {id: 'phone', label: 'Phone'},
    {id: 'location', label: 'Location'},
    {id: 'photo', label: 'Photo'},
] as const

const TAB_LABELS = {content: 'Content', check: 'Check'} as const

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
                    <TextField label="Full name" value={person.name} placeholder="Jane Doe" autoComplete="name" onChange={set('name')} />
                    <TextField label="Headline" value={person.headline} placeholder="Senior Software Engineer" hint="The role you want, in the words a job ad would use." onChange={set('headline')} />
                    <div className="form-row">
                        <TextField label="Email" type="email" value={person.email} placeholder="you@example.com" autoComplete="email" warning={emailWarning(person.email)} onChange={set('email')} />
                        <TextField label="Phone" type="tel" value={person.phone} placeholder="+1 555 0100" autoComplete="tel" onChange={set('phone')} />
                    </div>
                    <TextField label="Location" value={person.location} placeholder="City, Country" onChange={set('location')} />
                    <PhotoField label="Photo" value={person.photo} onChange={(photo) => edit.act(photo ? 'photo' : 'remove photo', (cv) => updatePerson(cv, {photo}))} />
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

export function CvSidebar({cv, edit, onAtsMode}: {cv: Cv; edit: Edit; onAtsMode(): void}) {
    const tab = useEditorStore((state) => state.tab)
    const setTab = useEditorStore((state) => state.setTab)

    return (
        <div className="cv-side">
            <div className="cv-tabs" role="tablist" aria-label="Edit" data-coach="editor-tabs">
                {(['content', 'check'] as const).map((id) => (
                    <button key={id} type="button" role="tab" id={`cv-tab-${id}`} aria-selected={tab === id} aria-controls="cv-tab-panel" className="cv-tabs__tab" onClick={() => setTab(id)}>
                        {TAB_LABELS[id]}
                    </button>
                ))}
            </div>
            <div className="cv-sidebar" id="cv-tab-panel" role="tabpanel" aria-labelledby={`cv-tab-${tab}`} data-coach="editor">
                {tab === 'content' ? <ContentPanel cv={cv} edit={edit} /> : <CheckPanel cv={cv} onAtsMode={onAtsMode} />}
            </div>
        </div>
    )
}

function ContentPanel({cv, edit}: {cv: Cv; edit: Edit}) {
    return (
        <>
            <PersonPanel person={cv.person} edit={edit} />
            <SectionList doc={cv} edit={edit as DocumentEdit<Sectioned>} choices={CV_SECTION_CHOICES} />
        </>
    )
}

const DESIGN_TABS = {templates: 'Templates', style: 'Style'} as const

/** The right pane: how the CV looks, as its template and the tweaks on top of it. */
export function DesignSidebar({cv, edit}: {cv: Cv; edit: Edit}) {
    const tab = useEditorStore((state) => state.designTab)
    const setTab = useEditorStore((state) => state.setDesignTab)

    return (
        <div className="cv-side cv-side--design" data-coach="design">
            <div className="cv-tabs" role="tablist" aria-label="Design">
                {(['templates', 'style'] as const).map((id) => (
                    <button key={id} type="button" role="tab" id={`design-tab-${id}`} aria-selected={tab === id} aria-controls="design-tab-panel" className="cv-tabs__tab" onClick={() => setTab(id)}>
                        {DESIGN_TABS[id]}
                    </button>
                ))}
            </div>
            <div className="cv-sidebar" id="design-tab-panel" role="tabpanel" aria-labelledby={`design-tab-${tab}`}>
                {tab === 'templates' ? <TemplatesPanel cv={cv} edit={edit} /> : <StylePanel cv={cv} edit={edit} />}
            </div>
        </div>
    )
}
