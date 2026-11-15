/**
 * Pictures travel to Typst as files beside the template, not inside the JSON, so a
 * template writes image(cv.photo) and the data stays out of the text it reads.
 *
 * Any document's render model may carry them: a CV its photo, a biodata its photo, a
 * full-length photo and a small heading image.
 */

/** What every render model is to the layout engine: data a template reads as JSON. */
export type PageModel = object

export interface ImageFile {
    readonly path: string
    readonly bytes: Uint8Array
}

/** The top-level fields a render model may hold a picture in, as a data URL. */
const IMAGE_FIELDS = ['photo', 'fullPhoto', 'headingImage'] as const

function bytesOf(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }

    return bytes
}

/** The model as a template reads it, with each picture replaced by a file path, and those files. */
export function withImageFiles<M extends PageModel>(model: M): {model: M; files: ImageFile[]} {
    const readable = {...model} as Record<string, unknown>
    const files: ImageFile[] = []

    for (const field of IMAGE_FIELDS) {
        const value = readable[field]

        if (typeof value !== 'string') {
            continue
        }

        const match = /^data:image\/(jpeg|png);base64,(.+)$/.exec(value)

        if (!match) {
            readable[field] = ''
            continue
        }

        const path = `/${field}.${match[1] === 'png' ? 'png' : 'jpg'}`

        readable[field] = path
        files.push({path, bytes: bytesOf(match[2])})
    }

    return {model: readable as M, files}
}
