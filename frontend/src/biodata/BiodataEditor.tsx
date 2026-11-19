/**
 * The biodata editor: what it says on the left, the pages in the middle and how it looks
 * on the right, as for a CV. It shares the CV editor's parts for sections, and adds the
 * heading line, a second photo and the family.
 */

import '../cv/cv-editor.css'
import {ChevronRight} from 'lucide-react'
import {useMemo, type ReactNode} from 'react'
import {TextField} from '../components/fields'
import {Switch} from '../components/controls'
import {PhotoField} from '../components/PhotoField'
import {SplitPane} from '../components/SplitPane'
import {APP} from '../core/app'
import {useDocumentStore} from '../store/document-store'
import {LANGUAGES, languageInfo} from '../core/labels/labels'
import {Segmented} from '../components/Segmented'
import {SecondLabelsProvider, type SecondLabels} from '../cv/editor/second-labels-context'
import {setSecondLabel, withSecondLanguage} from './edit-ops'
import {Group, StyleGroups, TemplateGallery, type SharedStyle} from '../cv/editor/DesignPanel'
import {scriptsIn} from '../cv/fonts'
import {inLanguage} from '../cv/relabel'
import {silhouettePhoto} from '../cv/editor/silhouette'
import {toggled} from '../cv/editor/edit-ops'
import {useEditorStore} from '../cv/editor/editor-store'
import {SectionList} from '../cv/editor/SectionList'
import {ShowParts} from '../cv/editor/ShowParts'
import {useTemplatePreviews} from '../cv/editor/use-template-previews'
import {useHistoryKeys} from '../cv/history-keys'
import {PagePreview} from '../cv/PagePreview'
import type {Sectioned} from '../cv/sections'
import {useDocumentEdit, type DocumentEdit} from '../cv/use-cv-edit'
import type {Biodata} from './biodata'
import {BiodataCheck} from './BiodataCheck'
import {biodataSectionChoices, updateHeading, updatePerson} from './edit-ops'
import {biodataRenderModel, isBlank} from './render-model'
import {NotSortedNote} from '../cv/import/NotSortedNote'
import {sampleBiodata} from './sample'
import {BIODATA_TEMPLATES} from './templates/templates'

type Edit = DocumentEdit<Biodata>

const BIODATA_TEMPLATE_IDS = BIODATA_TEMPLATES.map((template) => template.id)

const PICTURE_PARTS = [
    {id: 'photo', label: 'Photo'},
    {id: 'fullPhoto', label: 'Full-length photo'},
] as const

/** A panel that folds, like a section's, for the parts every biodata has. */
function FixedPanel({id, title, children}: {id: string; title: string; children: ReactNode}) {
    const closed = useEditorStore((state) => state.closedSections.has(id))
    const toggle = useEditorStore((state) => state.toggleSection)

    return (
        <section className="panel" data-open={!closed || undefined} aria-label={title}>
            <header className="panel__head">
                <button type="button" className="icon-button panel__toggle" aria-expanded={!closed} aria-label={closed ? `Open ${title}` : `Fold ${title}`} onClick={() => toggle(id)}>
                    <ChevronRight size={14} className="disclosure-chevron" aria-hidden="true" />
                </button>
                <span className="panel__title panel__title--fixed">{title}</span>
            </header>
            {closed ? null : <div className="panel__body">{children}</div>}
        </section>
    )
}

function ContentPanel({biodata, edit}: {biodata: Biodata; edit: Edit}) {
    const {heading, person} = biodata
    const labels = biodata.second.labels
    // While second labels are on, every heading, label and relation has a field for one.
    const second = useMemo<SecondLabels | null>(
        () =>
            biodata.second.language
                ? {
                      language: languageInfo(biodata.second.language).name,
                      get: (id) => labels[id] ?? '',
                      type: (id, text) => edit.type((current) => setSecondLabel(current, id, text)),
                      commit: edit.commit,
                  }
                : null,
        [biodata.second.language, labels, edit],
    )

    return (
        <>
            <NotSortedNote doc={biodata} />
            <FixedPanel id="heading" title="Heading">
                <div onBlur={edit.commit}>
                    <TextField
                        label="Line above your name"
                        value={heading.text}
                        placeholder="Optional"
                        hint="Many biodata open with a line of their own. Write yours, or leave it empty."
                        onChange={(text) => edit.type((current) => updateHeading(current, {text}))}
                    />
                </div>
                <PhotoField
                    label="Picture above that line"
                    noun="picture"
                    value={heading.image}
                    shape={{kind: 'whole', longest: 300, format: 'png'}}
                    hint="Optional. A small picture you choose, such as a symbol, drawn centred at the top."
                    onChange={(image) => edit.act(image ? 'heading picture' : 'remove heading picture', (current) => updateHeading(current, {image}))}
                />
            </FixedPanel>
            <FixedPanel id="person" title="You">
                <div onBlur={edit.commit}>
                    <TextField label="Full name" value={person.name} placeholder="Jane Doe" autoComplete="name" onChange={(name) => edit.type((current) => updatePerson(current, {name}))} />
                </div>
                <PhotoField label="Photo" value={person.photo} hint="Every template shows it, near the top." onChange={(photo) => edit.act(photo ? 'photo' : 'remove photo', (current) => updatePerson(current, {photo}))} />
                <PhotoField
                    label="Full-length photo"
                    value={person.fullPhoto}
                    shape={{kind: 'whole', longest: 900, format: 'jpeg'}}
                    hint="Optional. Kept in its own shape. Portrait shows it under the main photo."
                    onChange={(fullPhoto) => edit.act(fullPhoto ? 'full-length photo' : 'remove full-length photo', (current) => updatePerson(current, {fullPhoto}))}
                />
                <ShowParts parts={PICTURE_PARTS} hidden={person.hide} onToggle={(part) => edit.act('show part', (current) => updatePerson(current, {hide: toggled(current.person.hide, part)}))} />
            </FixedPanel>
            <SecondLabelsProvider value={second}>
                <SectionList doc={biodata} edit={edit as unknown as DocumentEdit<Sectioned>} choices={biodataSectionChoices(biodata.design.language)} />
            </SecondLabelsProvider>
        </>
    )
}

const EDIT_TABS = {content: 'Content', check: 'Check'} as const

/** The left pane: what the biodata says, and the Check. */
function EditSidebar({biodata, edit}: {biodata: Biodata; edit: Edit}) {
    const tab = useEditorStore((state) => state.tab)
    const setTab = useEditorStore((state) => state.setTab)

    return (
        <div className="cv-side">
            <div className="cv-tabs" role="tablist" aria-label="Edit" data-coach="editor-tabs">
                {(['content', 'check'] as const).map((id) => (
                    <button key={id} type="button" role="tab" id={`cv-tab-${id}`} aria-selected={tab === id} aria-controls="cv-tab-panel" className="cv-tabs__tab" onClick={() => setTab(id)}>
                        {EDIT_TABS[id]}
                    </button>
                ))}
            </div>
            <div className="cv-sidebar" id="cv-tab-panel" role="tabpanel" aria-labelledby={`cv-tab-${tab}`} data-coach="editor">
                {tab === 'content' ? <ContentPanel biodata={biodata} edit={edit} /> : <BiodataCheck biodata={biodata} />}
            </div>
        </div>
    )
}

const DESIGN_TABS = {templates: 'Templates', style: 'Style'} as const

function DesignSidebar({biodata, edit}: {biodata: Biodata; edit: Edit}) {
    const tab = useEditorStore((state) => state.designTab)
    const setTab = useEditorStore((state) => state.setDesignTab)
    const set = <K extends keyof Biodata['design']>(key: K, value: Biodata['design'][K], label: string) => edit.act(label, (current) => ({...current, design: {...current.design, [key]: value}}))
    // Until it has sections with something in them, the example stands in, in this
    // biodata's style, as the CV's gallery does.
    const model = useMemo(() => biodataRenderModel(biodata), [biodata])
    const blank = model.sections.length === 0
    const shown = useMemo(() => {
        if (!blank) {
            return model
        }

        const example = sampleBiodata(biodata.design.language)

        return biodataRenderModel({...example, person: {...example.person, name: model.name || example.person.name, photo: biodata.person.photo || silhouettePhoto()}, design: biodata.design})
    }, [blank, biodata, model])
    const previews = useTemplatePreviews(shown, BIODATA_TEMPLATE_IDS, 900)
    const hasBangla = useMemo(() => scriptsIn(JSON.stringify([biodata.heading, biodata.person.name, biodata.sections])).includes('bengali'), [biodata.heading, biodata.person.name, biodata.sections])

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
                {tab === 'templates' ? (
                    <TemplateGallery
                        templates={BIODATA_TEMPLATES}
                        previews={previews}
                        value={biodata.design.template}
                        tip={blank ? 'Shown with example content until your biodata has some of its own.' : null}
                        onPick={(id) => set('template', id, 'template')}
                    />
                ) : (
                    <StyleGroups
                        design={biodata.design}
                        set={set as <K extends keyof SharedStyle>(key: K, value: SharedStyle[K], label: string) => void}
                        onLanguage={(language) => edit.act(`write in ${languageInfo(language).name}`, (current) => inLanguage(current, language))}
                        hasBangla={hasBangla}
                    >
                        <Group title="Two languages">
                            <div className="design-row">
                                <span className="design-row__label">Second labels</span>
                                <Segmented
                                    label="Second labels"
                                    value={biodata.second.language}
                                    options={[{value: '' as const, label: 'Off'}, ...LANGUAGES.filter((info) => info.id !== biodata.design.language).map((info) => ({value: info.id, label: info.own}))]}
                                    onChange={(language) => edit.act(language ? `second labels in ${languageInfo(language).name}` : 'second labels off', (current) => withSecondLanguage(current, language))}
                                />
                            </div>
                            <p className="design-panel__tip">Each heading, label and relation written again under the first, smaller, as many printed biodata have. Vitaena fills in the ones it wrote; you write the rest in Content.</p>
                        </Group>
                        <Group title="Border">
                            <div className="design-row">
                                <Switch label="Border around each page" value={biodata.design.border} onChange={(border) => set('border', border, border ? 'border on' : 'border off')} />
                                <span className="design-row__label">Border around each page</span>
                            </div>
                        </Group>
                    </StyleGroups>
                )}
            </div>
        </div>
    )
}

export function BiodataEditor() {
    // The app shows this editor only while a biodata is in hand.
    const biodata = useDocumentStore((state) => state.content) as Biodata
    const edit = useDocumentEdit<Biodata>()
    const model = useMemo(() => biodataRenderModel(biodata), [biodata])
    const onKeyDown = useHistoryKeys(edit)

    return (
        <main className="cv-editor" onKeyDown={onKeyDown}>
            <SplitPane
                storageKey={`${APP.id}.editor.layout`}
                label="Editor"
                defaultWidth={440}
                minWidth={340}
                side={() => <EditSidebar biodata={biodata} edit={edit} />}
            >
                {(left) => (
                    <SplitPane
                        storageKey={`${APP.id}.design.layout`}
                        label="Design"
                        position="end"
                        defaultWidth={360}
                        minWidth={300}
                        maxShare={0.5}
                        defaultCollapsed={window.innerWidth < 1200}
                        side={() => <DesignSidebar biodata={biodata} edit={edit} />}
                    >
                        {(right) => (
                            <PagePreview
                                left={left}
                                right={right}
                                model={model}
                                template={biodata.design.template}
                                paper={biodata.design.paper}
                                empty={
                                    isBlank(model)
                                        ? {
                                              title: 'Your biodata appears here as you type',
                                              text: 'Start with your name on the left, or look at a finished one first.',
                                              onExample: () => edit.act('example', (current) => ({...sampleBiodata(current.design.language), design: current.design})),
                                          }
                                        : null
                                }
                            />
                        )}
                    </SplitPane>
                )}
            </SplitPane>
        </main>
    )
}
