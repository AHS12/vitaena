/**
 * The CV editor: what the CV says on the left (and the Check), the pages in the middle,
 * and how it looks on the right. Each side pane resizes by dragging its divider and
 * folds away by double-clicking it.
 */

import './cv-editor.css'
import {useMemo} from 'react'
import {SplitPane} from '../components/SplitPane'
import {APP} from '../core/app'
import {useDocumentStore} from '../store/document-store'
import type {Cv} from './cv'
import {useHistoryKeys} from './history-keys'
import {PagePreview} from './PagePreview'
import {renderModel} from './render-model'
import {sampleCv} from './sample'
import {CV_TEMPLATES} from './templates/templates'
import {CvSidebar, DesignSidebar} from './editor/CvSidebar'
import {useCvEdit} from './use-cv-edit'

export function CvEditor() {
    // The app shows this editor only while a CV is in hand.
    const cv = useDocumentStore((state) => state.content) as Cv
    const edit = useCvEdit()
    const model = useMemo(() => renderModel(cv), [cv])
    const blank = !model.name && !model.headline && model.contact.length === 0 && model.sections.length === 0
    const ats = {
        available: CV_TEMPLATES.find((template) => template.id === cv.design.template)?.twoColumns === true,
        on: cv.design.atsMode,
        set: (on: boolean) => edit.act(on ? 'ATS mode on' : 'ATS mode off', (current) => ({...current, design: {...current.design, atsMode: on}})),
    }

    const onKeyDown = useHistoryKeys(edit)

    return (
        <main className="cv-editor" onKeyDown={onKeyDown}>
            <SplitPane storageKey={`${APP.id}.editor.layout`} label="Editor" defaultWidth={440} minWidth={340} side={() => <CvSidebar cv={cv} edit={edit} onAtsMode={() => ats.set(true)} />}>
                {(left) => (
                    <SplitPane
                        storageKey={`${APP.id}.design.layout`}
                        label="Design"
                        position="end"
                        defaultWidth={360}
                        minWidth={300}
                        maxShare={0.5}
                        // On a small screen the pages need the room more than the design does.
                        defaultCollapsed={window.innerWidth < 1200}
                        side={() => <DesignSidebar cv={cv} edit={edit} />}
                    >
                        {(right) => (
                            <PagePreview
                                left={left}
                                right={right}
                                model={model}
                                template={cv.design.template}
                                paper={cv.design.paper}
                                ats={ats}
                                empty={
                                    blank
                                        ? {
                                              title: 'Your CV appears here as you type',
                                              text: 'Start with your name on the left, or look at a finished one first.',
                                              onExample: () => edit.act('example', (current) => ({...sampleCv(), design: current.design})),
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
