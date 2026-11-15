/** How an import from a PDF is going, and what to do when it can't go on. */

import {Dialog} from '../../components/controls'
import {usePdfImport, type ImportStep} from './import-pdf'

/** What the dialog says at each step, and whether it is still working. */
function wordsFor(step: ImportStep): {text: string; working: boolean} {
    switch (step.kind) {
        case 'reading':
            return {text: step.pages > 0 ? `Reading page ${step.page} of ${step.pages}` : 'Opening the PDF', working: true}
        case 'making':
            return {text: 'Finding your sections and making your CV', working: true}
        case 'no-text':
            return {text: "This PDF has no text to read: its pages are pictures, as a scan's are. Export your CV as a PDF from the app you wrote it in, then import that.", working: false}
        case 'locked':
            return {text: 'This PDF is locked with a password. Save a copy without one, then import that.', working: false}
        case 'failed':
            return {text: `Couldn't read this PDF. ${step.reason}`, working: false}
    }
}

export function ImportPdfDialog() {
    const file = usePdfImport((state) => state.file)
    const step = usePdfImport((state) => state.step)
    const cancel = usePdfImport((state) => state.cancel)
    const close = usePdfImport((state) => state.close)
    const {text, working} = wordsFor(step)

    return (
        <Dialog open={file !== null} onClose={working ? cancel : close} title={`Importing ${file ?? ''}`} closesOnOutsideClick={false}>
            <div className="dialog__form" role="status">
                <p className="dialog__hint">{text}</p>
                {working ? (
                    <progress
                        className="dialog__progress"
                        aria-label="Pages read"
                        // No value while making the CV: that step can't say how far it has got.
                        {...(step.kind === 'reading' && step.pages > 0 ? {max: step.pages, value: step.page} : {})}
                    />
                ) : null}
                <div className="dialog__actions">
                    {working ? (
                        <button type="button" className="button" onClick={cancel}>
                            Cancel
                        </button>
                    ) : (
                        <button type="button" className="button button--primary" onClick={close}>
                            Close
                        </button>
                    )}
                </div>
            </div>
        </Dialog>
    )
}
