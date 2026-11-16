/**
 * Carries tool calls between Go and the tools. Go offers the tools to assistants
 * and sends each call here as an event; the answer goes back with Reply.
 */

import {z} from 'zod'
import {desktopApp, desktopRuntime} from '../../platform/shell'
import {useSettingsStore} from '../../store/settings-store'
import {specOf, type McpTool, type ToolSpec} from './tool'

/** Go's `mcp.CallEvent`. */
export const CALL_EVENT = 'mcp:call'

interface Reply {
    readonly text: string
    readonly structured?: unknown
    readonly isError: boolean
}

interface McpBindings {
    Ready(tools: readonly ToolSpec[], access: string): Promise<void>
    Reply(id: string, reply: Reply): Promise<void>
}

const accessNow = (): string => String(useSettingsStore.getState().values.assistants ?? 'off')

/** Runs one call, and never throws: a failure is an answer the model can read. */
export async function answer(tools: readonly McpTool[], name: string, argumentsText: string): Promise<Reply> {
    const tool = tools.find((found) => found.name === name)

    if (!tool) {
        return {text: `There's no tool called ${name}.`, isError: true}
    }

    let raw: unknown

    try {
        raw = JSON.parse(argumentsText || '{}')
    } catch {
        return {text: 'The arguments are not valid JSON.', isError: true}
    }

    const input = tool.input.safeParse(raw)

    if (!input.success) {
        return {text: `The arguments don't fit ${name}:\n${z.prettifyError(input.error)}`, isError: true}
    }

    try {
        const result = await tool.run(input.data)
        return {text: result.text, structured: result.structured, isError: false}
    } catch (error) {
        return {text: error instanceof Error ? error.message : String(error), isError: true}
    }
}

/** Starts answering assistants. What it returns stops it. */
export function startBridge(tools: readonly McpTool[]): (() => void) | void {
    const bindings = desktopApp<McpBindings>('mcp')
    const runtime = desktopRuntime()

    if (!bindings || !runtime) {
        return
    }

    const specs = tools.map(specOf)
    const stopCalls = runtime.EventsOn(CALL_EVENT, (...data: never[]) => {
        const [id, name, argumentsText] = data as unknown as [string, string, string]

        void answer(tools, name, argumentsText).then((reply) => bindings.Reply(id, reply))
    })

    let access = accessNow()
    // Losing the link to assistants isn't worth interrupting anyone for.
    const ready = () => void bindings.Ready(specs, access).catch(() => undefined)

    ready()

    const stopSetting = useSettingsStore.subscribe(() => {
        if (accessNow() !== access) {
            access = accessNow()
            ready()
        }
    })

    return () => {
        stopCalls()
        stopSetting()
    }
}
