/**
 * AI assistants: lets an assistant the person already uses, such as Claude, read and
 * change their documents over the Model Context Protocol, when the AI assistants
 * setting allows it. Go carries the calls; the tools run here, with the app's own code.
 */

import './mcp.css'
import {Bot} from 'lucide-react'
import type {Feature} from '../../shell/feature'
import {useUiStore} from '../../store/ui-store'
import {AssistantsSettings} from './AssistantsSettings'
import {startBridge} from './bridge'
import type {FormatsByKind} from './file-tools'
import {toolsWith} from './tools'

/** The feature, given the export formats of each kind of document, by kind. */
export const assistants = (formats: FormatsByKind): Feature => ({
    id: 'mcp',
    commands: [
        {
            id: 'connect-assistant',
            label: 'Connect an AI assistant…',
            group: 'Help',
            icon: Bot,
            global: true,
            keywords: 'ai mcp claude chatgpt copilot cursor codex gemini qwen opencode cline roo kilo continue goose zed windsurf lm studio ollama local model open source agent assistant',
            run: () => useUiStore.getState().openSettings('AI assistants'),
        },
    ],
    settingsPages: [{id: 'AI assistants', icon: Bot, Page: AssistantsSettings}],
    start: () => startBridge(toolsWith(formats)),
})
