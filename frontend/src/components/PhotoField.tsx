/**
 * A picture for a document: pick an image, and it's made small enough to keep inside the
 * file. A photo is cut to a centred square and shown round, as most templates use it; a
 * whole picture, such as a full-length photo, keeps its own shape.
 */

import {ImagePlus, Trash2} from 'lucide-react'
import {useId, useRef, useState} from 'react'
import {squarePhotoOf} from './square-photo'

/**
 * The image in its own shape, its longest side at most `longest` pixels. A PNG keeps
 * see-through parts, as a drawn symbol may have; a JPEG is laid on white.
 */
async function wholePicture(file: Blob, longest: number, format: 'png' | 'jpeg'): Promise<string> {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, longest / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')

    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const context = canvas.getContext('2d')

    if (!context) {
        throw new Error("Couldn't read that picture.")
    }

    if (format === 'jpeg') {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    return format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86)
}

/** How a picture is kept: cut to a square photo, or whole, at most so many pixels long, as PNG or JPEG. */
export type PictureShape = {readonly kind: 'square'} | {readonly kind: 'whole'; readonly longest: number; readonly format: 'png' | 'jpeg'}

const SQUARE: PictureShape = {kind: 'square'}
const PHOTO_HINT = 'Shown by templates with a photo, such as Professional. Often left out for jobs in the US and UK.'

export function PhotoField({
    label,
    value,
    onChange,
    shape = SQUARE,
    hint = PHOTO_HINT,
    noun = 'photo',
}: {
    label: string
    value: string
    onChange(value: string): void
    shape?: PictureShape
    hint?: string
    /** What it's called on its buttons: "photo" or "picture". */
    noun?: string
}) {
    const id = useId()
    const input = useRef<HTMLInputElement>(null)
    const [problem, setProblem] = useState<string | null>(null)

    return (
        <div className="form-field photo-field" data-shape={shape.kind}>
            <span className="form-field__label">{label}</span>
            <div className="photo-field__row">
                <button type="button" className="photo-field__picture" aria-label={value ? `Change the ${noun}` : `Add a ${noun}`} onClick={() => input.current?.click()}>
                    {value ? <img src={value} alt="" /> : <ImagePlus size={20} aria-hidden="true" />}
                </button>
                <div className="photo-field__actions">
                    <button type="button" className="button" onClick={() => input.current?.click()}>
                        {value ? 'Change…' : `Add a ${noun}…`}
                    </button>
                    {value ? (
                        <button type="button" className="text-button" onClick={() => onChange('')}>
                            <Trash2 size={12} aria-hidden="true" />
                            Remove
                        </button>
                    ) : null}
                </div>
                <input
                    ref={input}
                    id={id}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(event) => {
                        const file = event.target.files?.[0]

                        event.target.value = ''

                        if (!file) {
                            return
                        }

                        const picture = shape.kind === 'square' ? squarePhotoOf(file) : wholePicture(file, shape.longest, shape.format)

                        setProblem(null)
                        picture
                            .then(onChange)
                            .catch(() => setProblem("Couldn't read that picture. Try a JPEG or PNG."))
                    }}
                />
            </div>
            {problem ? (
                <span className="form-field__warning" role="status">
                    {problem}
                </span>
            ) : (
                <span className="form-field__hint">{hint}</span>
            )}
        </div>
    )
}
