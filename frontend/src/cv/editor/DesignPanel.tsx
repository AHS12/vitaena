/**
 * How a document looks: its template, colour, font, size, margins, spacing and paper.
 * Every change is one step to undo, and the pages follow at once. The gallery and the
 * style groups are shared; each type adds what is its own, such as a CV's levels.
 */

import {useEffect, useMemo, type ReactNode} from 'react'
import {ColourRow} from '../../components/ColourRow'
import {Segmented} from '../../components/Segmented'
import type {Cv, CvDesign} from '../cv'
import {LANGUAGES, languageInfo, type DocumentLanguage} from '../../core/labels/labels'
import {CV_FONTS, isAddedFont, addedFamily, SCRIPT_FONTS, scriptsIn} from '../fonts'
import {addedFamilies, previewFamily, previewFont, useAddedFonts} from '../added-fonts'
import {Plus} from 'lucide-react'
import {CV_TEMPLATES, TEMPLATE_USE_LABELS} from '../templates/templates'
import {fontUrl} from '../typst/font-urls'
import type {DocumentEdit} from '../use-cv-edit'
import {inLanguage} from '../relabel'
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

    for (const font of [...CV_FONTS, ...SCRIPT_FONTS]) {
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

        const example = sampleCv(cv.design.language)
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
    readonly language: DocumentLanguage
    readonly digits: 'latin' | 'native'
    readonly scriptFont: string
}

/** "Add a font…": a .ttf or .otf file of the person's own, kept in the app for every document. */
function AddFontButton() {
    const add = useAddedFonts((state) => state.add)

    return (
        <button type="button" className="button add-font" onClick={() => void add()}>
            <Plus size={13} aria-hidden="true" />
            Add a font…
        </button>
    )
}

/** What adding a font found, or why it wasn't added. */
function FontMessage({text, ok}: {text: string; ok: boolean}) {
    const dismiss = useAddedFonts((state) => state.dismiss)

    return (
        <div className={`font-message${ok ? '' : ' font-message--refused'}`} role="status">
            <p className="font-message__text">{text}</p>
            <button type="button" className="button font-message__close" onClick={dismiss}>
                Got it
            </button>
        </div>
    )
}

/** A line of Bangla to show each Bangla font in. */
const BANGLA_SAMPLE = 'আমার নাম'

/**
 * Colour, font, size and the page, for any type; `children` adds the type's own groups.
 * Changing the language goes through `onLanguage`, since it changes headings as well.
 * `hasBangla` says the document has Bangla letters, so the font for them is worth choosing.
 */
export function StyleGroups({
    design,
    set,
    onLanguage,
    hasBangla,
    children,
}: {
    design: SharedStyle
    set<K extends keyof SharedStyle>(key: K, value: SharedStyle[K], label: string): void
    onLanguage(language: DocumentLanguage): void
    hasBangla: boolean
    children?: ReactNode
}) {
    useEffect(loadFaces, [])

    const language = languageInfo(design.language)
    const added = useAddedFonts((state) => state.fonts)
    const message = useAddedFonts((state) => state.message)
    const families = useMemo(() => addedFamilies(added), [added])
    const latinFamilies = families.filter((family) => family.scripts.includes('latin'))
    const banglaFamilies = families.filter((family) => family.scripts.includes('bengali'))
    const showBanglaFont = hasBangla || design.language === 'bn' || isAddedFont(design.scriptFont)

    useEffect(() => families.forEach((family) => previewFont(family.files[0])), [families])

    // A font named by the document but not added on this computer: say so, and keep the name.
    const missing = [design.font, design.scriptFont].filter((id) => isAddedFont(id) && !families.some((family) => family.id === id)).map(addedFamily)

    return (
        <div className="design-panel">
            <Group title="Language">
                <div className="design-row">
                    <span className="design-row__label">Write in</span>
                    <Segmented label="Write in" value={design.language} options={LANGUAGES.map((info) => ({value: info.id, label: info.own}))} onChange={onLanguage} />
                </div>
                {language.digits ? (
                    <div className="design-row">
                        <span className="design-row__label">Numbers</span>
                        <Segmented
                            label="Numbers"
                            value={design.digits}
                            options={[
                                {value: 'native', label: language.digits.slice(1, 4)},
                                {value: 'latin', label: '123'},
                            ]}
                            onChange={(digits) => set('digits', digits, 'numbers')}
                        />
                    </div>
                ) : null}
                <p className="design-panel__tip">
                    {language.id === 'en'
                        ? 'The headings, labels and dates Vitaena writes. Your own words stay as you wrote them.'
                        : `Headings, labels, dates and "${language.id === 'bn' ? 'বর্তমান' : 'Present'}" are written in ${language.name}. Headings you wrote yourself stay as they are.`}
                </p>
            </Group>

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
                    {latinFamilies.map((family) => (
                        <button key={family.id} type="button" role="radio" aria-checked={design.font === family.id} className="font-choice" onClick={() => set('font', family.id, 'font')}>
                            <span className="font-choice__name" style={{fontFamily: `${previewFamily(family.files[0])}, var(--font-sans)`}}>
                                {family.family}
                            </span>
                            <span className="font-choice__kind">Your font</span>
                        </button>
                    ))}
                </div>
                <AddFontButton />
                {message ? <FontMessage text={message.text} ok={message.ok} /> : null}
                {missing.length > 0 ? (
                    <p className="design-panel__tip design-panel__tip--warning">
                        {missing.join(' and ')} {missing.length === 1 ? "isn't" : "aren't"} added on this computer, so a bundled font is used. Add {missing.length === 1 ? 'it' : 'them'} here to bring the look back.
                    </p>
                ) : null}
                <div className="design-row">
                    <span className="design-row__label">Size</span>
                    <Segmented label="Text size" value={design.fontSize} options={SIZES} onChange={(size) => set('fontSize', size, 'text size')} />
                </div>
                {showBanglaFont ? (
                    <>
                        <h4 className="design-group__subtitle">Bangla text in</h4>
                        <div className="font-choices" role="radiogroup" aria-label="Bangla text in">
                            <button type="button" role="radio" aria-checked={design.scriptFont === ''} className="font-choice" onClick={() => set('scriptFont', '', 'Bangla font')}>
                                <span className="font-choice__name">Matching</span>
                                <span className="font-choice__kind">Noto, sans or serif to suit</span>
                            </button>
                            {SCRIPT_FONTS.filter((font) => font.script === 'bengali').map((font) => (
                                <button key={font.id} type="button" role="radio" aria-checked={design.scriptFont === font.id} className="font-choice" onClick={() => set('scriptFont', font.id, 'Bangla font')}>
                                    <span className="font-choice__name" style={{fontFamily: `vitaena-${font.id}, var(--font-sans)`}}>
                                        {BANGLA_SAMPLE}
                                    </span>
                                    <span className="font-choice__kind">
                                        {font.label} · {font.kind}
                                    </span>
                                </button>
                            ))}
                            {banglaFamilies.map((family) => (
                                <button key={family.id} type="button" role="radio" aria-checked={design.scriptFont === family.id} className="font-choice" onClick={() => set('scriptFont', family.id, 'Bangla font')}>
                                    <span className="font-choice__name" style={{fontFamily: `${previewFamily(family.files[0])}, var(--font-sans)`}}>
                                        {BANGLA_SAMPLE}
                                    </span>
                                    <span className="font-choice__kind">{family.family} · Your font</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : null}
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
    const hasBangla = useMemo(() => scriptsIn(JSON.stringify([cv.person, cv.sections])).includes('bengali'), [cv.person, cv.sections])
    const onLanguage = (language: DocumentLanguage) => edit.act(`write in ${languageInfo(language).name}`, (current) => inLanguage(current, language))

    return (
        <StyleGroups design={design} set={set} onLanguage={onLanguage} hasBangla={hasBangla}>
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
