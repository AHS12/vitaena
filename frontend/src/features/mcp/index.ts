/**
 * AI assistants: lets an assistant the person already uses, such as Claude, read and
 * change their documents over the Model Context Protocol, when the AI assistants
 * setting allows it. Go carries the calls; the tools run here, with the app's own code.
 */

import type {Feature} from '../../shell/feature'
import {startBridge} from './bridge'
import type {FormatsByKind} from './file-tools'
import {toolsWith} from './tools'

/** The feature, given the export formats of each kind of document, by kind. */
export const assistants = (formats: FormatsByKind): Feature => ({
    id: 'mcp',
    start: () => startBridge(toolsWith(formats)),
})
