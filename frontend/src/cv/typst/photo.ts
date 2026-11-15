/**
 * The photo travels to Typst as a file beside the template, not inside the JSON, so a
 * template writes image(cv.photo) and the data stays out of the text it reads.
 */

import type {RenderModel} from '../render-model'

export interface PhotoFile {
    readonly path: string
    readonly bytes: Uint8Array
}

/** The model as a template reads it, with the photo replaced by a file path, and that file. */
export function withPhotoFile(model: RenderModel): {model: RenderModel; file: PhotoFile | null} {
    const match = /^data:image\/(jpeg|png);base64,(.+)$/.exec(model.photo)

    if (!match) {
        return {model: {...model, photo: ''}, file: null}
    }

    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }

    const path = `/photo.${match[1] === 'png' ? 'png' : 'jpg'}`

    return {model: {...model, photo: path}, file: {path, bytes}}
}
