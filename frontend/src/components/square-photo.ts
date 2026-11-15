/** A photo as the app keeps one: a centred square JPEG, small enough to save often. */

/** Big enough to print sharp at photo size, small enough to save often. */
const SIZE = 400

/** Any picture, as a centred square JPEG data URL. */
export function squarePhoto(source: CanvasImageSource, width: number, height: number): string {
    const side = Math.min(width, height)
    const canvas = document.createElement('canvas')

    canvas.width = SIZE
    canvas.height = SIZE

    const context = canvas.getContext('2d')

    if (!context) {
        throw new Error("Couldn't read that picture.")
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, SIZE, SIZE)
    context.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, SIZE, SIZE)

    return canvas.toDataURL('image/jpeg', 0.86)
}

/** A picked file as a centred square JPEG data URL. */
export async function squarePhotoOf(file: Blob): Promise<string> {
    const bitmap = await createImageBitmap(file)

    try {
        return squarePhoto(bitmap, bitmap.width, bitmap.height)
    } finally {
        bitmap.close()
    }
}
