/**
 * A biodata's pages as pictures, for sharing in a chat, where most biodata travel. Each
 * page is drawn from the same layout as the preview and the PDF, at 200 dots an inch:
 * sharp on a phone, and small enough to send.
 */

import {eachPage} from '../cv/thumbnail'
import type {PageModel} from '../cv/typst/images'

const DPI = 200
const POINTS_PER_INCH = 72
/** A4 is 595 points wide, so its picture is 1654 pixels across. */
const pixelsAcross = (points: number) => Math.round((points * DPI) / POINTS_PER_INCH)
const JPEG_QUALITY = 0.9

async function draw(page: string, type: 'png' | 'jpeg'): Promise<Uint8Array> {
    const url = URL.createObjectURL(new Blob([page], {type: 'image/svg+xml'}))

    try {
        const image = new Image()

        image.src = url
        await image.decode()

        const canvas = document.createElement('canvas')

        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight

        const context = canvas.getContext('2d')

        if (!context) {
            throw new Error("Couldn't draw the page.")
        }

        // On white, as the page is: a JPEG has no see-through parts, and a PNG shouldn't.
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, `image/${type}`, JPEG_QUALITY))

        if (!blob) {
            throw new Error("Couldn't draw the page.")
        }

        return new Uint8Array(await blob.arrayBuffer())
    } finally {
        URL.revokeObjectURL(url)
    }
}

/** Every page as a PNG or JPEG, in order. */
export async function pagePictures(model: PageModel, template: string, type: 'png' | 'jpeg'): Promise<Uint8Array[]> {
    const {svg} = await import('../cv/typst/engine')
    const laidOut = await svg(model, template)
    const width = Number(/data-page-width="([\d.]+)"/.exec(laidOut)?.[1] ?? 595)
    const pictures: Uint8Array[] = []

    for (const page of eachPage(laidOut, pixelsAcross(width))) {
        pictures.push(await draw(page, type))
    }

    return pictures
}
