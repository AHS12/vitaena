/**
 * The little formatting a CV needs, written the way people already write it in plain
 * text: **bold**, *italic* (or _italic_) and [a link](https://example.com).
 *
 * Text becomes a list of spans, so templates and exports style plain strings and never
 * interpret what someone typed as markup.
 */

export interface Span {
    readonly text: string
    readonly bold?: boolean
    readonly italic?: boolean
    readonly url?: string
}

const TOKEN = /\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*|(?<![\w])_([^_\s][^_]*?)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)/g

const linkUrl = (url: string): string => (/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`)

export function parseRich(text: string): Span[] {
    const spans: Span[] = []
    let last = 0

    for (const match of text.matchAll(TOKEN)) {
        const at = match.index ?? 0

        if (at > last) {
            spans.push({text: text.slice(last, at)})
        }

        if (match[1] !== undefined) {
            spans.push({text: match[1], bold: true})
        } else if (match[2] !== undefined || match[3] !== undefined) {
            spans.push({text: match[2] ?? match[3], italic: true})
        } else {
            spans.push({text: match[4], url: linkUrl(match[5])})
        }

        last = at + match[0].length
    }

    if (last < text.length) {
        spans.push({text: text.slice(last)})
    }

    return spans
}

/**
 * The words alone, for plain text. A link keeps its address in brackets, so a reader
 * of plain text can still find it.
 */
export const plainOf = (spans: readonly Span[]): string => spans.map((span) => (span.url && span.url.replace(/^https?:\/\//, '') !== span.text ? `${span.text} (${span.url.replace(/^https?:\/\//, '')})` : span.text)).join('')
