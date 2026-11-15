/**
 * How a document looks: its template, colour, font, size, margins, spacing and paper.
 * Every change is one step to undo, and the pages follow at once. The gallery and the
 * style groups are shared; each type adds what is its own, such as a CV's levels.
 */

import {useEffect, useMemo, type ReactNode} from 'react'
import {ColourRow} from '../../components/ColourRow'
import {Segmented} from '../../components/Segmented'
import type {Cv, CvDesign} from '../cv'
import {CV_FONTS} from '../fonts'
import {CV_TEMPLATES, TEMPLATE_USE_LABELS} from '../templates/templates'
import {fontUrl} from '../typst/font-urls'
import type {DocumentEdit} from '../use-cv-edit'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {silhouettePhoto} from './silhouette'
import {TemplatePicture} from './TemplatePicture'
import {useTemplatePreviews} from './use-template-previews'

type Edit = DocumentEdit<Cv>

/** The CV templates' ids, kept as one array so the gallery's pictures aren't remade. */
const CV_TEMPLATE_IDS = CV_TEMPLATES.map((template) => template.id)

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

export function Group({title, children}: {title: string; children: ReactNode}) {
    return (
        <section className="design-group" aria-label={title}>
            <h3 className="design-group__title">{title}</h3>
            {children}
        </section>
    )
}

/** A change to the design, as one step to undo. */
const setter =
    (edit: Edit) =>
    <K extends keyof CvDesign>(key: K, value: CvDesign[K], label: string) =>
        edit.act(label, (current) => ({...current, design: {...current.design, [key]: value}}))

export interface GalleryTemplate {
    readonly id: string
    readonly name: string
    readonly about: string
    readonly facts: string
    /** A word on what it's for, such as "Resume", drawn beside its name. */
    readonly badge?: {readonly use: string; readonly label: string}
}

/** Every template a document can use, each drawn with the document in it. */
export function TemplateGallery({
    templates,
    previews,
    value,
    tip,
    onPick,
}: {
    templates: readonly GalleryTemplate[]
    previews: Readonly<Record<string, string>>
    value: string
    tip: string | null
    onPick(id: string): void
}) {
    return (
        <div className="design-panel">
            <Group title="Template">
                {tip ? <p className="design-panel__tip">{tip}</p> : null}
                <div className="template-choices" role="radiogroup" aria-label="Template">
                    {templates.map((template) => (
                        <button key={template.id} type="button" role="radio" aria-checked={value === template.id} className="template-choice" onClick={() => onPick(template.id)}>
                            <span className="template-choice__picture" aria-hidden="true">
                                <TemplatePicture src={previews[template.id]} />
                            </span>
                            <span className="template-choice__name">
                                {template.name}
                                {template.badge ? (
                                    <span className="template-use" data-use={template.badge.use}>
                                        {template.badge.label}
                                    </span>
                                ) : null}
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

const CV_GALLERY: readonly GalleryTemplate[] = CV_TEMPLATES.map((template) => ({...template, badge: {use: template.use, label: TEMPLATE_USE_LABELS[template.use]}}))

/** The template gallery: the CV in every template. */
export function TemplatesPanel({cv, edit}: {cv: Cv; edit: Edit}) {
    const set = setter(edit)
    // Until a CV has sections with something in them, every template looks nearly blank,
    // so the example's sections stand in, in this CV's style, with your own details when
    // you've filled them in.
    const model = useMemo(() => renderModel(cv), [cv])
    const blank = model.sections.length === 0
    const shown = useMemo(() => {
        if (!blank) {
            return model
        }

        const example = sampleCv()
        const person = model.name ? cv.person : example.person

        return renderModel({...example, person: {...person, photo: cv.person.photo || silhouettePhoto()}, design: cv.design})
    }, [blank, cv, model])
    const previews = useTemplatePreviews(shown, CV_TEMPLATE_IDS, 900)

    return (
        <TemplateGallery
            templates={CV_GALLERY}
            previews={previews}
            value={cv.design.template}
            tip={blank ? 'Shown with example content until your CV has some of its own.' : null}
            onPick={(id) => set('template', id, 'template')}
        />
    )
}

/** The look every type shares, as a type's design holds it. */
export interface SharedStyle {
    readonly accent: string
    readonly font: string
    readonly fontSize: number
    readonly paper: 'a4' | 'us-letter'
    readonly margins: 'narrow' | 'normal' | 'wide'
    readonly spacing: 'compact' | 'normal' | 'relaxed'
}

/** Colour, font, size and the page, for any type; `children` adds the type's own groups. */
export function StyleGroups({design, set, children}: {design: SharedStyle; set<K extends keyof SharedStyle>(key: K, value: SharedStyle[K], label: string): void; children?: ReactNode}) {
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
            {children}
        </div>
    )
}

/** Everything else about the look: colour, font, size and the page. */
export function StylePanel({cv, edit}: {cv: Cv; edit: Edit}) {
    const design = cv.design
    const set = setter(edit)
    // Only worth asking about once some list shows levels.
    const hasLevels = cv.sections.some((section) => section.kind === 'tags' && section.groups.some((group) => group.showLevels))

    return (
        <StyleGroups design={design} set={set}>
            {hasLevels ? (
                <Group title="Levels">
                    <div className="design-row">
                        <span className="design-row__label">Draw as</span>
                        <Segmented
                            label="Draw levels as"
                            value={design.levelStyle}
                            options={[
                                {value: 'template', label: 'Template'},
                                {value: 'dots', label: 'Dots'},
                                {value: 'bar', label: 'Bar'},
                                {value: 'squares', label: 'Squares'},
                            ]}
                            onChange={(levelStyle) => set('levelStyle', levelStyle, 'level style')}
                        />
                    </div>
                    <p className="design-panel__tip">Template leaves it to each template: dots in most, a bar in Modern, Sidebar and Timeline, squares in Bold.</p>
                </Group>
            ) : null}
        </StyleGroups>
    )
}
