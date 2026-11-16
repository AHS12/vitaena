import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {serializeDocument} from '../../core/document/document-file'
import {cvType} from '../../cv/cv'
import {sampleCv} from '../../cv/sample'
import {fakeDesktop} from '../../platform/shell'
import {useDocumentStore} from '../../store/document-store'
import {useSettingsStore} from '../../store/settings-store'
import {AssistantsSettings} from './AssistantsSettings'
import {clientSetups} from './connect'

vi.mock('../../cv/thumbnail', () => ({cvThumbnail: async () => null, pageThumbnail: async () => null}))

const WINDOWS = 'C:\\Program Files\\Vitaena\\vitaena.exe'

describe('what to paste into each assistant', () => {
    const setups = clientSetups(WINDOWS)
    const of = (id: string) => setups.find((setup) => setup.id === id)?.snippet ?? ''

    it('gives each client its own shape, with the program and the argument mcp', () => {
        expect(JSON.parse(of('claude-desktop'))).toEqual({mcpServers: {vitaena: {command: WINDOWS, args: ['mcp']}}})
        expect(JSON.parse(of('vscode'))).toEqual({servers: {vitaena: {type: 'stdio', command: WINDOWS, args: ['mcp']}}})
        expect(of('claude-code')).toBe(`claude mcp add --scope user vitaena -- "${WINDOWS}" mcp`)
        expect(of('codex')).toBe(`[mcp_servers.vitaena]\ncommand = '${WINDOWS}'\nargs = ["mcp"]`)
    })

    it('keeps a path with an apostrophe a valid TOML string', () => {
        const codex = clientSetups("/home/o'neil/Vitaena.AppImage").find((setup) => setup.id === 'codex')?.snippet

        expect(codex).toContain(`command = "/home/o'neil/Vitaena.AppImage"`)
    })
})

describe('Settings, AI assistants', () => {
    let app: Record<string, ReturnType<typeof vi.fn>>
    const before = serializeDocument({name: 'Jane Doe', content: sampleCv()}, cvType)
    const base64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)))

    beforeEach(() => {
        app = {
            ProgramPath: vi.fn(async () => WINDOWS),
            ListActivity: vi.fn(async () => [
                {at: new Date().toISOString(), client: 'Claude', documentId: 'cv-1', documentName: 'Jane Doe', summary: 'set the headline', copy: 'cv-1~1.json'},
                {at: '2026-11-01T09:00:00Z', client: 'Cursor', documentId: 'cv-2', documentName: 'Jane Doe 2', summary: 'copied "Jane Doe"'},
            ]),
            ClearActivity: vi.fn(async () => undefined),
            ReadCopy: vi.fn(async () => base64(before)),
            ReadDocument: vi.fn(async () => base64(before)),
            KeepCopy: vi.fn(async () => 'cv-1~2.json'),
            WriteDocument: vi.fn(async () => undefined),
            ListDocuments: vi.fn(async () => []),
            ReadDocumentsIndex: vi.fn(async () => {
                throw new Error('none')
            }),
            WriteDocumentsIndex: vi.fn(async () => undefined),
        }
        fakeDesktop(app)
    })

    afterEach(() => {
        cleanup()
        fakeDesktop()
        useSettingsStore.getState().setValue('assistants', 'off')
    })

    it('sets the access, shows the lines for the installed program, and switches assistant', async () => {
        render(<AssistantsSettings />)

        fireEvent.click(screen.getByRole('button', {name: /AI assistants/}))
        fireEvent.click(screen.getByRole('option', {name: 'Read and edit'}))
        expect(useSettingsStore.getState().values.assistants).toBe('edit')

        await waitFor(() => expect(screen.getByLabelText('What to add to Claude Desktop').textContent).toContain('Program Files'))

        fireEvent.click(screen.getByRole('button', {name: /Claude Desktop/}))
        fireEvent.click(screen.getByRole('option', {name: 'Claude Code'}))
        expect(screen.getByLabelText('What to add to Claude Code').textContent).toBe(`claude mcp add --scope user vitaena -- "${WINDOWS}" mcp`)
    })

    it('lists what assistants did, and puts a change back from its copy', async () => {
        render(<AssistantsSettings />)

        expect(await screen.findByText('Claude set the headline')).toBeTruthy()
        expect(screen.getByText(/^Jane Doe, today at/)).toBeTruthy()
        expect(screen.getAllByRole('button', {name: 'Put back'})).toHaveLength(1)

        fireEvent.click(screen.getByRole('button', {name: 'Put back'}))

        await waitFor(() => expect(app.WriteDocument).toHaveBeenCalledWith('cv-1', expect.any(Array), expect.any(Array)))
        expect(app.KeepCopy).toHaveBeenCalled()
        expect(useDocumentStore.getState().toast?.message).toBe('Put "Jane Doe" back as it was before Claude set the headline.')

        fireEvent.click(screen.getByRole('button', {name: 'Clear the list'}))
        await waitFor(() => expect(app.ClearActivity).toHaveBeenCalled())
    })
})
