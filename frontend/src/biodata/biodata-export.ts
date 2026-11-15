/** What a biodata can be exported as. Pictures and Word come next. */

import {FileCode2, FileText} from 'lucide-react'
import {serializeDocument} from '../core/document/document-file'
import type {ExportFormat} from '../features/export/formats'
import {biodataType, type Biodata} from './biodata'
import {biodataRenderModel} from './render-model'

export const BIODATA_FORMATS: readonly ExportFormat<Biodata>[] = [
    {
        id: 'pdf',
        label: 'PDF',
        extension: 'pdf',
        mimeType: 'application/pdf',
        icon: FileText,
        help: 'What to share or print. It looks the same everywhere.',
        make: async (biodata) => {
            // Loaded here, so nothing that only lists formats pulls in the compiler.
            const {pdf} = await import('../cv/typst/engine')

            return pdf(biodataRenderModel(biodata), biodata.design.template)
        },
    },
    {
        id: 'vitaena',
        label: 'Vitaena file',
        extension: 'json',
        mimeType: 'application/json',
        icon: FileCode2,
        help: 'A backup of this biodata, to open again in Vitaena on any computer.',
        make: (biodata, name) => serializeDocument({name, content: biodata, extras: {}}, biodataType),
    },
]
