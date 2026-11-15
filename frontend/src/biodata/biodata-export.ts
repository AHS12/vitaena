/** What a biodata can be exported as: a PDF, a picture of each page, Word, and the Vitaena file. */

import {FileCode2, FileImage, FileText, FileType2, Image} from 'lucide-react'
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
        id: 'png',
        label: 'Picture (PNG)',
        extension: 'png',
        mimeType: 'image/png',
        icon: FileImage,
        help: 'A picture of each page, to share in a chat. The sharpest choice.',
        make: async (biodata) => (await import('./pictures')).pagePictures(biodataRenderModel(biodata), biodata.design.template, 'png'),
    },
    {
        id: 'jpg',
        label: 'Picture (JPG)',
        extension: 'jpg',
        mimeType: 'image/jpeg',
        icon: Image,
        help: 'A picture of each page, for chats and forms that ask for JPG.',
        make: async (biodata) => (await import('./pictures')).pagePictures(biodataRenderModel(biodata), biodata.design.template, 'jpeg'),
    },
    {
        id: 'docx',
        label: 'Word',
        extension: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        icon: FileType2,
        help: 'To change a word yourself, in Word or a similar app.',
        make: async (biodata) => (await import('./docx-export')).biodataDocx(biodataRenderModel(biodata)),
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
