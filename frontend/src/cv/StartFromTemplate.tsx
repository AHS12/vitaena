/**
 * Home's ways to start: a blank CV, or one in a template. Each template shows the example
 * CV laid out in it; picking one starts a new, empty CV in it, whose page offers the example.
 */

import {Plus} from 'lucide-react'
import {useMemo} from 'react'
import {guardUnsaved} from '../shell/commands'
import {useDocumentStore} from '../store/document-store'
import {DEFAULT_DESIGN, emptyCv} from './cv'
import {useTemplatePreviews} from './editor/use-template-previews'
import {sampleCv} from './sample'
import {CV_TEMPLATES} from './templates/templates'

export function StartFromTemplate() {
    const example = useMemo(() => sampleCv(), [])
    const previews = useTemplatePreviews(example)

    const start = (template: string, name: string) =>
        guardUnsaved(useDocumentStore.getState(), `Start a new CV in ${name}`, () => useDocumentStore.getState().startNew({...emptyCv(), design: {...DEFAULT_DESIGN, template}}))

    return (
        <section className="home__section" aria-label="Start something new" data-coach="home-templates">
            <div className="home__section-head">
                <h2 className="home__section-title">Start something new</h2>
            </div>
            <ul className="start-templates">
                <li>
                    <button type="button" className="start-template start-template--blank" onClick={() => guardUnsaved(useDocumentStore.getState(), 'Start a new CV', () => useDocumentStore.getState().startNew())}>
                        <span className="start-template__picture" aria-hidden="true">
                            <Plus size={28} />
                        </span>
                        <span className="start-template__name">Blank</span>
                        <span className="start-template__facts">Classic, ready to fill in</span>
                    </button>
                </li>
                {CV_TEMPLATES.map((template) => (
                    <li key={template.id}>
                        <button type="button" className="start-template" onClick={() => start(template.id, template.name)}>
                            <span className="start-template__picture" aria-hidden="true">
                                {previews[template.id] ? <img src={previews[template.id]} alt="" draggable={false} /> : null}
                            </span>
                            <span className="start-template__name">{template.name}</span>
                            <span className="start-template__facts">{template.facts}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}
