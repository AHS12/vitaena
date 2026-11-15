/** What a CV can be exported as. */

import type {ExportFormat} from '../features/export/formats'
import type {Cv} from './cv'
import {renderModel, type RenderModel} from './render-model'

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
            lines.push(section.text)
        } else if (section.kind === 'entries') {
            for (const entry of section.entries) {
                lines.push('', [entry.title, entry.org].filter(Boolean).join(', '))

                const meta = [entry.location, entry.dates].filter(Boolean).join(' | ')

                if (meta) {
                    lines.push(meta)
                }

                if (entry.summary) {
                    lines.push(entry.summary)
                }

                lines.push(...entry.bullets.map((bullet) => `• ${bullet}`))
            }
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
        help: 'What to send. It looks the same everywhere and reads well in applicant tracking systems.',
        make: async (cv) => {
            // Loaded here, so nothing that only lists formats pulls in the compiler.
            const {pdf} = await import('./typst/engine')

            return pdf(renderModel(cv), cv.design.template)
        },
    },
    {
        id: 'text',
        label: 'Plain text',
        extension: 'txt',
        help: 'Just the words, for pasting into application forms.',
        make: (cv) => plainText(renderModel(cv)),
    },
]
