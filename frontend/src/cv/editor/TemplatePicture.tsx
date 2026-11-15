/**
 * A template card's picture: the page once it's drawn, and until then a sketch of a page
 * that shimmers, so the gallery has its shape from the first frame instead of blank cards.
 */

/** Line widths of the sketch, in percent: a name, a headline, then paragraphs. */
const LINES = [52, 34, 0, 90, 84, 60, 0, 40, 92, 88, 76, 0, 40, 86, 90, 70]

export function TemplatePicture({src}: {src: string | undefined}) {
    if (src) {
        return <img className="template-picture" src={src} alt="" draggable={false} />
    }

    return (
        <span className="page-sketch" data-testid="template-loading">
            {LINES.map((width, index) =>
                width === 0 ? <span key={index} className="page-sketch__gap" /> : <span key={index} className="page-sketch__line" data-first={index === 0} style={{width: `${width}%`}} />,
            )}
        </span>
    )
}
