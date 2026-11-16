/**
 * AI assistants: lets an assistant the person already uses, such as Claude, read and
 * change their documents over the Model Context Protocol, when the AI assistants
 * setting allows it. Go carries the calls; the tools run here, with the app's own code.
 */

import type {Feature} from '../../shell/feature'
import {startBridge} from './bridge'
import {TOOLS} from './tools'

export const assistants: Feature = {
    id: 'mcp',
    start: () => startBridge(TOOLS),
}
