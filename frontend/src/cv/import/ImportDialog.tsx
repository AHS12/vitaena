/** How an import is going, and what to do when it can't go on. */

import {Dialog} from '../../components/controls'
import {useCvImport, type ImportStep} from './import-cv'

/** What the dialog says at each step, and whether it is still working. */
function wordsFor(step: ImportStep, file: string): {text: string; working: boolean} {
    const kind = /\.docx?$/i.test(file) ? 'Word file' : 'PDF'

    switch (step.kind) {
        case 'reading':
            return {text: step.pages > 0 ? `Reading page ${step.page} of ${step.pages}` : `Opening the ${kind}`, working: true}
        case 'making':
            return {text: 'Finding your sections and making your CV', working: true}
        case 'no-text':
            return kind === 'PDF'
                ? {text: "This PDF has no text to read: its pages are pictures, as a scan's are. Export your CV as a PDF from the app you wrote it in, then import that.", working: false}
                : {text: 'This Word file has no text to read.', working: false}
        case 'locked':
            return {text: `This ${kind} is locked with a password. Save a copy without one, then import that.`, working: false}
        case 'old-word':
            return {text: 'This is a Word file from before 2007, which only Word reads. Open it in Word and save it as a .docx, or export it as a PDF, then import that.', working: false}
        case 'failed':
            return {text: `Couldn't read this ${kind}. ${step.reason}`, working: false}
    }
}

export function ImportDialog() {
    const file = useCvImport((state) => state.file)
    const step = useCvImport((state) => state.step)
    const cancel = useCvImport((state) => state.cancel)
    const close = useCvImport((state) => state.close)
    const {text, working} = wordsFor(step, file ?? '')

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
