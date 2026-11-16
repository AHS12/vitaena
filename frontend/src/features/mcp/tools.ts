/**
 * The tools an AI assistant can call, in the order they're listed. Each runs the
 * same code the app's own pages do.
 */

import {READ_TOOLS} from './read-tools'
import type {McpTool} from './tool'

export const TOOLS: readonly McpTool[] = [...READ_TOOLS]
