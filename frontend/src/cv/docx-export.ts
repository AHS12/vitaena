/**
 * The CV as a Word document, for job portals that ask for one. Always one column, with
 * real headings and real bullet lists, which is what parsers read best in Word files.
 * Built from the same render model as the PDF, so dates and hidden items match.
 */

import type {RenderEntry, RenderModel} from './render-model'

const BULLETS = 'cv-bullets'

export async function cvDocx(model: RenderModel): Promise<Uint8Array> {
    const {AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, LevelFormat, Packer, Paragraph, TextRun} = await import('docx')
    const accent = model.design.accent.replace('#', '')
    const size = Math.round(model.design.fontSize * 2)

    const entry = (item: RenderEntry): InstanceType<typeof Paragraph>[] => {
        const head = [item.title ? new TextRun({text: item.title, bold: true}) : null, item.title && item.org ? new TextRun(', ') : null, item.org ? new TextRun(item.org) : null].filter(
            (run) => run !== null,
        )
        const meta = [item.location, item.dates].filter(Boolean).join('  |  ')

        return [
            new Paragraph({children: head, spacing: {before: 160, after: 0}, keepNext: true}),
            ...(meta ? [new Paragraph({children: [new TextRun({text: meta, color: '595959'})], keepNext: true})] : []),
            ...(item.summary ? [new Paragraph({text: item.summary})] : []),
            ...item.bullets.map((bullet) => new Paragraph({text: bullet, numbering: {reference: BULLETS, level: 0}})),
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
            body.push(...section.text.split('\n').filter((line) => line.trim()).map((line) => new Paragraph({text: line})))
        } else if (section.kind === 'entries') {
            body.push(...section.entries.flatMap(entry))
        } else {
            body.push(...section.groups.map((group) => new Paragraph({children: [...(group.label ? [new TextRun({text: `${group.label}: `, bold: true})] : []), new TextRun(group.items)]})))
        }
    }

    const document = new Document({
        title: model.name ? `${model.name} – CV` : 'CV',
        creator: model.name || undefined,
        styles: {
            default: {document: {run: {font: model.design.font, size}, paragraph: {spacing: {after: 60, line: 276}}}},
            paragraphStyles: [{id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: {size: Math.round(size * 1.1)}, paragraph: {spacing: {before: 280, after: 100}}}],
        },
        numbering: {
            config: [
                {
                    reference: BULLETS,
                    levels: [{level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: {paragraph: {indent: {left: 360, hanging: 240}}}}],
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
