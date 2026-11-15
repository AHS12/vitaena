/**
 * The photo in a PDF CV: which of the pictures on the first page it is.
 *
 * A PDF draws a picture by stretching a unit square through the current transform, so
 * its size on the page comes from following the transforms to it. A photo is the largest
 * picture that is photo-sized and near square; icons are smaller, and a background
 * covers half the page or more.
 */

/** A picture as drawn, in points: pdf.js's object id for it, and where and how big. */
export interface PicturePlacement {
    readonly id: string
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
}

/** The pixels of a picture, as pdf.js decodes it: a bitmap in a browser, bytes elsewhere. */
export interface PdfPhoto {
    readonly width: number
    readonly height: number
    readonly bitmap?: ImageBitmap
    /** RGBA, four bytes a pixel. */
    readonly rgba?: Uint8ClampedArray
}

/** The operator numbers pdf.js uses, as `OPS` names them. */
export interface Operators {
    readonly save: number
    readonly restore: number
    readonly transform: number
    readonly paintFormXObjectBegin: number
    readonly paintFormXObjectEnd: number
    readonly paintImageXObject: number
    readonly paintImageXObjectRepeat: number
}

type Matrix = readonly [number, number, number, number, number, number]

/** `m` applied before the current transform, as a PDF's cm operator does. */
function concat(current: Matrix, m: Matrix): Matrix {
    return [
        m[0] * current[0] + m[1] * current[2],
        m[0] * current[1] + m[1] * current[3],
        m[2] * current[0] + m[3] * current[2],
        m[2] * current[1] + m[3] * current[3],
        m[4] * current[0] + m[5] * current[2] + current[4],
        m[4] * current[1] + m[5] * current[3] + current[5],
    ]
}

/** Every picture a page's drawing paints, with its size on the page. */
export function picturePlacements(fnArray: readonly number[], argsArray: readonly unknown[], ops: Operators): PicturePlacement[] {
    const placements: PicturePlacement[] = []
    const stack: Matrix[] = []
    let current: Matrix = [1, 0, 0, 1, 0, 0]

    fnArray.forEach((op, index) => {
        const args = argsArray[index] as unknown[] | null

        if (op === ops.save) {
            stack.push(current)
        } else if (op === ops.restore) {
            current = stack.pop() ?? current
        } else if (op === ops.transform && args) {
            current = concat(current, args as unknown as Matrix)
        } else if (op === ops.paintFormXObjectBegin) {
            stack.push(current)

            const matrix = args?.[0]

            if (Array.isArray(matrix) && matrix.length === 6) {
                current = concat(current, matrix as unknown as Matrix)
            }
        } else if (op === ops.paintFormXObjectEnd) {
            current = stack.pop() ?? current
        } else if ((op === ops.paintImageXObject || op === ops.paintImageXObjectRepeat) && typeof args?.[0] === 'string') {
            placements.push({id: args[0], x: current[4], y: current[5], width: Math.hypot(current[0], current[1]), height: Math.hypot(current[2], current[3])})
        }
    })

    return placements
}

/** A photo prints at least half an inch across. */
const SMALLEST = 36

/** Which picture is the photo, or null when none looks like one. */
export function photoPlacement(placements: readonly PicturePlacement[], pageWidth: number): PicturePlacement | null {
    const photos = placements.filter(({width, height}) => {
        const shape = width / height

        return width >= SMALLEST && height >= SMALLEST && width <= pageWidth * 0.5 && shape >= 0.6 && shape <= 1.7
    })

    return photos.reduce<PicturePlacement | null>((best, photo) => (!best || photo.width * photo.height > best.width * best.height ? photo : best), null)
}

/** pdf.js's ImageKind numbers for the pixel layouts a photo comes in. */
const RGB = 2
const RGBA = 3

/**
 * A decoded picture from pdf.js as a photo, or null for a layout a photo doesn't use.
 * In a browser pdf.js hands over a bitmap; elsewhere, bytes.
 */
export function photoFrom(image: unknown): PdfPhoto | null {
    const {width, height, bitmap, kind, data} = (image ?? {}) as {width?: number; height?: number; bitmap?: ImageBitmap; kind?: number; data?: Uint8Array | Uint8ClampedArray}

    if (!width || !height) {
        return null
    }

    if (bitmap) {
        return {width, height, bitmap}
    }

    if (data && kind === RGBA && data.length >= width * height * 4) {
        return {width, height, rgba: new Uint8ClampedArray(data.buffer, data.byteOffset, width * height * 4)}
    }

    if (data && kind === RGB && data.length >= width * height * 3) {
        const rgba = new Uint8ClampedArray(width * height * 4)

        for (let pixel = 0; pixel < width * height; pixel += 1) {
            rgba.set(data.subarray(pixel * 3, pixel * 3 + 3), pixel * 4)
            rgba[pixel * 4 + 3] = 255
        }

        return {width, height, rgba}
    }

    return null
}
