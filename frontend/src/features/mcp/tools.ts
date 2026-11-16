/**
 * The tools an AI assistant can call, in the order they're listed. Each runs the
 * same code the app's own pages do.
 */

import {z} from 'zod'
import {listDocuments} from '../../platform/documents'
import {useDocumentStore} from '../../store/document-store'
import {DOCUMENT_TYPES, nounOfKind} from '../../store/document-types'
import {defineTool, type McpTool} from './tool'

const KINDS = DOCUMENT_TYPES.map((type) => type.kind) as [string, ...string[]]

const kindsInWords = DOCUMENT_TYPES.map((type) => `"${type.kind}" (${type.noun})`).join(', ')

export const listDocumentsTool = defineTool({
    name: 'list_documents',
    title: 'List documents',
    description:
        `Lists the documents saved in the app, newest first: each one's id, name, kind and when it was saved. Use it first, to find the id other tools need. Kinds: ${kindsInWords}.`,
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

export const TOOLS: readonly McpTool[] = [listDocumentsTool]
