/**
 * A biodata as a Word document, for families who want to change a word themselves.
 * Details are a two-column table of label and value, the family a ruled table, and the
 * photos are placed as pictures. Built from the same render model as the PDF, so the
 * age, the height and what's hidden all match.
 */

import {wordFonts, wordParagraph} from '../cv/docx-export'
import type {RenderEntry} from '../cv/render-model'
import type {Span} from '../cv/rich'
import type {BiodataRenderModel} from './render-model'

const CM = 37.8 // Pixels to a centimetre, at the 96 to an inch Word measures pictures in.
const MUTED = '595959'

/** A picture's own width and height in pixels, so it keeps its shape in Word. */
async function sizeOf(dataUrl: string): Promise<{width: number; height: number}> {
    const image = new Image()

    image.src = dataUrl
    await image.decode()

    return {width: image.naturalWidth || 1, height: image.naturalHeight || 1}
}

const pictureType = (dataUrl: string): 'png' | 'jpg' => (dataUrl.startsWith('data:image/png') ? 'png' : 'jpg')

export async function biodataDocx(model: BiodataRenderModel): Promise<Uint8Array> {
    const {AlignmentType, BorderStyle, Document, ExternalHyperlink, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType} = await import('docx')
    const accent = model.design.accent.replace('#', '')
    const size = Math.round(model.design.fontSize * 2)
    const none = {style: BorderStyle.NONE, size: 0, color: 'FFFFFF'}
    const noBorders = {top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none}
    const rule = {style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9'}

    /** A picture `height` centimetres tall, its width following its own shape. */
    const picture = async (dataUrl: string, height: number) => {
        const shape = await sizeOf(dataUrl)

        return new ImageRun({type: pictureType(dataUrl), data: dataUrl, transformation: {height: Math.round(height * CM), width: Math.round((height * CM * shape.width) / shape.height)}})
    }

    const runs = (spans: readonly Span[]) =>
        spans.map((span) =>
            span.url
                ? new ExternalHyperlink({link: span.url, children: [new TextRun({text: span.text, style: 'Hyperlink', bold: span.bold, italics: span.italic})]})
                : new TextRun({text: span.text, bold: span.bold, italics: span.italic}),
        )

    const cell = (text: string, options: {bold?: boolean; color?: string; width: number}) =>
        new TableCell({width: {size: options.width, type: WidthType.PERCENTAGE}, children: [new Paragraph({children: [new TextRun({text, bold: options.bold, color: options.color})]})]})

    const entry = (item: RenderEntry) => {
        const meta = [item.location, item.dates].filter(Boolean).join('  |  ')

        return [
            new Paragraph({children: [new TextRun({text: [item.title, item.org].filter(Boolean).join(', '), bold: true})], spacing: {before: 120}, keepNext: true}),
            ...(meta ? [new Paragraph({children: [new TextRun({text: meta, color: MUTED})]})] : []),
            ...(item.summary.length > 0 ? [new Paragraph({children: runs(item.summary)})] : []),
            ...item.bullets.map((bullet) => new Paragraph({children: runs(bullet), bullet: {level: 0}})),
        ]
    }

    const body: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = []

    if (model.headingImage) {
        body.push(new Paragraph({alignment: AlignmentType.CENTER, children: [await picture(model.headingImage, 1.2)]}))
    }

    if (model.heading) {
        body.push(new Paragraph({alignment: AlignmentType.CENTER, spacing: {after: 160}, children: [new TextRun({text: model.heading, color: accent})]}))
    }

    if (model.name) {
        body.push(new Paragraph({alignment: AlignmentType.CENTER, spacing: {after: 120}, children: [new TextRun({text: model.name, bold: true, color: accent, size: Math.round(size * 2.1)})]}))
    }

    if (model.photo) {
        body.push(new Paragraph({alignment: AlignmentType.CENTER, spacing: {after: 120}, children: [await picture(model.photo, 3.4)]}))
    }

    for (const section of model.sections) {
        body.push(
            new Paragraph({
                keepNext: true,
                spacing: {before: 280, after: 100},
                border: {bottom: {style: BorderStyle.SINGLE, size: 6, color: accent, space: 2}},
                children: [new TextRun({text: section.title, bold: true, color: accent, size: Math.round(size * 1.1)})],
            }),
        )

        if (section.kind === 'details') {
            body.push(
                new Table({
                    width: {size: 100, type: WidthType.PERCENTAGE},
                    borders: noBorders,
                    rows: section.rows.map((row) => new TableRow({children: [cell(row.label, {color: MUTED, width: 36}), cell(row.value, {width: 64})]})),
                }),
            )
        } else if (section.kind === 'family') {
            body.push(
                new Table({
                    width: {size: 100, type: WidthType.PERCENTAGE},
                    borders: {top: none, left: none, right: none, insideVertical: none, bottom: rule, insideHorizontal: rule},
                    rows: section.members.map(
                        (member) =>
                            new TableRow({
                                children: [cell(member.relation, {bold: true, width: 18}), cell(member.name, {width: 30}), cell(member.work, {width: 34}), cell(member.note, {color: MUTED, width: 18})],
                            }),
                    ),
                }),
            )
        } else if (section.kind === 'text') {
            body.push(...section.paragraphs.map((paragraph) => new Paragraph({children: runs(paragraph)})))
        } else if (section.kind === 'entries') {
            body.push(...section.entries.flatMap(entry))
        } else {
            body.push(...section.groups.map((group) => new Paragraph({children: [...(group.label ? [new TextRun({text: `${group.label}: `, color: MUTED})] : []), new TextRun(group.items)]})))
        }
    }

    if (model.fullPhoto) {
        body.push(new Paragraph({alignment: AlignmentType.CENTER, spacing: {before: 280}, children: [await picture(model.fullPhoto, 9)]}))
    }

    const document = new Document({
        title: model.name ? `${model.name} – Biodata` : 'Biodata',
        creator: model.name || undefined,
        styles: {default: {document: {run: {font: wordFonts(model.design), size}, paragraph: wordParagraph(model.design)}}},
        sections: [
            {
                properties: {
                    page: {
                        size: model.design.paper === 'us-letter' ? {width: 12240, height: 15840} : {width: 11906, height: 16838},
                        // Centimetres to twentieths of a point.
                        margin: {top: Math.round(model.design.margin * 567), bottom: Math.round(model.design.margin * 567), left: Math.round(model.design.margin * 567), right: Math.round(model.design.margin * 567)},
                    },
                },
                children: body,
            },
        ],
    })

    return new Uint8Array(await (await Packer.toBlob(document)).arrayBuffer())
}
