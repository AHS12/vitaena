/**
 * The library's picture of a document: its first page, drawn by the same compile as the
 * preview and the PDF, so the library shows what it really looks like.
 */

import type {Cv} from './cv'
import {renderModel} from './render-model'
import type {PageModel} from './typst/images'

/** Wide enough to read the name in a library tile, small enough to save often. */
const WIDTH = 360

/** Where a page sits in Typst's stacked SVG, and its size, in points. */
interface PagePlace {
    readonly top: number
    readonly width: number
    readonly height: number
}

/**
 * Typst's stacked SVG, read as HTML, since it isn't always strict XML, with what a still
 * picture doesn't need taken out, and where each page sits.
 */
function readPages(svgText: string): {svg: SVGSVGElement; pages: PagePlace[]} | null {
    const doc = new DOMParser().parseFromString(svgText, 'text/html')
    const svg = doc.querySelector('svg')

    if (!svg) {
        return null
    }

    // Scripts and the like are for the live preview, not for a still picture.
    svg.querySelectorAll('script, foreignObject').forEach((element) => element.remove())
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const pages = [...svg.querySelectorAll('.typst-page')]
        .map((page) => ({
            top: Number(/translate\(\s*[-\d.]+[\s,]+([-\d.]+)\s*\)/.exec(page.getAttribute('transform') ?? '')?.[1] ?? 0),
            width: Number(page.getAttribute('data-page-width')),
            height: Number(page.getAttribute('data-page-height')),
        }))
        .filter((page) => page.width > 0 && page.height > 0)

    return pages.length > 0 ? {svg, pages} : null
}

/** The stacked SVG cropped to one page, `width` pixels wide, as XML an image can load. */
function cropTo(svg: SVGSVGElement, page: PagePlace, width: number): string {
    svg.setAttribute('viewBox', `0 ${page.top} ${page.width} ${page.height}`)
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(Math.round((width * page.height) / page.width)))

    return new XMLSerializer().serializeToString(svg)
}

/** Keeps only the first page of Typst's stacked SVG, by cropping to its height. */
export function firstPageOnly(svgText: string): string | null {
    const read = readPages(svgText)

    return read ? cropTo(read.svg, read.pages[0], WIDTH) : null
}

/** Every page of Typst's stacked SVG on its own, each `width` pixels wide. */
export function eachPage(svgText: string, width: number): string[] {
    const read = readPages(svgText)

    return read ? read.pages.map((page) => cropTo(read.svg, page, width)) : []
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
