/**
 * The library's picture of a document: its first page, drawn by the same compile as the
 * preview and the PDF, so the library shows what it really looks like.
 */

import type {Cv} from './cv'
import {renderModel} from './render-model'
import type {PageModel} from './typst/images'

/** Wide enough to read the name in a library tile, small enough to save often. */
const WIDTH = 360

/** Keeps only the first page of Typst's stacked SVG, by cropping to its height. */
export function firstPageOnly(svgText: string): string | null {
    // Typst's SVG is made for HTML and isn't always strict XML, so it's read as HTML and
    // written back out as XML, which an image can load.
    const doc = new DOMParser().parseFromString(svgText, 'text/html')
    const svg = doc.querySelector('svg')
    const page = svg?.querySelector('.typst-page')
    const width = Number(page?.getAttribute('data-page-width'))
    const height = Number(page?.getAttribute('data-page-height'))

    if (!svg || !page || !width || !height) {
        return null
    }

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.setAttribute('width', String(WIDTH))
    svg.setAttribute('height', String(Math.round((WIDTH * height) / width)))
    // Scripts and the like are for the live preview, not for a still picture.
    svg.querySelectorAll('script, foreignObject').forEach((element) => element.remove())
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    return new XMLSerializer().serializeToString(svg)
}

export const cvThumbnail = (cv: Cv): Promise<string | null> => pageThumbnail(renderModel(cv), cv.design.template)

/** Any document's first page, in the template given, as a small PNG. */
export async function pageThumbnail(model: PageModel, template: string): Promise<string | null> {
    const {svg} = await import('./typst/engine')
    const page = firstPageOnly(await svg(model, template))

    if (!page) {
        return null
    }

    const url = URL.createObjectURL(new Blob([page], {type: 'image/svg+xml'}))

    try {
        const image = new Image()

        image.src = url
        await image.decode()

        const canvas = document.createElement('canvas')

        canvas.width = image.naturalWidth || WIDTH
        canvas.height = image.naturalHeight || Math.round(WIDTH * 1.414)

        const context = canvas.getContext('2d')

        if (!context) {
            return null
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)
        return canvas.toDataURL('image/png')
    } finally {
        URL.revokeObjectURL(url)
    }
}
