/**
 * "Add a section": a menu of the sections a type offers. A choice that makes sense once,
 * such as Education, is greyed out while a section by that name is there already.
 */

import {Dropdown} from '@heroui/react'
import {Plus} from 'lucide-react'
import type {Section, Sectioned} from '../sections'
import type {DocumentEdit} from '../use-cv-edit'
import {useEditorStore} from './editor-store'

export interface SectionChoice {
    readonly id: string
    readonly label: string
    make(): Section
    /** Offered only while no section has this label as its heading. */
    readonly once?: boolean
    /** Choices are drawn in groups, with a line between one group and the next. */
    readonly group?: string
}

export function AddSection({choices, doc, edit}: {choices: readonly SectionChoice[]; doc: Sectioned; edit: DocumentEdit<Sectioned>}) {
    const openEntry = useEditorStore((state) => state.openEntry)
    const taken = new Set(doc.sections.map((section) => section.title.trim().toLowerCase()))

    const add = (choice: SectionChoice) => {
        const section = choice.make()

        if (section.kind === 'entries') {
            section.entries.forEach((entry) => openEntry(entry.id))
        }

        edit.act('add section', (current) => ({...current, sections: [...current.sections, section]}))
    }

    return (
        <Dropdown>
            <Dropdown.Trigger className="button add-section">
                <Plus size={13} aria-hidden="true" />
                Add a section
            </Dropdown.Trigger>
            <Dropdown.Popover className="menu-popover" placement="bottom start" offset={4}>
                <Dropdown.Menu
                    className="menu-list"
                    aria-label="Add a section"
                    onAction={(key) => {
                        const choice = choices.find((item) => item.id === String(key))

                        if (choice) {
                            add(choice)
                        }
                    }}
                    disabledKeys={choices.filter((choice) => choice.once && taken.has(choice.label.toLowerCase())).map((choice) => choice.id)}
                >
                    {choices.flatMap((choice, index) => [
                        ...(index > 0 && choice.group !== choices[index - 1].group
                            ? [<Dropdown.Item key={`divider-${choice.id}`} id={`divider-${choice.id}`} isDisabled className="menu-divider" textValue="" aria-hidden="true" />]
                            : []),
                        <Dropdown.Item key={choice.id} id={choice.id} textValue={choice.label} className="menu-item">
                            <span className="menu-item__label">{choice.label}</span>
                        </Dropdown.Item>,
                    ])}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown>
    )
}
