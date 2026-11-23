/**
 * How a document looks: its template, colour, font, size, margins, spacing and paper.
 * Every change is one step to undo, and the pages follow at once. The gallery and the
 * style groups are shared; each type adds what is its own, such as a CV's levels.
 */

import {useEffect, useMemo, type ReactNode} from 'react'
import {ColourRow} from '../../components/ColourRow'
import {Segmented} from '../../components/Segmented'
import {Select} from '../../components/controls'
import type {Cv, CvDesign} from '../cv'
import {LANGUAGES, labelsFor, languageInfo, type DocumentLanguage} from '../../core/labels/labels'
import {CV_FONTS, isAddedFont, addedFamily, fontById, SCRIPT_FONTS, scriptFontById, scriptFontFor, scriptsIn, type CvFont, type Script, type ScriptFont} from '../fonts'
import {addedFamilies, previewFamily, previewFont, useAddedFonts} from '../added-fonts'
import {isInstalled, languageChoiceWithPack, packToGet, useFontPacks} from '../downloaded-fonts'
import {packOfFont, type FontPack} from '../font-packs'
import {FontPackNotice} from '../FontPackNotice'
import {Plus} from 'lucide-react'
import {CV_TEMPLATES, TEMPLATE_USE_LABELS} from '../templates/templates'
import {fontUrl} from '../typst/font-urls'
import type {DocumentEdit} from '../use-cv-edit'
import {inLanguage} from '../relabel'
import {monthText, renderModel} from '../render-model'
import {COUNTRIES, countryOf, factsFor, forCountry, templatesFor, type CountryId, type DateStyle} from '../countries'
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

const loadedFaces = new Set<string>()

/** A font's regular face, under its own name, so a choice can show its name in it. */
function loadFace(font: CvFont) {
    if (loadedFaces.has(font.id) || typeof FontFace === 'undefined') {
        return
    }

    loadedFaces.add(font.id)

    const face = new FontFace(`vitaena-${font.id}`, `url(${fontUrl(font.files[0])})`)

    // One that isn't downloaded yet is tried again once it is.
    void face
        .load()
        .then((loaded) => document.fonts.add(loaded))
        .catch(() => loadedFaces.delete(font.id))
}

/** The Latin fonts and the small script ones at once; Chinese, Japanese and Korean, megabytes each, only once their choices are shown. */
function loadFaces() {
    for (const font of [...CV_FONTS, ...SCRIPT_FONTS.filter((font) => font.script !== 'cjk' && font.script !== 'hangul')]) {
        loadFace(font)
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
    suited = 0,
}: {
    templates: readonly GalleryTemplate[]
    previews: Readonly<Record<string, string>>
    value: string
    tip: string | null
    onPick(id: string): void
    /** How many of the first templates suit where the document is for; a line sets them apart. */
    suited?: number
}) {
    return (
        <div className="design-panel">
            <Group title="Template">
                {tip ? <p className="design-panel__tip">{tip}</p> : null}
                <div className="template-choices" role="radiogroup" aria-label="Template">
                    {templates.map((template, index) => [
                        suited > 0 && index === suited ? (
                            <p key="divider" className="template-divider">
                                Other templates
                            </p>
                        ) : null,
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
                        </button>,
                    ])}
                </div>
            </Group>
        </div>
    )
}

const CV_GALLERY: readonly GalleryTemplate[] = CV_TEMPLATES.map((template) => ({...template, badge: {use: template.use, label: TEMPLATE_USE_LABELS[template.use]}}))

/** The gallery for a place: the templates that suit it first, the rest after, none hidden. */
function galleryFor(country: string): readonly GalleryTemplate[] {
    const {suited, rest} = templatesFor(CV_TEMPLATE_IDS, country)

    return [...suited, ...rest].map((id) => CV_GALLERY.find((template) => template.id === id)!).map((template) => ({...template, facts: factsFor(template.facts, template.id, country)}))
}

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

    const country = countryOf(cv.design.country)
    const templates = useMemo(() => galleryFor(country.id), [country.id])
    const tips = [country.id !== 'any' ? `For ${country.name}, the first ${templatesFor(CV_TEMPLATE_IDS, country.id).suited.length} suit best. ${country.why}` : '', blank ? 'Shown with example content until your CV has some of its own.' : ''].filter(Boolean)

    return (
        <TemplateGallery
            templates={templates}
            previews={previews}
            value={cv.design.template}
            tip={tips.length > 0 ? tips.join(' ') : null}
            suited={templatesFor(CV_TEMPLATE_IDS, country.id).suited.length}
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
/** The fonts Style offers for a script: those for every language, and the document language's own. */
const scriptChoices = (script: Script, language: string): ScriptFont[] => SCRIPT_FONTS.filter((font) => font.script === script && (!font.languages || font.languages.includes(language)))

/** A few words in each script, to show a font for it in. */
const SAMPLES: Readonly<Record<Script, string>> = {bengali: 'আমার নাম', devanagari: 'मेरा नाम', arabic: 'اسمي', cjk: '私の名前', hangul: '내 이름'}

const SCRIPT_TITLES: Readonly<Record<Script, string>> = {bengali: 'Bangla', devanagari: 'Hindi', arabic: 'Arabic', cjk: 'Chinese and Japanese', hangul: 'Korean'}

/**
 * The script whose font Style offers a choice for: the document language's own, else the
 * first one in the text that has fonts to choose from, else the chosen font's.
 */
function choiceScript(language: string, scripts: readonly Script[], scriptFont: string, added: readonly {id: string; scripts: readonly string[]}[]): Script | null {
    const choosable = (script: Script) => scriptChoices(script, language).some((font) => !font.fallback) || added.some((family) => family.scripts.includes(script))
    const own = languageInfo(language).script
    const chosen = scriptFontById(scriptFont)?.script ?? (added.find((family) => family.id === scriptFont)?.scripts.find((script) => script !== 'latin') as Script | undefined)
    // A font the person added that isn't on this computer still shows, so it can be changed.
    const named = isAddedFont(scriptFont) ? (chosen ?? own ?? 'bengali') : null

    return [own, ...scripts, chosen].find((script): script is Script => script !== undefined && choosable(script)) ?? named
}

/**
 * Colour, font, size and the page, for any type; `children` adds the type's own groups.
 * Changing the language goes through `onLanguage`, since it changes headings as well.
 * `scripts` are the scripts the document has letters in, so a font for them is worth choosing.
 */
export function StyleGroups({
    design,
    set,
    onLanguage,
    scripts,
    before,
    children,
}: {
    design: SharedStyle
    set<K extends keyof SharedStyle>(key: K, value: SharedStyle[K], label: string): void
    onLanguage(language: DocumentLanguage): void
    scripts: readonly Script[]
    /** Groups of the type's own that come first, such as where a CV is for. */
    before?: ReactNode
    children?: ReactNode
}) {
    useEffect(loadFaces, [])

    const language = languageInfo(design.language)
    const added = useAddedFonts((state) => state.fonts)
    const message = useAddedFonts((state) => state.message)
    const families = useMemo(() => addedFamilies(added), [added])
    const latinFamilies = families.filter((family) => family.scripts.includes('latin'))
    const script = choiceScript(design.language, scripts, design.scriptFont, families)
    const scriptFamilies = script ? families.filter((family) => family.scripts.includes(script)) : []
    // Named for the document's language when it's written in this script: "Persian text in".
    const scriptTitle = script ? `${language.script === script ? language.name : SCRIPT_TITLES[script]} text in` : ''
    const matching = script ? scriptFontFor(script, fontById(design.font).kind, design.language) : null

    const scriptLabel = script ? `${SCRIPT_TITLES[script]} font` : ''
    // Fonts in a pack that isn't downloaded aren't offered; the pack is, instead.
    const packs = useFontPacks((state) => state.packs)
    const allChoices = useMemo(() => (script ? scriptChoices(script, design.language) : []), [script, design.language])
    const choices = useMemo(
        () =>
            allChoices.filter((font) => {
                const pack = packOfFont(font)

                return !pack || isInstalled(packs, pack.id)
            }),
        [allChoices, packs],
    )
    // The language's own fonts are asked for under Write in, so they aren't asked for twice.
    const languagePack = packToGet(packs, design.language)
    const packsToGet = [...new Set(allChoices.map(packOfFont))].filter((pack): pack is FontPack => pack !== undefined && pack !== languagePack && !isInstalled(packs, pack.id))
    useEffect(() => choices.forEach(loadFace), [choices])

    useEffect(() => families.forEach((family) => previewFont(family.files[0])), [families])

    // A font named by the document but not added on this computer: say so, and keep the name.
    const missing = [design.font, design.scriptFont].filter((id) => isAddedFont(id) && !families.some((family) => family.id === id)).map(addedFamily)

    return (
        <div className="design-panel">
            {before}
            <Group title="Language">
                <div className="design-row">
                    <span className="design-row__label">Write in</span>
                    <Select<DocumentLanguage> label="Write in" value={design.language} options={LANGUAGES.map((info) => languageChoiceWithPack(info, packs))} onChange={onLanguage} />
                </div>
                {languagePack ? <FontPackNotice wanted={[languagePack]} forLanguage /> : null}
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
                        : `Headings, labels, dates and "${labelsFor(language.id).page.present}" are written in ${language.name}. Headings you wrote yourself stay as they are.`}
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
                {script ? (
                    <>
                        <h4 className="design-group__subtitle">{scriptTitle}</h4>
                        <div className="font-choices" role="radiogroup" aria-label={scriptTitle}>
                            <button type="button" role="radio" aria-checked={design.scriptFont === ''} className="font-choice" onClick={() => set('scriptFont', '', scriptLabel)}>
                                <span className="font-choice__name">Matching</span>
                                <span className="font-choice__kind">{matching ? `${matching.label}, to suit the font` : ''}</span>
                            </button>
                            {choices.map((font) => (
                                <button key={font.id} type="button" role="radio" aria-checked={design.scriptFont === font.id} className="font-choice" onClick={() => set('scriptFont', font.id, scriptLabel)}>
                                    <span className="font-choice__name" style={{fontFamily: `vitaena-${font.id}, var(--font-sans)`}}>
                                        {SAMPLES[script]}
                                    </span>
                                    <span className="font-choice__kind">
                                        {font.label} · {font.kind}
                                    </span>
                                </button>
                            ))}
                            {scriptFamilies.map((family) => (
                                <button key={family.id} type="button" role="radio" aria-checked={design.scriptFont === family.id} className="font-choice" onClick={() => set('scriptFont', family.id, scriptLabel)}>
                                    <span className="font-choice__name" style={{fontFamily: `${previewFamily(family.files[0])}, var(--font-sans)`}}>
                                        {SAMPLES[script]}
                                    </span>
                                    <span className="font-choice__kind">{family.family} · Your font</span>
                                </button>
                            ))}
                        </div>
                        {packsToGet.length > 0 ? <FontPackNotice wanted={packsToGet} forChoice /> : null}
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

const COUNTRY_CHOICES = COUNTRIES.map((country) => ({value: country.id, label: country.name}))

/** Where a CV is for, and how its dates are written, which the place sets and can be changed. */
export function CountryGroup({design, onCountry, onLanguage, onDates}: {design: CvDesign; onCountry(id: CountryId): void; onLanguage(language: DocumentLanguage): void; onDates(style: DateStyle): void}) {
    const country = countryOf(design.country)
    const writing = {language: design.language, digits: design.digits}
    const dates = (['month-name', 'numeric-slash', 'numeric-dot', 'year'] as const).map((style) => ({value: style, label: monthText('2020-01', {...writing, dateStyle: style})}))
    const offered = country.language && country.language !== design.language ? languageInfo(country.language) : null

    return (
        <Group title="Where it's for">
            <div className="design-row">
                <span className="design-row__label">For</span>
                <Select<CountryId> label="Where the CV is for" value={country.id} options={COUNTRY_CHOICES} onChange={onCountry} />
            </div>
            <p className="design-panel__tip">{country.id === 'any' ? 'Choose where you are applying, and Vitaena sets the paper and dates, puts the templates that suit it first, and Check says what employers there expect.' : country.why}</p>
            {offered ? (
                <p className="design-panel__tip">
                    Most CVs there are in {offered.name}.{' '}
                    <button type="button" className="text-button" onClick={() => onLanguage(offered.id)}>
                        Write the headings in {offered.name}
                    </button>
                </p>
            ) : null}
            <div className="design-row">
                <span className="design-row__label">Dates</span>
                <Segmented label="How dates are written" value={design.dateStyle} options={dates} onChange={onDates} />
            </div>
        </Group>
    )
}

/** Everything else about the look: colour, font, size and the page. */
export function StylePanel({cv, edit}: {cv: Cv; edit: Edit}) {
    const design = cv.design
    const set = setter(edit)
    // Only worth asking about once some list shows levels.
    const hasLevels = cv.sections.some((section) => section.kind === 'tags' && section.groups.some((group) => group.showLevels))
    const scripts = useMemo(() => scriptsIn(JSON.stringify([cv.person, cv.sections])), [cv.person, cv.sections])
    const onLanguage = (language: DocumentLanguage) => edit.act(`write in ${languageInfo(language).name}`, (current) => inLanguage(current, language))
    // A CV with nothing in it yet also gets the sections the place's CVs usually have.
    const blank = useMemo(() => renderModel(cv).sections.length === 0, [cv])
    const onCountry = (id: CountryId) => edit.act(`for ${countryOf(id).name}`, (current) => forCountry(current, id, blank))

    return (
        <StyleGroups design={design} set={set} onLanguage={onLanguage} scripts={scripts} before={<CountryGroup design={design} onCountry={onCountry} onLanguage={onLanguage} onDates={(style) => set('dateStyle', style, 'date style')} />}>
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
