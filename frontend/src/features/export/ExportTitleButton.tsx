/**
 * Export in the title bar: one click saves the first format (a PDF) where the person
 * picks, and the arrow offers the other formats and the full Export dialog.
 */

import {Dropdown} from '@heroui/react'
import {ChevronDown, Download} from 'lucide-react'
import {useState} from 'react'
import {saveExportFile} from '../../platform/desktop'
import {useDocumentStore} from '../../store/document-store'
import {useExportStore} from './export-store'
import {exportFiles, type ExportFormat} from './formats'
import type {Content} from '../../store/document-store'

const folderOf = (path: string): string => path.replace(/[\\/][^\\/]*$/, '')

/** Makes one format of the open document and asks where to save it. */
async function exportAs(format: ExportFormat<Content>): Promise<void> {
    const {name, content, notify} = useDocumentStore.getState()

    try {
        const [file] = await exportFiles([format], name, content)
        const path = await saveExportFile(file.bytes, file.name, `Export as ${format.label}`, format.mimeType ?? 'application/octet-stream')

        if (path) {
            notify(`Exported ${path.split(/[\\/]/).pop()}`, path.includes('/') || path.includes('\\') ? folderOf(path) : undefined)
        }
    } catch (error) {
        notify(`Couldn't export. ${error instanceof Error ? error.message : String(error)}`)
    }
}

export function ExportTitleButton() {
    const formats = useExportStore((state) => state.formats)
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const first = formats[0]

    if (!first) {
        return null
    }

    const run = async (format: ExportFormat<Content>) => {
        setBusy(true)
        await exportAs(format)
        setBusy(false)
    }

    return (
        <span className="split-button" data-coach="export">
            <button type="button" className="button" disabled={busy} title={`Export as ${first.label}`} onClick={() => void run(first)}>
                <Download size={13} aria-hidden="true" />
                {busy ? 'Exporting…' : `Export ${first.label}`}
            </button>
            <Dropdown isOpen={open} onOpenChange={setOpen}>
                <Dropdown.Trigger className="button split-button__more" aria-label="More ways to export" data-open={open}>
                    <ChevronDown size={13} aria-hidden="true" />
                </Dropdown.Trigger>
                <Dropdown.Popover className="menu-popover" placement="bottom end" offset={4}>
                    <Dropdown.Menu
                        className="menu-list"
                        aria-label="Export"
                        onAction={(key) => {
                            setOpen(false)

                            if (key === 'dialog') {
                                useExportStore.getState().openOne()
                                return
                            }

                            const format = formats.find((item) => item.id === key)

                            if (format) {
                                void run(format)
                            }
                        }}
                    >
                        {[
                            ...formats.map((format) => (
                                <Dropdown.Item key={format.id} id={format.id} textValue={format.label} className="menu-item">
                                    <span className="menu-item__label">{format.label}…</span>
                                </Dropdown.Item>
                            )),
                            <Dropdown.Item key="dialog" id="dialog" textValue="More options" className="menu-item">
                                <span className="menu-item__label">More options…</span>
                            </Dropdown.Item>,
                        ]}
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>
        </span>
    )
}
