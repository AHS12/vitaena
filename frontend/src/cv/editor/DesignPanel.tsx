/**
 * How the CV looks: its template, colour, font, size, margins, spacing and paper. Every
 * change is one step to undo, and the pages follow at once.
 */

import {useEffect, useMemo} from 'react'
import {ColourRow} from '../../components/ColourRow'
import {Segmented} from '../../components/Segmented'
import type {Cv, CvDesign} from '../cv'
import {CV_FONTS} from '../fonts'
import {CV_TEMPLATES, TEMPLATE_USE_LABELS} from '../templates/templates'
import {fontUrl} from '../typst/font-urls'
import type {useCvEdit} from '../use-cv-edit'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {useTemplatePreviews} from './use-template-previews'

type Edit = ReturnType<typeof useCvEdit>

const ACCENTS = [
    {name: 'Navy', value: '#1f4e79'},
    {name: 'Teal', value: '#22706d'},
    {name: 'Forest', value: '#2e6b3e'},
    {name: 'Indigo', value: '#3b3b6d'},
    {name: 'Burgundy', value: '#7a1f4b'},
    {name: 'Rust', value: '#8a3b12'},
    {name: 'Graphite', value: '#333333'},
]

const SIZES = [9, 9.5, 10, 10.5, 11].map((size) => ({value: size, label: String(size)}))

/** Each font's regular face, loaded once so its name can be shown in it. */
let facesLoaded = false

function loadFaces() {
    if (facesLoaded || typeof FontFace === 'undefined') {
        return
    }

    facesLoaded = true

    for (const font of CV_FONTS) {
        const face = new FontFace(`vitaena-${font.id}`, `url(${fontUrl(font.files[0])})`)

        void face.load().then((loaded) => document.fonts.add(loaded)).catch(() => undefined)
    }
}

function Group({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <section className="design-group" aria-label={title}>
            <h3 className="design-group__title">{title}</h3>
            {children}
        </section>
    )
}

let silhouette: string | null = null

/**
 * A plain drawn head and shoulders, standing in for a photo in the template pictures
 * of a CV without one, so templates with a photo show where it goes. Never on a CV.
 */
function silhouettePhoto(): string {
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

/** A change to the design, as one step to undo. */
const setter =
    (edit: Edit) =>
    <K extends keyof CvDesign>(key: K, value: CvDesign[K], label: string) =>
        edit.act(label, (current) => ({...current, design: {...current.design, [key]: value}}))

/** The template gallery: the CV in every template. */
export function TemplatesPanel({cv, edit}: {cv: Cv; edit: Edit}) {
    const design = cv.design
    const set = setter(edit)
    // Until a CV has sections with something in them, every template looks nearly blank,
    // so the example's sections stand in, in this CV's style, with your own details when
    // you've filled them in.
    const model = useMemo(() => renderModel(cv), [cv])
    const blank = model.sections.length === 0
    const shown = useMemo(() => {
        if (!blank) {
            return cv
        }

        const example = sampleCv()
        const person = model.name ? cv.person : example.person

        return {...example, person: {...person, photo: cv.person.photo || silhouettePhoto()}, design: cv.design}
    }, [blank, cv, model.name])
    const previews = useTemplatePreviews(shown)

    return (
        <div className="design-panel">
            <Group title="Template">
                {blank ? <p className="design-panel__tip">Shown with example content until your CV has some of its own.</p> : null}
                <div className="template-choices" role="radiogroup" aria-label="Template">
                    {CV_TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            type="button"
                            role="radio"
                            aria-checked={design.template === template.id}
                            className="template-choice"
                            onClick={() => set('template', template.id, 'template')}
                        >
                            <span className="template-choice__picture" aria-hidden="true">
                                {previews[template.id] ? <img src={previews[template.id]} alt="" draggable={false} /> : null}
                            </span>
                            <span className="template-choice__name">
                                {template.name}
                                <span className="template-use" data-use={template.use}>
                                    {TEMPLATE_USE_LABELS[template.use]}
                                </span>
                            </span>
                            <span className="template-choice__about">{template.about}</span>
                            <span className="template-choice__facts">{template.facts}</span>
                        </button>
                    ))}
                </div>
            </Group>
        </div>
    )
}

/** Everything else about the look: colour, font, size and the page. */
export function StylePanel({cv, edit}: {cv: Cv; edit: Edit}) {
    const design = cv.design
    const set = setter(edit)

    useEffect(loadFaces, [])

    return (
        <div className="design-panel">
            <Group title="Colour">
                <ColourRow label="Accent" value={design.accent} presets={ACCENTS} onChange={(accent) => set('accent', accent, 'colour')} />
            </Group>

            <Group title="Font">
                <div className="font-choices" role="radiogroup" aria-label="Font">
                    {CV_FONTS.map((font) => (
                        <button key={font.id} type="button" role="radio" aria-checked={design.font === font.id} className="font-choice" onClick={() => set('font', font.id, 'font')}>
                            <span className="font-choice__name" style={{fontFamily: `vitaena-${font.id}, var(--font-sans)`}}>
                                {font.label}
                            </span>
                            <span className="font-choice__kind">{font.kind}</span>
                        </button>
                    ))}
                </div>
                <div className="design-row">
                    <span className="design-row__label">Size</span>
                    <Segmented label="Text size" value={design.fontSize} options={SIZES} onChange={(size) => set('fontSize', size, 'text size')} />
                </div>
            </Group>

            <Group title="Page">
                <div className="design-row">
                    <span className="design-row__label">Paper</span>
                    <Segmented
                        label="Paper"
                        value={design.paper}
                        options={[
                            {value: 'a4', label: 'A4'},
                            {value: 'us-letter', label: 'US Letter'},
                        ]}
                        onChange={(paper) => set('paper', paper, 'paper')}
                    />
                </div>
                <div className="design-row">
                    <span className="design-row__label">Margins</span>
                    <Segmented
                        label="Margins"
                        value={design.margins}
                        options={[
                            {value: 'narrow', label: 'Narrow'},
                            {value: 'normal', label: 'Normal'},
                            {value: 'wide', label: 'Wide'},
                        ]}
                        onChange={(margins) => set('margins', margins, 'margins')}
                    />
                </div>
                <div className="design-row">
                    <span className="design-row__label">Spacing</span>
                    <Segmented
                        label="Spacing"
                        value={design.spacing}
                        options={[
                            {value: 'compact', label: 'Compact'},
                            {value: 'normal', label: 'Normal'},
                            {value: 'relaxed', label: 'Relaxed'},
                        ]}
                        onChange={(spacing) => set('spacing', spacing, 'spacing')}
                    />
                </div>
                <p className="design-panel__tip">Narrow margins and compact spacing fit more on a page. Most readers prefer one or two pages.</p>
            </Group>
        </div>
    )
}
