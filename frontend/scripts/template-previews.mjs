// Pictures of the sample CV in every template, for the README and the website (which
// lives in its own repository), made by the same Typst compiler, fonts and templates as
// the app. Run `make previews` after changing a template, so no picture goes stale.
//
//   docs/assets/templates/<template>.png   page 1, 900 px wide

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
const {withPhotoFile} = await jiti.import('../src/cv/typst/photo.ts')

/** Each template in a colour of its own, so the gallery doesn't look like one template four times. */
const LOOKS = {professional: {accent: '#2563eb'}, classic: {accent: '#1f4e79'}, modern: {accent: '#22706d'}, minimal: {accent: '#7a1f4b', font: 'source-serif-4'}, compact: {accent: '#2e6b3e', font: 'ibm-plex-sans'}}
const WIDTH = 900

/** A plain drawn silhouette, so templates with a photo show one without a real face. */
const AVATAR = `data:image/png;base64,${new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#c9d6e3"/><circle cx="100" cy="78" r="38" fill="#8aa1b8"/><path d="M30 200c6-48 36-70 70-70s64 22 70 70z" fill="#8aa1b8"/></svg>`,
    {fitTo: {mode: 'width', value: 200}},
)
    .render()
    .asPng()
    .toString('base64')}`
const WITH_PHOTO = new Set(['professional', 'modern', 'classic'])
const out = here('../../docs/assets/templates/')

const compiler = createTypstCompiler()
const renderer = createTypstRenderer()

await compiler.init({
    beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts(CV_FONTS.flatMap((font) => font.files.map(bytes)))],
    getModule: () => bytes('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
})
await renderer.init({getModule: () => bytes('@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm')})

mkdirSync(out, {recursive: true})

for (const template of CV_TEMPLATES) {
    const cv = sampleCv()
    const person = WITH_PHOTO.has(template.id) ? {...cv.person, photo: AVATAR} : cv.person
    const full = renderModel({...cv, person, design: {...cv.design, ...LOOKS[template.id], template: template.id}})
    const {model, file} = withPhotoFile(full)

    if (file) {
        compiler.mapShadow(file.path, file.bytes)
    }

    compiler.addSource('/main.typ', readFileSync(here(`../src/cv/templates/${template.id}.typ`), 'utf8'))
    compiler.mapShadow('/cv.json', new TextEncoder().encode(JSON.stringify(model)))

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
    const png = new Resvg(page, {fitTo: {mode: 'width', value: WIDTH}, background: '#ffffff'}).render().asPng()

    writeFileSync(`${out}${template.id}.png`, png)
    console.log(`Made docs/assets/templates/${template.id}.png`)
}
