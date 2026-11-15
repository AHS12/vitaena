/**
 * Export in the title bar: one button, in the accent colour, that opens a menu of the
 * formats the app offers. Each says what it's for; picking one asks where to save it.
 * Export to a folder, for several formats at once, is at the end.
 */

import {Dropdown} from '@heroui/react'
import {ChevronDown, Download, FolderDown} from 'lucide-react'
import {useState} from 'react'
import {chooseFolder, saveExportFile} from '../../platform/desktop'
import {useDocumentStore, type Content} from '../../store/document-store'
import {useUiStore} from '../../store/ui-store'
import {useExportStore} from './export-store'
import {exportFiles, filesAre, type ExportFile, type ExportFormat} from './formats'
import {existingFiles, writeFiles, writesToFolders} from './platform'

const FOLDER = 'folder'

const folderOf = (path: string): string => path.replace(/[\\/][^\\/]*$/, '')

/**
 * Several files from one format, such as a picture of each page: they go into a folder
 * picked for them, and files already there are replaced only when the person says so.
 */
async function saveSeveral(files: readonly ExportFile[], label: string): Promise<void> {
    const {notify} = useDocumentStore.getState()
    const folder = writesToFolders() ? await chooseFolder('', `Export as ${label} to this folder`) : ''

    if (writesToFolders() && !folder) {
        return
    }

    const write = async () => {
        await writeFiles(folder ?? '', files)
        notify(`Exported ${files.length} files`, folder || undefined)
    }
    const there = folder ? await existingFiles(folder, files.map((file) => file.name)) : []

    if (there.length === 0) {
        await write()
        return
    }

    useUiStore.getState().askConfirm({
        title: 'Replace files already there?',
        text: `${filesAre(there.length)} there already: ${there.join(', ')}. Replacing ${there.length === 1 ? 'it' : 'them'} can't be undone.`,
        action: 'Replace',
        danger: true,
        cancel: 'Keep them',
        run: () => void write().catch((error: unknown) => notify(`Couldn't export. ${error instanceof Error ? error.message : String(error)}`)),
    })
}

/** Makes one format of the open document and asks where to save it. */
async function exportAs(format: ExportFormat<Content>): Promise<void> {
    const {name, content, notify} = useDocumentStore.getState()

    try {
        const files = await exportFiles([format], name, content)

        if (files.length > 1) {
            await saveSeveral(files, format.label)
            return
        }

        const [file] = files
        const path = await saveExportFile(file.bytes, file.name, `Export as ${format.label}`, format.mimeType ?? 'application/octet-stream')

        if (path) {
            notify(`Exported ${path.split(/[\\/]/).pop()}`, path.includes('/') || path.includes('\\') ? folderOf(path) : undefined)
        }
    } catch (error) {
        notify(`Couldn't export. ${error instanceof Error ? error.message : String(error)}`)
    }
}

function Choice({icon: Icon, title, help}: {icon: typeof Download; title: string; help?: string}) {
    return (
        <span className="export-choice">
            <span className="export-choice__icon" aria-hidden="true">
                <Icon size={16} />
            </span>
            <span className="export-choice__text">
                <span className="export-choice__title">{title}</span>
                {help ? <span className="export-choice__help">{help}</span> : null}
            </span>
        </span>
    )
}

export function ExportTitleButton() {
    const kind = useDocumentStore((state) => state.kind)
    const all = useExportStore((state) => state.formats[kind])
    const content = useDocumentStore((state) => state.content)
    const formats = (all ?? []).filter((format) => format.available?.(content) ?? true)
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState<string | null>(null)

    if (formats.length === 0) {
        return null
    }

    const run = async (format: ExportFormat<Content>) => {
        setBusy(format.label)
        await exportAs(format)
        setBusy(null)
    }

    return (
        <Dropdown isOpen={open} onOpenChange={setOpen}>
            <Dropdown.Trigger className="button button--primary export-button" data-coach="export" data-open={open} isDisabled={busy !== null}>
                <Download size={14} aria-hidden="true" />
                {busy ? `Exporting ${busy}…` : 'Export'}
                <ChevronDown size={13} aria-hidden="true" className="export-button__chevron" />
            </Dropdown.Trigger>
            <Dropdown.Popover className="menu-popover export-menu" placement="bottom end" offset={6}>
                <Dropdown.Menu
                    className="menu-list"
                    aria-label="Export as"
                    onAction={(key) => {
                        setOpen(false)

                        if (key === FOLDER) {
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
                            <Dropdown.Item key={format.id} id={format.id} textValue={format.label} className="menu-item export-menu__item">
                                <Choice icon={format.icon ?? Download} title={format.label} help={format.help} />
                            </Dropdown.Item>
                        )),
                        <Dropdown.Item key="divider" id="divider" isDisabled className="menu-divider" textValue="" aria-hidden="true" />,
                        <Dropdown.Item key={FOLDER} id={FOLDER} textValue="Export to a folder" className="menu-item export-menu__item">
                            <Choice icon={FolderDown} title="Export to a folder…" help="Several formats at once, into a folder you choose." />
                        </Dropdown.Item>,
                    ]}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
