/**
 * The CV editor: what the CV says on the left (and the Check), the pages in the middle,
 * and how it looks on the right. Each side pane resizes by dragging its divider and
 * folds away by double-clicking it.
 */

import './cv-editor.css'
import type {KeyboardEvent} from 'react'
import {SplitPane} from '../components/SplitPane'
import {APP} from '../core/app'
import {useDocumentStore} from '../store/document-store'
import {CvPreview} from './CvPreview'
import {CvSidebar, DesignSidebar} from './editor/CvSidebar'
import {useCvEdit} from './use-cv-edit'

export function CvEditor() {
    const cv = useDocumentStore((state) => state.content)
    const edit = useCvEdit()

    // The document's history, not a field's own, which knows nothing of saving or of
    // changes made elsewhere. Finishing the step first means Undo takes back the typing.
    const onKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase()

        if (!(event.ctrlKey || event.metaKey) || (key !== 'z' && key !== 'y')) {
            return
        }

        event.preventDefault()
        edit.commit()

        const store = useDocumentStore.getState()

        if (key === 'y' || event.shiftKey) {
            store.redo()
        } else {
            store.undo()
        }
    }

    return (
        <main className="cv-editor" onKeyDown={onKeyDown}>
            <SplitPane storageKey={`${APP.id}.editor.layout`} label="Editor" defaultWidth={440} minWidth={340} side={() => <CvSidebar cv={cv} edit={edit} />}>
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
                        {(right) => <CvPreview left={left} right={right} onExample={(example) => edit.act('example', (current) => ({...example, design: current.design}))} />}
                    </SplitPane>
                )}
            </SplitPane>
        </main>
    )
}
