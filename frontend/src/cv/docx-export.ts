/**
 * The CV as a Word document, for job portals that ask for one. Always one column, with
 * real headings and real bullet lists, which is what parsers read best in Word files.
 * Built from the same render model as the PDF, so dates and hidden items match.
 */

import {languageInfo} from '../core/labels/labels'
import {SCRIPT_FONTS} from './fonts'
import type {RenderEntry, RenderModel} from './render-model'
import type {Span} from './rich'

/**
 * The fonts Word is told: the main one for Latin letters, and the font for the document's
 * script, such as Bangla or Arabic, which Word treats as a complex script and sets in its
 * own font. Word uses them where they're installed; a Word file names fonts but doesn't
 * carry them.
 */
export function wordFonts(design: {readonly font: string; readonly fonts: readonly string[]; readonly lang: string}) {
    const script = languageInfo(design.lang).script ?? 'bengali'
    const others = design.fonts.slice(1)
    // A font the person added comes right after the main one, before every bundled font.
    const added = others[0] && !SCRIPT_FONTS.some((font) => font.family === others[0]) ? others[0] : undefined
    const bundled = others.find((family) => SCRIPT_FONTS.some((font) => font.family === family && font.script === script))

    const own = added ?? bundled ?? design.font

    // Word sets Chinese and Japanese in its East Asian font, and other scripts in its complex-script one.
    return script === 'cjk' ? {ascii: design.font, hAnsi: design.font, eastAsia: own} : {ascii: design.font, hAnsi: design.font, cs: own}
}

/** A right-to-left document's paragraphs run right to left in Word too. */
export const wordParagraph = (design: {readonly rtl: boolean}) => ({spacing: {after: 60, line: 276}, ...(design.rtl ? {bidirectional: true} : {})})

const BULLETS = 'cv-bullets'

export async function cvDocx(model: RenderModel): Promise<Uint8Array> {
    const {AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, LevelFormat, Packer, Paragraph, TextRun} = await import('docx')
    const accent = model.design.accent.replace('#', '')
    const size = Math.round(model.design.fontSize * 2)

    /** Bold, italic and links as Word runs. */
    const runs = (spans: readonly Span[]) =>
        spans.map((span) =>
            span.url
                ? new ExternalHyperlink({link: span.url, children: [new TextRun({text: span.text, style: 'Hyperlink', bold: span.bold, italics: span.italic})]})
                : new TextRun({text: span.text, bold: span.bold, italics: span.italic}),
        )

    const entry = (item: RenderEntry): InstanceType<typeof Paragraph>[] => {
        const head = [item.title ? new TextRun({text: item.title, bold: true}) : null, item.title && item.org ? new TextRun(', ') : null, item.org ? new TextRun(item.org) : null].filter(
            (run) => run !== null,
        )
        const meta = [item.location, item.dates].filter(Boolean).join('  |  ')

        return [
            new Paragraph({children: head, spacing: {before: 160, after: 0}, keepNext: true}),
            ...(meta ? [new Paragraph({children: [new TextRun({text: meta, color: '595959'})], keepNext: true})] : []),
            ...(item.summary.length > 0 ? [new Paragraph({children: runs(item.summary)})] : []),
            ...item.bullets.map((bullet) => new Paragraph({children: runs(bullet), numbering: {reference: BULLETS, level: 0}})),
        ]
    }

    const body: InstanceType<typeof Paragraph>[] = []

    if (model.name) {
        body.push(new Paragraph({heading: HeadingLevel.TITLE, children: [new TextRun({text: model.name, bold: true, size: size * 2.1})]}))
    }

    if (model.headline) {
        body.push(new Paragraph({children: [new TextRun({text: model.headline, size: Math.round(size * 1.15), color: '404040'})]}))
    }

    if (model.contact.length > 0) {
        body.push(
            new Paragraph({
                spacing: {after: 120},
                children: model.contact.flatMap((item, index) => [
                    ...(index > 0 ? [new TextRun('  |  ')] : []),
                    item.url ? new ExternalHyperlink({link: item.url, children: [new TextRun({text: item.text, style: 'Hyperlink'})]}) : new TextRun(item.text),
                ]),
            }),
        )
    }

    for (const section of model.sections) {
        body.push(
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                keepNext: true,
                border: {bottom: {style: BorderStyle.SINGLE, size: 6, color: accent, space: 2}},
                children: [new TextRun({text: section.title.toUpperCase(), bold: true, color: accent})],
            }),
        )

        if (section.kind === 'text') {
            body.push(...section.paragraphs.map((paragraph) => new Paragraph({children: runs(paragraph)})))
        } else if (section.kind === 'entries') {
            body.push(...section.entries.flatMap(entry))
        } else if (section.kind === 'details') {
            body.push(...section.rows.map((row) => new Paragraph({children: [...(row.label ? [new TextRun({text: `${row.label}: `, bold: true})] : []), new TextRun(row.value)]})))
        } else {
            body.push(...section.groups.map((group) => new Paragraph({children: [...(group.label ? [new TextRun({text: `${group.label}: `, bold: true})] : []), new TextRun(group.items)]})))
        }
    }

    const document = new Document({
        title: model.name ? `${model.name} – CV` : 'CV',
        creator: model.name || undefined,
        styles: {
            default: {document: {run: {font: wordFonts(model.design), size}, paragraph: wordParagraph(model.design)}},
            paragraphStyles: [{id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: {size: Math.round(size * 1.1)}, paragraph: {spacing: {before: 280, after: 100}}}],
        },
        numbering: {
            config: [
                {
                    reference: BULLETS,
                    levels: [{level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START, style: {paragraph: {indent: {start: 360, hanging: 240}}}}],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        size: model.design.paper === 'us-letter' ? {width: 12240, height: 15840} : {width: 11906, height: 16838},
                        // Centimetres to twentieths of a point.
                        margin: {top: Math.round(model.design.margin * 510), bottom: Math.round(model.design.margin * 567), left: Math.round(model.design.margin * 567), right: Math.round(model.design.margin * 567)},
                    },
                },
                children: body,
            },
        ],
    })

    return new Uint8Array(await (await Packer.toBlob(document)).arrayBuffer())
}
