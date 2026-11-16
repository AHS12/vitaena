/**
 * What to paste into each assistant so it can start the app's MCP server: the same
 * program, with the argument `mcp`. Each client keeps its list of servers in its own
 * place and shape.
 */

import {APP} from '../../core/app'

export interface ClientSetup {
    readonly id: string
    readonly label: string
    /** Where it goes, in steps a person can follow. */
    readonly where: string
    readonly snippet: string
}

const json = (value: unknown): string => JSON.stringify(value, null, 2)

/** A TOML string: literal, so a Windows path's backslashes stay as they are. */
const tomlString = (text: string): string => (text.includes("'") ? JSON.stringify(text) : `'${text}'`)

/**
 * A path in double quotes, which a path with spaces needs. A backslash before a letter
 * stays as it is in every shell's double quotes, so a Windows path needs nothing more.
 */
const shellQuoted = (text: string): string => `"${text.replace(/"/g, '\\"')}"`

export function clientSetups(program: string): readonly ClientSetup[] {
    const name = APP.id
    const server = {command: program, args: ['mcp']}
    const mcpServers = json({mcpServers: {[name]: server}})
    const restart = `Then restart it, and ${APP.name} appears among its tools.`

    return [
        {
            id: 'claude-desktop',
            label: 'Claude Desktop',
            where: `In Claude Desktop, open Settings, then Developer, then Edit Config. Add this to the file, inside any "mcpServers" already there. ${restart}`,
            snippet: mcpServers,
        },
        {
            id: 'claude-code',
            label: 'Claude Code',
            where: 'Run this once in a terminal. It adds the server for every project.',
            snippet: `claude mcp add --scope user ${name} -- ${shellQuoted(program)} mcp`,
        },
        {
            id: 'cursor',
            label: 'Cursor',
            where: `Open Cursor Settings, then MCP, then Add new global MCP server, and add this to the file it opens. ${restart}`,
            snippet: mcpServers,
        },
        {
            id: 'vscode',
            label: 'VS Code and Copilot',
            where: 'In VS Code, run MCP: Open User Configuration from the Command Palette, and add this to the file.',
            snippet: json({servers: {[name]: {type: 'stdio', ...server}}}),
        },
        {
            id: 'codex',
            label: 'Codex',
            where: `Add this to config.toml in the .codex folder in your home folder. ${restart}`,
            snippet: `[mcp_servers.${name}]\ncommand = ${tomlString(program)}\nargs = ["mcp"]`,
        },
        {
            id: 'gemini',
            label: 'Gemini CLI',
            where: `Add this to settings.json in the .gemini folder in your home folder, inside any "mcpServers" already there. ${restart}`,
            snippet: mcpServers,
        },
        {
            id: 'windsurf',
            label: 'Windsurf',
            where: `Open Windsurf Settings, then Cascade, then Manage MCPs, then View raw config, and add this. ${restart}`,
            snippet: mcpServers,
        },
        {
            id: 'other',
            label: 'Another assistant',
            where: 'Any assistant that runs MCP servers on your computer (over stdio) can start this command.',
            snippet: `${shellQuoted(program)} mcp`,
        },
    ]
}
