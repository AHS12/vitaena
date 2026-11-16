import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {useSettingsStore} from '../../store/settings-store'
import {answer, CALL_EVENT, startBridge} from './bridge'
import {specOf, unportableKeywords} from './tool'
import {TOOLS} from './tools'

const base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)))
const file = (kind: string, name: string) => base64(JSON.stringify({version: 1, kind, name, content: {}}))

let app: Record<string, ReturnType<typeof vi.fn>>
let listeners: Map<string, (...data: never[]) => void>

beforeEach(() => {
    listeners = new Map()
    app = {
        ListDocuments: vi.fn(async () => [
            {id: 'a', savedAt: '2026-11-16T10:00:00Z', size: 10, hasPicture: false},
            {id: 'b', savedAt: '2026-11-15T10:00:00Z', size: 10, hasPicture: false},
        ]),
        ReadDocument: vi.fn(async (id: string) => (id === 'a' ? file('cv', 'Jane Doe') : file('biodata', 'John Doe biodata'))),
        ReadDocumentsIndex: vi.fn(async () => {
            throw new Error('none yet')
        }),
        WriteDocumentsIndex: vi.fn(async () => undefined),
        Ready: vi.fn(async () => undefined),
        Reply: vi.fn(async () => undefined),
    }
    fakeDesktop(app, {
        EventsOn: (name, callback) => {
            listeners.set(name, callback)
            return () => listeners.delete(name)
        },
    })
    useDocumentStore.setState({currentId: 'a'})
    useSettingsStore.getState().setValue('assistants', 'off')
})

afterEach(() => {
    fakeDesktop()
    useDocumentStore.setState({currentId: null})
})

describe('the tools assistants see', () => {
    it('have short snake_case names and plain object inputs every client accepts', () => {
        for (const tool of TOOLS) {
            const spec = specOf(tool)

            expect(spec.name).toMatch(/^[a-z][a-z_]{2,39}$/)
            expect(spec.inputSchema.type).toBe('object')
            expect([...unportableKeywords(spec.inputSchema)], spec.name).toEqual([])
            expect(spec.inputSchema).not.toHaveProperty('$schema')
            expect(spec.description.length).toBeGreaterThan(40)
        }
    })

    it('finds keywords some clients reject, and not properties that share their names', () => {
        expect([...unportableKeywords({type: 'object', properties: {const: {type: 'string'}, a: {anyOf: [{type: 'string'}]}}})]).toEqual(['anyOf'])
    })
})

describe('list_documents', () => {
    it('lists every document with its kind, saying which is open', async () => {
        const reply = await answer(TOOLS, 'list_documents', '{}')

        expect(reply.isError).toBe(false)
        expect(reply.structured).toEqual({
            documents: [
                {id: 'a', name: 'Jane Doe', kind: 'cv', savedAt: '2026-11-16T10:00:00Z', open: true},
                {id: 'b', name: 'John Doe biodata', kind: 'biodata', savedAt: '2026-11-15T10:00:00Z', open: false},
            ],
        })
        expect(reply.text).toContain('- Jane Doe (CV), id a, saved 2026-11-16T10:00:00Z, open in the editor now')
    })

    it('keeps to one kind, or to names with the words searched for', async () => {
        expect((await answer(TOOLS, 'list_documents', '{"kind":"biodata"}')).text).toMatch(/^One document:\n- John Doe biodata/)
        expect((await answer(TOOLS, 'list_documents', '{"search":"JANE"}')).text).toMatch(/^One document:\n- Jane Doe/)
        expect((await answer(TOOLS, 'list_documents', '{"search":"nobody"}')).text).toBe('No documents match.')
    })
})

describe('answering a call', () => {
    it('says what is wrong with a call, so the model can fix it', async () => {
        expect(await answer(TOOLS, 'remove_everything', '{}')).toEqual({text: "There's no tool called remove_everything.", isError: true})
        expect(await answer(TOOLS, 'list_documents', '{nope')).toEqual({text: 'The arguments are not valid JSON.', isError: true})

        const wrongKind = await answer(TOOLS, 'list_documents', '{"kind":"letter"}')

        expect(wrongKind.isError).toBe(true)
        expect(wrongKind.text).toMatch(/don't fit list_documents[\s\S]*kind/)
    })

    it('tells Go the tools and the setting, again when the setting changes, and replies to calls', async () => {
        const stop = startBridge(TOOLS)

        expect(app.Ready).toHaveBeenCalledWith(TOOLS.map(specOf), 'off')

        useSettingsStore.getState().setValue('assistants', 'read')
        expect(app.Ready).toHaveBeenLastCalledWith(expect.any(Array), 'read')
        expect(app.Ready).toHaveBeenCalledTimes(2)

        listeners.get(CALL_EVENT)?.(...(['7', 'list_documents', '{"kind":"cv"}'] as never[]))
        await vi.waitFor(() => expect(app.Reply).toHaveBeenCalledWith('7', expect.objectContaining({isError: false, text: expect.stringContaining('Jane Doe')})))

        stop?.()
        expect(listeners.has(CALL_EVENT)).toBe(false)
    })
})
