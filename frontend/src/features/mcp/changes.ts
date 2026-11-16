/**
 * How a change from an assistant lands. On the document open in the editor it's one
 * step to undo, left unsaved, as if typed. On a closed document it's saved to the file,
 * after keeping a copy of the file as it was. Either way it's added to the list of what
 * assistants did.
 */

import {z} from 'zod'
import {parseDocument, serializeDocument} from '../../core/document/document-file'
import {listDocuments, newDocumentId, readDocument, writeDocument} from '../../platform/documents'
import {textFromBinding} from '../../platform/bytes'
import {desktopApp} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import type {Content} from '../../store/document-types'
import {toolsFor, type ToolDocument} from './documents'
import type {ToolContext} from './tool'

/** One change an assistant made, as Go keeps it. */
export interface Activity {
    readonly at: string
    readonly client: string
    readonly documentId: string
    readonly documentName: string
    readonly summary: string
    /** The copy kept from before the change, which can be put back. */
    readonly copy?: string
}

interface HistoryBindings {
    KeepCopy(id: string, contents: number[]): Promise<string>
    ReadCopy(name: string): Promise<unknown>
    RecordActivity(activity: Omit<Activity, 'at'> & {at?: string}): Promise<void>
    ListActivity(): Promise<Activity[] | null>
    ClearActivity(): Promise<void>
}

const bindings = (): HistoryBindings => {
    const found = desktopApp<HistoryBindings>('mcp')

    if (!found) {
        throw new Error('This only works in the app.')
    }

    return found
}

const bytesOf = (text: string): number[] => [...new TextEncoder().encode(text)]

/** Checks a document against its kind's schema, in words a model can act on. */
export function checked(kind: string, content: unknown): Content {
    const result = toolsFor(kind).type.content.safeParse(content)

    if (!result.success) {
        throw new Error(`The document wouldn't be valid, so nothing was changed:\n${z.prettifyError(result.error)}`)
    }

    return result.data
}

/** "made 3 changes" or the one change, for messages. */
export const summaryOf = (changes: readonly string[]): string => (changes.length === 1 ? changes[0] : `made ${changes.length} changes`)

async function record(context: ToolContext, document: {id: string; name: string}, summary: string, copy?: string): Promise<void> {
    // The list is for looking back; failing to add to it shouldn't undo the change.
    await bindings()
        .RecordActivity({client: context.client, documentId: document.id, documentName: document.name, summary, copy})
        .catch(() => undefined)
}

async function pictureOf(kind: string, content: Content): Promise<string | null> {
    // A picture that can't be made only costs the library its preview.
    return (await toolsFor(kind).type.thumbnail?.(content).catch(() => null)) ?? null
}

/** Puts changed content in place, and says what happened in words for the assistant. */
export async function saveChange(document: ToolDocument, content: unknown, changes: readonly string[], context: ToolContext): Promise<string> {
    const valid = checked(document.kind, content)
    const summary = summaryOf(changes)
    const store = useDocumentStore.getState()

    if (document.open && store.currentId === document.id) {
        store.edit(`${context.client}: ${summary}`, () => valid)
        useDocumentStore.setState({toast: {message: `${context.client} ${summary} in ${document.name}. It isn't saved yet.`, undoable: true}})
        await record(context, document, summary)

        return `Changed in the editor, where it's open: ${changes.join('; ')}. It isn't saved yet; the person saves it, or takes it back with Undo.`
    }

    const text = await readDocument(document.id)
    const loaded = parseDocument(text, toolsFor(document.kind).type)
    const copy = await bindings().KeepCopy(document.id, bytesOf(text))

    await writeDocument(document.id, serializeDocument({name: loaded.name, content: valid, extras: loaded.extras}, toolsFor(document.kind).type), await pictureOf(document.kind, valid))
    await record(context, document, summary, copy)
    void store.refreshDocuments()

    return `Saved: ${changes.join('; ')}. A copy from before is kept, so the person can put it back.`
}

/** A name not already in the library: "Jane Doe" becomes "Jane Doe 2". */
export async function freeName(base: string): Promise<string> {
    const taken = new Set((await listDocuments()).map((document) => document.name))
    let name = base.trim() || 'Untitled'
    let count = 2

    while (taken.has(name)) {
        name = `${base.trim()} ${count}`
        count += 1
    }

    return name
}

/** Saves a new document to the library, and returns its id. */
export async function saveNew(kind: string, name: string, content: unknown, context: ToolContext, summary: string): Promise<string> {
    const valid = checked(kind, content)
    const id = newDocumentId()

    await writeDocument(id, serializeDocument({name, content: valid}, toolsFor(kind).type), await pictureOf(kind, valid))
    await record(context, {id, name}, summary)
    void useDocumentStore.getState().refreshDocuments()

    return id
}

export async function listActivity(): Promise<Activity[]> {
    return (await bindings().ListActivity()) ?? []
}

export const clearActivity = (): Promise<void> => bindings().ClearActivity()

/**
 * Puts back a document as it was before an assistant's change, keeping what's there
 * now as a copy too. A document open in the editor gets it as a step to undo instead.
 */
export async function putBack(activity: Activity): Promise<void> {
    if (!activity.copy) {
        throw new Error('There is no copy of this one to put back.')
    }

    const before = textFromBinding(await bindings().ReadCopy(activity.copy))
    const kind = JSON.parse(before).kind as string
    const loaded = parseDocument(before, toolsFor(kind).type)
    const store = useDocumentStore.getState()

    if (store.currentId === activity.documentId) {
        store.edit('Put back', () => loaded.content)
        return
    }

    const now = await readDocument(activity.documentId).catch(() => null)

    if (now !== null) {
        await bindings().KeepCopy(activity.documentId, bytesOf(now))
    }

    await writeDocument(activity.documentId, before, await pictureOf(kind, loaded.content))
    void store.refreshDocuments()
}
