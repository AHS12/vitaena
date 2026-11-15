// Pictures of the sample CV and the sample biodata in every template, for the README and
// the website (which lives in its own repository), made by the same Typst compiler,
// fonts and templates as the app. Run `make previews` after changing a template, so no
// picture goes stale.
//
//   docs/assets/templates/<template>.png           a CV template, page 1, 900 px wide
//   docs/assets/templates/biodata-<template>.png   a biodata template, the same

import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {createJiti} from 'jiti'
import {Resvg} from '@resvg/resvg-js'
import {createTypstCompiler, createTypstRenderer, initOptions, loadFonts} from '@myriaddreamin/typst.ts'

const require = createRequire(import.meta.url)
const here = (path) => fileURLToPath(new URL(path, import.meta.url))
const jiti = createJiti(import.meta.url)
const bytes = (path) => new Uint8Array(readFileSync(require.resolve(path)))

const {sampleCv} = await jiti.import('../src/cv/sample.ts')
const {renderModel} = await jiti.import('../src/cv/render-model.ts')
const {CV_TEMPLATES} = await jiti.import('../src/cv/templates/templates.ts')
const {CV_FONTS} = await jiti.import('../src/cv/fonts.ts')
const {withImageFiles} = await jiti.import('../src/cv/typst/images.ts')
const {sampleBiodata} = await jiti.import('../src/biodata/sample.ts')
const {biodataRenderModel} = await jiti.import('../src/biodata/render-model.ts')
const {BIODATA_TEMPLATES} = await jiti.import('../src/biodata/templates/templates.ts')

/** Each template in a colour of its own, so the gallery doesn't look like one template four times. */
const LOOKS = {academic: {accent: '#3b3b6d', font: 'source-serif-4'}, professional: {accent: '#2563eb'}, classic: {accent: '#1f4e79'}, modern: {accent: '#22706d'}, minimal: {accent: '#7a1f4b', font: 'source-serif-4'}, compact: {accent: '#2e6b3e', font: 'ibm-plex-sans'}, executive: {accent: '#5b4636', font: 'eb-garamond'}, bold: {accent: '#b4442c'}, timeline: {accent: '#0f766e', font: 'lato'}, sidebar: {accent: '#1e3a5f'}}
const WIDTH = 900

/** A plain drawn silhouette, so templates with a photo show one without a real face. */
const AVATAR = `data:image/png;base64,${new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#c9d6e3"/><circle cx="100" cy="78" r="38" fill="#8aa1b8"/><path d="M30 200c6-48 36-70 70-70s64 22 70 70z" fill="#8aa1b8"/></svg>`,
    {fitTo: {mode: 'width', value: 200}},
)
    .render()
    .asPng()
    .toString('base64')}`
/** The same, standing, for the full-length photo a biodata may have. */
const STANDING = `data:image/png;base64,${new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400"><rect width="200" height="400" fill="#c9d6e3"/><circle cx="100" cy="62" r="30" fill="#8aa1b8"/><path d="M58 400l8-230c4-48 64-48 68 0l8 230z" fill="#8aa1b8"/></svg>`,
    {fitTo: {mode: 'width', value: 200}},
)
    .render()
    .asPng()
    .toString('base64')}`
const WITH_PHOTO = new Set(['professional', 'modern', 'classic', 'bold', 'sidebar'])
// Academic is shown with publications, as a CV of that kind would have.
const EXTRA = {academic: [{id: 'pubs', kind: 'entries', title: 'Publications', visible: true, entries: [
    {id: 'pub1', visible: true, title: 'Finding the slow part in production services', org: 'Journal of Example Systems, 12(3)', location: '', start: '2023-04', end: '2023-04', current: false, summary: '', bullets: ['Doe J., Roe R.'], hide: []},
    {id: 'pub2', visible: true, title: 'Queues that never lose a payment', org: 'Proceedings of the Example Conference', location: '', start: '2021-09', end: '2021-09', current: false, summary: '', bullets: ['Doe J.'], hide: []},
]}]}
const out = here('../../docs/assets/templates/')

const compiler = createTypstCompiler()
const renderer = createTypstRenderer()

await compiler.init({
    beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts(CV_FONTS.flatMap((font) => font.files.map(bytes)))],
    getModule: () => bytes('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
})
await renderer.init({getModule: () => bytes('@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm')})

mkdirSync(out, {recursive: true})

/** Page 1 of a template, laid out with its data, as a PNG. */
async function picture(source, dataPath, full) {
    const {model, files} = withImageFiles(full)

    for (const file of files) {
        compiler.mapShadow(file.path, file.bytes)
    }

    compiler.addSource('/main.typ', readFileSync(source, 'utf8'))
    compiler.mapShadow(dataPath, new TextEncoder().encode(JSON.stringify(model)))

    const vector = (await compiler.compile({mainFilePath: '/main.typ', format: 0})).result
    const svg = await renderer.runWithSession(async (session) => {
        renderer.manipulateData({renderSession: session, action: 'reset', data: vector})
        return renderer.renderSvg({renderSession: session})
    })

    // Page 1 only: crop the stacked pages to the first page's height.
    const [, pageWidth, pageHeight] = /data-page-width="([\d.]+)" data-page-height="([\d.]+)"/.exec(svg) ?? []
    // Typst's SVG carries a script for the live preview; it isn't XML and a still picture doesn't need it.
    const still = svg
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, '')
        // Glyphs take their colour from CSS variables, which the rasteriser doesn't know.
        // Without them, each glyph inherits the fill set on its group, which is the same colour.
        .replace(/(fill|stroke): *var\(--[a-z_]+\);?/g, '')
    const page = still.replace(/<svg([^>]*?)viewBox="[^"]*"([^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/, `<svg$1viewBox="0 0 ${pageWidth} ${pageHeight}"$2width="${pageWidth}"$3height="${pageHeight}"`)

    return new Resvg(page, {fitTo: {mode: 'width', value: WIDTH}, background: '#ffffff'}).render().asPng()
}

for (const template of CV_TEMPLATES) {
    const cv = sampleCv()
    const person = WITH_PHOTO.has(template.id) ? {...cv.person, photo: AVATAR} : cv.person
    const full = renderModel({...cv, person, sections: [...cv.sections, ...(EXTRA[template.id] ?? [])], design: {...cv.design, ...LOOKS[template.id], template: template.id}})

    writeFileSync(`${out}${template.id}.png`, await picture(here(`../src/cv/templates/${template.id}.typ`), '/cv.json', full))
    console.log(`Made docs/assets/templates/${template.id}.png`)
}

for (const template of BIODATA_TEMPLATES) {
    const biodata = sampleBiodata()
    const person = {...biodata.person, photo: AVATAR, fullPhoto: template.id === 'portrait' ? STANDING : ''}
    const full = biodataRenderModel({...biodata, person, design: {...biodata.design, template: template.id, border: template.border}})

    writeFileSync(`${out}biodata-${template.id}.png`, await picture(here(`../src/biodata/templates/${template.id}.typ`), '/biodata.json', full))
    console.log(`Made docs/assets/templates/biodata-${template.id}.png`)
}
