/** What a CV can be exported as. */

import {FileCheck2, FileCode2, FileText, FileType2, TextQuote} from 'lucide-react'
import {serializeDocument} from '../core/document/document-file'
import type {ExportFormat} from '../features/export/formats'
import {cvType, type Cv} from './cv'
import {CV_TEMPLATES} from './templates/templates'
import {renderModel, type RenderModel} from './render-model'
import {plainOf} from './rich'

/** The CV as plain text, in reading order: about what an ATS keeps of it. */
export function plainText(model: RenderModel): string {
    const lines: string[] = []

    if (model.name) {
        lines.push(model.name)
    }

    if (model.headline) {
        lines.push(model.headline)
    }

    if (model.contact.length > 0) {
        lines.push(model.contact.map((item) => item.text).join(' | '))
    }

    for (const section of model.sections) {
        lines.push('', section.title.toUpperCase())

        if (section.kind === 'text') {
            lines.push(...section.paragraphs.map(plainOf))
        } else if (section.kind === 'entries') {
            for (const entry of section.entries) {
                lines.push('', [entry.title, entry.org].filter(Boolean).join(', '))

                const meta = [entry.location, entry.dates].filter(Boolean).join(' | ')

                if (meta) {
                    lines.push(meta)
                }

                if (entry.summary.length > 0) {
                    lines.push(plainOf(entry.summary))
                }

                lines.push(...entry.bullets.map((bullet) => `• ${plainOf(bullet)}`))
            }
        } else if (section.kind === 'details') {
            lines.push(...section.rows.map((row) => (row.label ? `${row.label}: ${row.value}` : row.value)))
        } else {
            lines.push(...section.groups.map((group) => (group.label ? `${group.label}: ${group.items}` : group.items)))
        }
    }

    return `${lines.join('\n')}\n`
}

export const CV_FORMATS: readonly ExportFormat<Cv>[] = [
    {
        id: 'pdf',
        label: 'PDF',
        extension: 'pdf',
        mimeType: 'application/pdf',
        icon: FileText,
        help: 'What to send. It looks the same everywhere and reads well in applicant tracking systems.',
        make: async (cv) => {
            // Loaded here, so nothing that only lists formats pulls in the compiler.
            const {pdf} = await import('./typst/engine')

            return pdf(renderModel(cv), cv.design.template)
        },
    },
    {
        id: 'pdf-ats',
        label: 'PDF for online forms',
        extension: 'pdf',
        suffix: ' (ATS)',
        mimeType: 'application/pdf',
        icon: FileCheck2,
        help: 'The same CV in one column, which every screening system reads in order. Your design stays as it is.',
        available: (cv) => !cv.design.atsMode && CV_TEMPLATES.some((template) => template.id === cv.design.template && template.twoColumns),
        make: async (cv) => {
            const {pdf} = await import('./typst/engine')

            return pdf(renderModel({...cv, design: {...cv.design, atsMode: true}}), cv.design.template)
        },
    },
    {
        id: 'docx',
        label: 'Word',
        extension: 'docx',
        icon: FileType2,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        help: 'For job portals that ask for a Word file. Always one column, with real headings and bullets.',
        make: async (cv) => (await import('./docx-export')).cvDocx(renderModel(cv)),
    },
    {
        id: 'text',
        label: 'Plain text',
        extension: 'txt',
        mimeType: 'text/plain',
        icon: TextQuote,
        help: 'Just the words, for pasting into application forms.',
        make: (cv) => plainText(renderModel(cv)),
    },
    {
        id: 'vitaena',
        label: 'Vitaena file',
        extension: 'json',
        mimeType: 'application/json',
        icon: FileCode2,
        help: 'A backup of this CV, to open again in Vitaena on any computer.',
        make: (cv, name) => serializeDocument({name, content: cv, extras: {}}, cvType),
    },
]
