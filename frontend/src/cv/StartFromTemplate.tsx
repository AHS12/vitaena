/**
 * Home's ways to start, grouped by type: a blank document, or one in a template. Each
 * template shows the type's example laid out in it; picking one starts a new, empty
 * document in it, whose page offers the example.
 */

import {Plus} from 'lucide-react'
import {useMemo, type ReactNode} from 'react'
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
    const cvExample = useMemo(() => renderModel(sampleCv()), [])
    const biodataExample = useMemo(() => biodataRenderModel(sampleBiodata()), [])
    const cvPreviews = useTemplatePreviews(cvExample, CV_TEMPLATE_IDS, 0)
    const biodataPreviews = useTemplatePreviews(biodataExample, BIODATA_TEMPLATE_IDS, 0)

    return (
        <section className="home__section" aria-label="Start something new" data-coach="home-templates">
            <div className="home__section-head">
                <h2 className="home__section-title">Start something new</h2>
            </div>
            <section className="start-group" aria-label="CVs and resumes">
                <h3 className="start-group__title">CVs and resumes</h3>
                <ul className="start-templates">
                    <BlankCard noun="CV" facts="Classic, ready to fill in" onStart={() => startNew('Start a new CV', emptyCv(), cvType.kind)} />
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
                            onStart={() => startNew(`Start a new CV in ${template.name}`, {...emptyCv(), design: {...DEFAULT_DESIGN, template: template.id}}, cvType.kind)}
                        />
                    ))}
                </ul>
            </section>
            <section className="start-group" aria-label="Biodata">
                <h3 className="start-group__title">Biodata</h3>
                <ul className="start-templates">
                    <BlankCard noun="biodata" facts="Clean, ready to fill in" onStart={() => startNew('Start a new biodata', emptyBiodata(), biodataType.kind)} />
                    {BIODATA_TEMPLATES.map((template) => (
                        <StartCard
                            key={template.id}
                            name={template.name}
                            facts={template.facts}
                            picture={<TemplatePicture src={biodataPreviews[template.id]} />}
                            onStart={() => startNew(`Start a new biodata in ${template.name}`, {...emptyBiodata(), design: {...DEFAULT_BIODATA_DESIGN, template: template.id}}, biodataType.kind)}
                        />
                    ))}
                </ul>
            </section>
        </section>
    )
}
