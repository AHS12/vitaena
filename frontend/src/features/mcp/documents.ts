/**
 * Documents as the tools see them: loaded from the library, or the one open in the
 * editor, which may have changes not saved yet; and what each kind of document needs
 * to be read, drawn and checked.
 */

import {checkCv, type CheckResult} from '../../cv/ats-check'
import {cvType, type Cv} from '../../cv/cv'
import {plainText, sectionLines} from '../../cv/cv-export'
import {renderModel} from '../../cv/render-model'
import {CV_TEMPLATES, TEMPLATE_USE_LABELS} from '../../cv/templates/templates'
import type {PageModel} from '../../cv/typst/images'
import {biodataType, type Biodata} from '../../biodata/biodata'
import {checkBiodata} from '../../biodata/check'
import {biodataRenderModel} from '../../biodata/render-model'
import {BIODATA_TEMPLATES} from '../../biodata/templates/templates'
import {parseAnyDocument, type DocumentType} from '../../core/document/document-file'
import {readDocument} from '../../platform/documents'
import {hasUnsavedChanges, useDocumentStore} from '../../store/document-store'
import {DOCUMENT_TYPES, type Content} from '../../store/document-types'

/** A template, as an assistant is told about it. */
export interface TemplateInfo {
    readonly id: string
    readonly name: string
    readonly about: string
    readonly facts: string
    /** What it suits, for a CV: a resume, an academic CV or either. */
    readonly suits?: string
}

/** What the tools need from each kind of document. */
export interface KindTools<T> {
    readonly type: DocumentType<T>
    readonly templates: readonly TemplateInfo[]
    template(content: T): string
    pageModel(content: T): PageModel
    /** The document as plain text, in reading order. */
    text(content: T): string
    check(content: T, pages: number | null): CheckResult[]
}

const cvTools: KindTools<Cv> = {
    type: cvType,
    templates: CV_TEMPLATES.map((template) => ({id: template.id, name: template.name, about: template.about, facts: template.facts, suits: TEMPLATE_USE_LABELS[template.use]})),
    template: (cv) => cv.design.template,
    pageModel: (cv) => renderModel(cv),
    text: (cv) => plainText(renderModel(cv)),
    check: checkCv,
}

const biodataTools: KindTools<Biodata> = {
    type: biodataType,
    templates: BIODATA_TEMPLATES.map((template) => ({id: template.id, name: template.name, about: template.about, facts: template.facts})),
    template: (biodata) => biodata.design.template,
    pageModel: (biodata) => biodataRenderModel(biodata),
    text: (biodata) => {
        const model = biodataRenderModel(biodata)
        const lines = [model.heading, model.name].filter(Boolean)

        for (const section of model.sections) {
            if (section.kind === 'family') {
                lines.push('', section.title.toUpperCase(), ...section.members.map((member) => [member.relation, member.name, member.work, member.note].filter(Boolean).join(' · ')))
            } else {
                lines.push(...sectionLines(section))
            }
        }

        return `${lines.join('\n')}\n`
    },
    check: checkBiodata,
}

const TOOLS_BY_KIND: Readonly<Record<string, KindTools<Content>>> = {
    [cvType.kind]: cvTools as KindTools<Content>,
    [biodataType.kind]: biodataTools as KindTools<Content>,
}

export function toolsFor(kind: string): KindTools<Content> {
    const tools = TOOLS_BY_KIND[kind]

    if (!tools) {
        throw new Error(`Documents of kind "${kind}" can't be used by assistants.`)
    }

    return tools
}

/** A document as a tool works on it. */
export interface ToolDocument {
    readonly id: string
    readonly name: string
    readonly kind: string
    readonly content: Content
    /** Open in the editor now, where its content may not be saved yet. */
    readonly open: boolean
    readonly unsaved: boolean
}

/** The document with this id: the editor's copy when it's open there, else the saved file. */
export async function loadDocument(id: string): Promise<ToolDocument> {
    const state = useDocumentStore.getState()

    if (id !== '' && state.currentId === id) {
        return {id, name: state.name, kind: state.kind, content: state.content, open: true, unsaved: hasUnsavedChanges(state)}
    }

    let text: string

    try {
        text = await readDocument(id)
    } catch {
        throw new Error(`There's no document with the id "${id}". list_documents gives each one's id.`)
    }

    const loaded = parseAnyDocument(text, DOCUMENT_TYPES)

    return {id, name: loaded.name, kind: loaded.type.kind, content: loaded.content, open: false, unsaved: false}
}

/** Pictures are kept in the file as data URLs; an assistant only needs to know one is there. */
export function withoutPictures(value: unknown): unknown {
    if (typeof value === 'string') {
        return value.startsWith('data:image/') ? '(a picture)' : value
    }

    if (Array.isArray(value)) {
        return value.map(withoutPictures)
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, withoutPictures(inner)]))
    }

    return value
}

/** Lays the document out as the PDF, and reads it back as a screening system would. */
export async function readBack(document: ToolDocument): Promise<{pages: number; text: string}> {
    const tools = toolsFor(document.kind)
    const [{pdf}, {pdfText}] = await Promise.all([import('../../cv/typst/engine'), import('../../cv/pdf-text')])

    return pdfText(await pdf(tools.pageModel(document.content), tools.template(document.content)))
}
