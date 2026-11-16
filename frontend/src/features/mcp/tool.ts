/**
 * A tool an AI assistant can call, and how it's described to the assistant.
 *
 * Each tool is the app's own code behind a zod schema. The schema is turned into
 * JSON Schema in a shape every client and model accepts: one plain object at the
 * top, with no unions or references, since Gemini rejects `anyOf`, `oneOf`, `const`,
 * `$ref` and `$defs`, and OpenAI's strict mode rejects `$ref`.
 */

import {z} from 'zod'

/** What a tool answers: words every client shows, and the same as data. */
export interface ToolAnswer {
    readonly text: string
    readonly structured?: unknown
    /** Pictures after the text, as base64. */
    readonly images?: readonly ToolImage[]
}

export interface ToolImage {
    readonly data: string
    readonly mimeType: string
}

export interface McpTool<Input extends z.ZodObject = z.ZodObject> {
    /** snake_case, short: Cursor allows 60 characters with the server's name. */
    readonly name: string
    readonly title: string
    /** When to use it, for the model. */
    readonly description: string
    readonly input: Input
    /** Allowed with Read only. The others need Read and edit. */
    readonly readOnly: boolean
    readonly destructive?: boolean
    readonly idempotent?: boolean
    run(input: z.infer<Input>, context: ToolContext): Promise<ToolAnswer>
}

/** Who's calling. */
export interface ToolContext {
    /** What the assistant calls itself, such as "Claude". */
    readonly client: string
}

/** The same, as Go's `ToolSpec`. */
export interface ToolSpec {
    readonly name: string
    readonly title: string
    readonly description: string
    readonly inputSchema: Record<string, unknown>
    readonly readOnly: boolean
    readonly destructive: boolean
    readonly idempotent: boolean
}

/** Makes a tool, keeping its input's type for `run`. */
export const defineTool = <Input extends z.ZodObject>(tool: McpTool<Input>): McpTool => tool as unknown as McpTool

/** Keywords some clients or models reject, wherever they appear. */
export const UNPORTABLE = ['anyOf', 'oneOf', 'allOf', 'not', 'const', '$ref', '$defs', 'definitions', 'patternProperties', 'if', 'then', 'else'] as const

/** Keys left out because some clients reject them and nothing needs them. */
const DROPPED = new Set(['$schema', 'additionalProperties'])

function tidy(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(tidy)
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).filter(([key]) => !DROPPED.has(key)).map(([key, inner]) => [key, tidy(inner)]))
    }

    return value
}

export function inputSchemaOf(input: z.ZodObject): Record<string, unknown> {
    return tidy(z.toJSONSchema(input, {target: 'draft-2020-12', io: 'input', unrepresentable: 'any'})) as Record<string, unknown>
}

/** The keywords in a schema that some client would reject, for tests. */
export function unportableKeywords(schema: unknown, found: Set<string> = new Set()): Set<string> {
    if (Array.isArray(schema)) {
        schema.forEach((inner) => unportableKeywords(inner, found))
    } else if (schema && typeof schema === 'object') {
        for (const [key, inner] of Object.entries(schema)) {
            if ((UNPORTABLE as readonly string[]).includes(key)) {
                found.add(key)
            }

            // A property may be called anything: only what's inside it is a schema.
            if (key === 'properties' && inner && typeof inner === 'object') {
                Object.values(inner).forEach((property) => unportableKeywords(property, found))
            } else {
                unportableKeywords(inner, found)
            }
        }
    }

    return found
}

export const specOf = (tool: McpTool): ToolSpec => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: inputSchemaOf(tool.input),
    readOnly: tool.readOnly,
    destructive: tool.destructive ?? false,
    idempotent: tool.idempotent ?? tool.readOnly,
})
