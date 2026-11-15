/**
 * A photo for a document: pick an image, and it's cut to a centred square and made
 * small enough to keep inside the file. Shown round, as most templates use it.
 */

import {ImagePlus, Trash2} from 'lucide-react'
import {useId, useRef, useState} from 'react'

/** Big enough to print sharp at photo size, small enough to save often. */
const SIZE = 400

/** The image as a centred square JPEG data URL. */
async function squarePhoto(file: Blob): Promise<string> {
    const bitmap = await createImageBitmap(file)
    const side = Math.min(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')

    canvas.width = SIZE
    canvas.height = SIZE

    const context = canvas.getContext('2d')

    if (!context) {
        throw new Error("Couldn't read that picture.")
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, SIZE, SIZE)
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
    bitmap.close()

    return canvas.toDataURL('image/jpeg', 0.86)
}

export function PhotoField({label, value, onChange}: {label: string; value: string; onChange(value: string): void}) {
    const id = useId()
    const input = useRef<HTMLInputElement>(null)
    const [problem, setProblem] = useState<string | null>(null)

    return (
        <div className="form-field photo-field">
            <span className="form-field__label">{label}</span>
            <div className="photo-field__row">
                <button type="button" className="photo-field__picture" aria-label={value ? 'Change the photo' : 'Add a photo'} onClick={() => input.current?.click()}>
                    {value ? <img src={value} alt="" /> : <ImagePlus size={20} aria-hidden="true" />}
                </button>
                <div className="photo-field__actions">
                    <button type="button" className="button" onClick={() => input.current?.click()}>
                        {value ? 'Change…' : 'Add a photo…'}
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

                        setProblem(null)
                        squarePhoto(file)
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
                <span className="form-field__hint">Shown by templates with a photo, such as Professional. Often left out for jobs in the US and UK.</span>
            )}
        </div>
    )
}
