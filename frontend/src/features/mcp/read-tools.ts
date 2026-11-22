/**
 * The tools that only read: they list, read, check and draw documents, and change
 * nothing.
 */

import {z} from 'zod'
import {addedFamilies, useAddedFonts} from '../../cv/added-fonts'
import {countryOf} from '../../cv/countries'
import type {Cv} from '../../cv/cv'
import type {Section} from '../../cv/sections'
import {listDocuments} from '../../platform/documents'
import {useDocumentStore} from '../../store/document-store'
import {DOCUMENT_TYPES, nounOfKind} from '../../store/document-types'
import {loadDocument, readBack, toolsFor, withoutPictures, type ToolDocument} from './documents'
import {defineTool} from './tool'

export const KINDS = DOCUMENT_TYPES.map((type) => type.kind) as [string, ...string[]]

const kindsInWords = DOCUMENT_TYPES.map((type) => `"${type.kind}" (${type.noun})`).join(', ')

const idInput = z.string().min(1).describe('The document\'s id, from list_documents.')

/** "Jane Doe (CV), open in the editor with unsaved changes" */
function described(document: ToolDocument): string {
    const where = document.open ? (document.unsaved ? ', open in the editor with unsaved changes' : ', open in the editor') : ''

    return `${document.name} (${nounOfKind(document.kind) ?? document.kind})${where}`
}

const SHORT_TEXT = 200

const shortened = (text: string): string => (text.length > SHORT_TEXT ? `${text.slice(0, SHORT_TEXT)}…` : text)

/** A section with the ids an edit needs, and the longest parts shortened. */
function outlineOf(section: Section): Record<string, unknown> {
    const base = {id: section.id, kind: section.kind, title: section.title, visible: section.visible}

    switch (section.kind) {
        case 'text':
            return {...base, text: shortened(section.text)}
        case 'entries':
            return {
                ...base,
                entries: section.entries.map((entry) => ({id: entry.id, title: entry.title, org: entry.org, start: entry.start, end: entry.end, current: entry.current, bullets: entry.bullets.length, visible: entry.visible})),
            }
        case 'tags':
            return {...base, groups: section.groups.map((group) => ({id: group.id, label: group.label, items: group.items}))}
        case 'details':
            return {
                ...base,
                rows: section.rows.map((row) => ({id: row.id, label: row.label, value: row.kind === 'text' ? row.value : row.kind === 'date' ? row.date : row.cm > 0 ? `${row.cm} cm` : ''})),
            }
        case 'family':
            return {...base, members: section.members.map((member) => ({id: member.id, relation: member.relation, name: member.name}))}
    }
}

export const listDocumentsTool = defineTool({
    name: 'list_documents',
    title: 'List documents',
    description: `Lists the documents saved in the app, newest first: each one's id, name, kind and when it was saved. Use it first, to find the id other tools need. Kinds: ${kindsInWords}.`,
    input: z.object({
        kind: z.enum(KINDS).optional().describe('Only documents of this kind.'),
        search: z.string().optional().describe('Only documents whose name contains this, ignoring case.'),
    }),
    readOnly: true,
    run: async ({kind, search}) => {
        const openId = useDocumentStore.getState().currentId
        const needle = search?.trim().toLowerCase() ?? ''
        const documents = (await listDocuments())
            .filter((document) => document.kind !== null)
            .filter((document) => !kind || document.kind === kind)
            .filter((document) => !needle || document.name.toLowerCase().includes(needle))
            .map((document) => ({id: document.id, name: document.name, kind: document.kind as string, savedAt: document.savedAt, open: document.id === openId}))

        const lines = documents.map((document) => `- ${document.name} (${nounOfKind(document.kind) ?? document.kind}), id ${document.id}, saved ${document.savedAt}${document.open ? ', open in the editor now' : ''}`)
        const text = documents.length === 0 ? 'No documents match.' : `${documents.length === 1 ? 'One document' : `${documents.length} documents`}:\n${lines.join('\n')}`

        return {text, structured: {documents}}
    },
})

export const readDocumentTool = defineTool({
    name: 'read_document',
    title: 'Read a document',
    description:
        'Reads one document: its text in reading order, and its structure with the id of every section, entry, group, row and family member, which edit_document needs. "outline" (the default) shortens long text; "full" gives everything as stored. Pictures show as "(a picture)". If it\'s open in the editor, this is what\'s there now, saved or not.',
    input: z.object({
        id: idInput,
        detail: z.enum(['outline', 'full']).optional().describe('How much of the structure to give. Default: outline.'),
    }),
    readOnly: true,
    run: async ({id, detail}) => {
        const document = await loadDocument(id)
        const tools = toolsFor(document.kind)
        const content = document.content as {sections: readonly Section[]; design: unknown}
        const structure =
            detail === 'full'
                ? withoutPictures(document.content)
                : {...(withoutPictures({...document.content, sections: undefined}) as object), sections: content.sections.map(outlineOf)}
        const text = tools.text(document.content)

        return {
            text: `${described(document)}, id ${id}, template ${tools.template(document.content)}.\n\n${text}\nStructure:\n${JSON.stringify(structure, null, 2)}`,
            structured: {id, name: document.name, kind: document.kind, open: document.open, unsaved: document.unsaved, text, document: structure},
        }
    },
})

export const listTemplatesTool = defineTool({
    name: 'list_templates',
    title: 'List templates',
    description: 'Lists the templates a kind of document can use, with what each looks like and suits, and the fonts the person added, which set_design takes as custom: and the family. set_design and create_document take a template\'s id.',
    input: z.object({
        kind: z.enum(KINDS).describe('The kind of document.'),
    }),
    readOnly: true,
    run: async ({kind}) => {
        const templates = toolsFor(kind).templates
        const lines = templates.map((template) => `- ${template.name} (id ${template.id}): ${template.about} ${template.facts}.${template.suits ? ` Suits: ${template.suits}.` : ''}`)
        await useAddedFonts.getState().load()
        const fonts = addedFamilies(useAddedFonts.getState().fonts).map((family) => ({id: family.id, family: family.family, scripts: family.scripts}))
        const added = fonts.length > 0 ? `\n\nFonts the person added (font for English letters, scriptFont for Bangla):\n${fonts.map((font) => `- ${font.family} (id ${font.id}), letters for ${font.scripts.join(', ') || 'no script the app knows'}`).join('\n')}` : ''

        return {text: `Templates for a ${nounOfKind(kind) ?? kind}:\n${lines.join('\n')}${added}`, structured: {templates, fonts}}
    },
})

export const checkDocumentTool = defineTool({
    name: 'check_document',
    title: 'Check a document',
    description:
        'Runs the app\'s Check on a document: warnings and tips in plain words, as the Check tab shows them, and how many pages it runs to. For a CV it also gives the text a screening system reads from its PDF. Use it before and after changing a document.',
    input: z.object({id: idInput}),
    readOnly: true,
    run: async ({id}) => {
        const document = await loadDocument(id)
        const tools = toolsFor(document.kind)
        const read = await readBack(document)
        const results = tools.check(document.content, read.pages)
        const order = {warning: 0, tip: 1, good: 2}
        const sorted = [...results].sort((a, b) => order[a.level] - order[b.level])
        // Advice for the place a CV is for says so, as the Check tab groups it.
        const place = document.kind === 'cv' ? countryOf((document.content as Cv).design.country).name : ''
        const lines = sorted.map((result) => `- ${result.level === 'good' ? 'Good' : result.level === 'tip' ? 'Tip' : 'Warning'}${result.country ? `, for ${place}` : ''}: ${result.title}${result.detail ? `. ${result.detail}` : ''}`)
        const screening = document.kind === 'cv' ? `\n\nWhat a screening system reads from the PDF:\n${read.text}` : ''

        return {
            text: `${described(document)}: ${read.pages === 1 ? 'one page' : `${read.pages} pages`}.\n${lines.join('\n')}${screening}`,
            structured: {pages: read.pages, results: sorted, ...(document.kind === 'cv' ? {pdfText: read.text} : {})},
        }
    },
})

/** Enough to read a page clearly, small enough not to fill an assistant's context. */
const PREVIEW_DPI = 100
const MOST_PAGES = 4

function base64Of(bytes: Uint8Array): string {
    let binary = ''

    for (let start = 0; start < bytes.length; start += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000))
    }

    return btoa(binary)
}

export const previewPagesTool = defineTool({
    name: 'preview_pages',
    title: 'Preview pages',
    description: `Draws a document's pages as pictures, exactly as the PDF will look, so you can see the design. Gives the first ${MOST_PAGES} pages unless you name others.`,
    input: z.object({
        id: idInput,
        pages: z.array(z.number().int().min(1)).optional().describe('Page numbers to draw, from 1.'),
    }),
    readOnly: true,
    run: async ({id, pages}) => {
        const document = await loadDocument(id)
        const tools = toolsFor(document.kind)
        const {pagePictures} = await import('../../biodata/pictures')
        const pictures = await pagePictures(tools.pageModel(document.content), tools.template(document.content), 'jpeg', PREVIEW_DPI)
        const wanted = (pages ?? pictures.map((_, index) => index + 1).slice(0, MOST_PAGES)).filter((page) => page <= pictures.length)

        if (wanted.length === 0) {
            return {text: `${described(document)} has ${pictures.length === 1 ? 'one page' : `${pictures.length} pages`}, so none of those can be drawn.`}
        }

        return {
            text: `${described(document)}: page ${wanted.join(', ')} of ${pictures.length}.`,
            structured: {pages: pictures.length, shown: wanted},
            images: wanted.map((page) => ({data: base64Of(pictures[page - 1]), mimeType: 'image/jpeg'})),
        }
    },
})

export const READ_TOOLS = [listDocumentsTool, readDocumentTool, listTemplatesTool, checkDocumentTool, previewPagesTool]
