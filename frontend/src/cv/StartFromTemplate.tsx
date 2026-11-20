/**
 * Home's ways to start, a tab for each type: a blank document, or one in a template. Each
 * template shows the type's example laid out in it; picking one starts a new, empty
 * document in it, whose page offers the example. The tab last picked is remembered, and
 * so is the language a new document is written in.
 */

import './cv-editor.css'
import {Plus} from 'lucide-react'
import {useMemo, useState, type KeyboardEvent, type ReactNode} from 'react'
import {APP} from '../core/app'
import {isLanguage, languageChoice, LANGUAGES, type DocumentLanguage} from '../core/labels/labels'
import {Select} from '../components/controls'
import {biodataType, DEFAULT_BIODATA_DESIGN, emptyBiodata} from '../biodata/biodata'
import {biodataRenderModel} from '../biodata/render-model'
import {sampleBiodata} from '../biodata/sample'
import {BIODATA_TEMPLATES} from '../biodata/templates/templates'
import {guardUnsaved} from '../shell/commands'
import {useDocumentStore, type Content} from '../store/document-store'
import {cvType, DEFAULT_DESIGN, emptyCv} from './cv'
import {TemplatePicture} from './editor/TemplatePicture'
import {useTemplatePreviews} from './editor/use-template-previews'
import {renderModel} from './render-model'
import {sampleCv} from './sample'
import {CV_TEMPLATES, TEMPLATE_USE_LABELS} from './templates/templates'

const CV_TEMPLATE_IDS = CV_TEMPLATES.map((template) => template.id)
const BIODATA_TEMPLATE_IDS = BIODATA_TEMPLATES.map((template) => template.id)

type StartTab = 'cv' | 'biodata'

const TABS: readonly {readonly id: StartTab; readonly label: string}[] = [
    {id: 'cv', label: 'CVs and resumes'},
    {id: 'biodata', label: 'Biodata'},
]

const TAB_KEY = `${APP.id}.home.start`

/** The tab last picked. Only a convenience: without storage, Home opens on the first. */
function storedTab(): StartTab {
    try {
        return window.localStorage.getItem(TAB_KEY) === 'biodata' ? 'biodata' : 'cv'
    } catch {
        return 'cv'
    }
}

function rememberTab(tab: StartTab): void {
    try {
        window.localStorage.setItem(TAB_KEY, tab)
    } catch {
        // The tab simply isn't remembered.
    }
}

const LANGUAGE_KEY = `${APP.id}.home.language`

/** The language last picked for a new document, or English. */
function storedLanguage(): DocumentLanguage {
    try {
        const stored = window.localStorage.getItem(LANGUAGE_KEY) ?? ''

        return isLanguage(stored) ? stored : 'en'
    } catch {
        return 'en'
    }
}

function rememberLanguage(language: DocumentLanguage): void {
    try {
        window.localStorage.setItem(LANGUAGE_KEY, language)
    } catch {
        // The language simply isn't remembered.
    }
}

const startNew = (what: string, content: Content, kind: string) => guardUnsaved(useDocumentStore.getState(), what, () => useDocumentStore.getState().startNew(content, kind))

function StartCard({name, facts, picture, badge, onStart}: {name: string; facts: string; picture: ReactNode; badge?: ReactNode; onStart(): void}) {
    return (
        <li>
            <button type="button" className="start-template" onClick={onStart}>
                <span className="start-template__picture" aria-hidden="true">
                    {picture}
                </span>
                <span className="start-template__name">
                    {name}
                    {badge}
                </span>
                <span className="start-template__facts">{facts}</span>
            </button>
        </li>
    )
}

function BlankCard({noun, facts, onStart}: {noun: string; facts: string; onStart(): void}) {
    return (
        <li>
            <button type="button" className="start-template start-template--blank" aria-label={`Blank ${noun}`} onClick={onStart}>
                <span className="start-template__picture" aria-hidden="true">
                    <Plus size={28} />
                </span>
                <span className="start-template__name">Blank</span>
                <span className="start-template__facts">{facts}</span>
            </button>
        </li>
    )
}

export function StartFromTemplate() {
    const [tab, setTab] = useState<StartTab>(storedTab)
    const [language, setLanguage] = useState<DocumentLanguage>(storedLanguage)
    const cvExample = useMemo(() => renderModel(sampleCv(language)), [language])
    const biodataExample = useMemo(() => biodataRenderModel(sampleBiodata(language)), [language])
    const cvPreviews = useTemplatePreviews(cvExample, CV_TEMPLATE_IDS, 0)
    const biodataPreviews = useTemplatePreviews(biodataExample, BIODATA_TEMPLATE_IDS, 0)

    const pick = (next: StartTab) => {
        setTab(next)
        rememberTab(next)
    }

    // Arrows move between tabs, as in any tab list.
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return
        }

        event.preventDefault()

        const next = TABS[(TABS.findIndex((item) => item.id === tab) + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length].id

        pick(next)
        document.getElementById(`start-tab-${next}`)?.focus()
    }

    return (
        <section className="home__section" aria-label="Start something new" data-coach="home-templates">
            <div className="home__section-head">
                <h2 className="home__section-title">Start something new</h2>
                <div className="home__language">
                    <span className="home__language-label">Write in</span>
                    <Select<DocumentLanguage>
                        label="Write a new document in"
                        value={language}
                        options={LANGUAGES.map(languageChoice)}
                        onChange={(next) => {
                            setLanguage(next)
                            rememberLanguage(next)
                        }}
                    />
                </div>
            </div>
            <div className="cv-tabs start-tabs" role="tablist" aria-label="What to make" onKeyDown={onKeyDown}>
                {TABS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        id={`start-tab-${item.id}`}
                        aria-selected={tab === item.id}
                        aria-controls="start-tab-panel"
                        tabIndex={tab === item.id ? 0 : -1}
                        className="cv-tabs__tab"
                        onClick={() => pick(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div id="start-tab-panel" role="tabpanel" aria-labelledby={`start-tab-${tab}`} className="start-panel">
                {tab === 'cv' ? (
                    <ul className="start-templates">
                        <BlankCard noun="CV" facts="Classic, ready to fill in" onStart={() => startNew('Start a new CV', emptyCv(language), cvType.kind)} />
                        {CV_TEMPLATES.map((template) => (
                            <StartCard
                                key={template.id}
                                name={template.name}
                                facts={template.facts}
                                picture={<TemplatePicture src={cvPreviews[template.id]} />}
                                badge={
                                    <span className="template-use" data-use={template.use}>
                                        {TEMPLATE_USE_LABELS[template.use]}
                                    </span>
                                }
                                onStart={() => startNew(`Start a new CV in ${template.name}`, {...emptyCv(language), design: {...DEFAULT_DESIGN, language, template: template.id}}, cvType.kind)}
                            />
                        ))}
                    </ul>
                ) : (
                    <>
                        <p className="start-panel__note">A biodata for a marriage proposal: your details, your family and your photos, on one or two pages to share.</p>
                        <ul className="start-templates">
                            <BlankCard noun="biodata" facts="Clean, ready to fill in" onStart={() => startNew('Start a new biodata', emptyBiodata(language), biodataType.kind)} />
                            {BIODATA_TEMPLATES.map((template) => (
                                <StartCard
                                    key={template.id}
                                    name={template.name}
                                    facts={template.facts}
                                    picture={<TemplatePicture src={biodataPreviews[template.id]} />}
                                    onStart={() =>
                                        startNew(`Start a new biodata in ${template.name}`, {...emptyBiodata(language), design: {...DEFAULT_BIODATA_DESIGN, language, template: template.id, border: template.border}}, biodataType.kind)
                                    }
                                />
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </section>
    )
}
