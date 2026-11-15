/**
 * For tests that lay a template out with the real Typst compiler and fonts, in Node, and
 * read the PDF back with pdf.js. Such a test file starts with `// @vitest-environment node`.
 */

import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {createTypstCompiler, initOptions, loadFonts, type TypstCompiler} from '@myriaddreamin/typst.ts'
import {GlobalWorkerOptions} from 'pdfjs-dist/legacy/build/pdf.mjs'
import {CV_FONTS} from '../cv/fonts'
import {withImageFiles} from '../cv/typst/images'

const require = createRequire(import.meta.url)
const bytes = (path: string) => new Uint8Array(readFileSync(require.resolve(path)))

GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href

/** A compiler with the app's fonts and no others. Slow: make one per file, in beforeAll. */
export async function typstCompiler(): Promise<TypstCompiler> {
    const compiler = createTypstCompiler()

    await compiler.init({
        beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts(CV_FONTS.flatMap((font) => font.files.map(bytes)))],
        getModule: () => bytes('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'),
    })

    return compiler
}

/**
 * The PDF of a template, given as the URL of its .typ file, with a render model at the
 * path the template reads it from, such as /cv.json.
 */
export async function templatePdf(compiler: TypstCompiler, template: URL, dataPath: string, renderModel: object): Promise<Uint8Array> {
    compiler.addSource('/main.typ', readFileSync(fileURLToPath(template), 'utf8'))

    const {model, files} = withImageFiles(renderModel)

    compiler.mapShadow(dataPath, new TextEncoder().encode(JSON.stringify(model)))

    for (const file of files) {
        compiler.mapShadow(file.path, file.bytes)
    }

    const result = await compiler.compile({mainFilePath: '/main.typ', format: 1, diagnostics: 'full'})
    const errors = result.diagnostics?.filter((item) => item.severity === 'error') ?? []

    if (errors.length > 0 || !result.result) {
        throw new Error(`The template didn't compile: ${JSON.stringify(errors)}`)
    }

    return result.result
}
