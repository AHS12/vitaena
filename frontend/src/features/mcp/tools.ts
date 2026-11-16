/**
 * The tools an AI assistant can call, in the order they're listed. Each runs the
 * same code the app's own pages do.
 */

import {fileTools, type FormatsByKind} from './file-tools'
import {READ_TOOLS} from './read-tools'
import type {McpTool} from './tool'
import {WRITE_TOOLS} from './write-tools'

/** Every tool, with the export formats each kind of document has. */
export const toolsWith = (formats: FormatsByKind): readonly McpTool[] => [...READ_TOOLS, ...WRITE_TOOLS, ...fileTools(formats)]
