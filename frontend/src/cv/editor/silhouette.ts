let silhouette: string | null = null

/**
 * A plain drawn head and shoulders, standing in for a photo in the template pictures
 * of a document without one, so templates with a photo show where it goes. Never saved.
 */
export function silhouettePhoto(): string {
    if (silhouette !== null) {
        return silhouette
    }

    const canvas = document.createElement('canvas')

    canvas.width = 200
    canvas.height = 200

    const context = canvas.getContext('2d')

    if (!context) {
        return (silhouette = '')
    }

    context.fillStyle = '#c9d6e3'
    context.fillRect(0, 0, 200, 200)
    context.fillStyle = '#8aa1b8'
    context.beginPath()
    context.arc(100, 78, 38, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.ellipse(100, 200, 70, 70, 0, Math.PI, 0)
    context.fill()

    return (silhouette = canvas.toDataURL('image/png'))
}
