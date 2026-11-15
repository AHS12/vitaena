/**
 * Makes the PDFs the import is tested on that the app's own templates don't make: CVs
 * laid out the way other apps lay them out, made the way those apps make PDFs.
 *
 * - office-word.pdf: a Word document (.docx, written here) exported by LibreOffice, as
 *   someone's CV from Word or LibreOffice is.
 * - Each .html beside it: printed by Chrome, as Google Docs and many online makers do.
 *
 * Every CV is invented, and every font is one the app ships under the SIL Open Font
 * License, embedded so nothing on this computer ends up in a committed file.
 *
 * Needs Chrome and LibreOffice: set CHROME and SOFFICE if they aren't where Windows puts
 * them. Run with `make import-fixtures`; the PDFs are committed, so tests don't need either.
 */

import {execFileSync} from 'node:child_process'
import {readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {AlignmentType, BorderStyle, Document, LevelFormat, Packer, Paragraph, TabStopType, TextRun} from 'docx'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const folder = resolve(here, '../src/cv/pdf-import/fixtures')
const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const SOFFICE = process.env.SOFFICE ?? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
const lato = (face) => readFileSync(require.resolve(`@expo-google-fonts/lato/${face}/Lato_${face}.ttf`))

// ---------------------------------------------------------------- Word, through LibreOffice

const FONT = 'Lato'
const RIGHT = 9638 // the text width of A4 with 2 cm margins, in twentieths of a point
const text = (value, options = {}) => new TextRun({text: value, font: FONT, size: 21, ...options})
const heading = (value) =>
    new Paragraph({
        spacing: {before: 240, after: 80},
        border: {bottom: {style: BorderStyle.SINGLE, size: 6, color: '444444', space: 2}},
        children: [text(value, {bold: true, size: 24})],
    })
/** A title on the left and dates against the right margin, on a tab stop, as Word CVs do. */
const titled = (title, dates) => new Paragraph({tabStops: [{type: TabStopType.RIGHT, position: RIGHT}], spacing: {before: 120}, children: [text(title, {bold: true}), text(`\t${dates}`)]})
const under = (value) => new Paragraph({children: [text(value, {italics: true})]})
const bullet = (value) => new Paragraph({numbering: {reference: 'bullets', level: 0}, children: [text(value)]})
const plain = (value) => new Paragraph({children: [text(value)]})

const word = new Document({
    // Lato everywhere, bullets and blank lines included, so no font of this computer's is embedded.
    styles: {default: {document: {run: {font: FONT}}}},
    numbering: {
        config: [
            {
                reference: 'bullets',
                levels: [{level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: {run: {font: FONT}, paragraph: {indent: {left: 360, hanging: 240}}}}],
            },
        ],
    },
    fonts: [{name: FONT, data: lato('400Regular'), bold: lato('700Bold'), italic: lato('400Regular_Italic'), boldItalic: lato('700Bold_Italic')}],
    sections: [
        {
            properties: {page: {size: {width: 11906, height: 16838}, margin: {top: 1134, bottom: 1134, left: 1134, right: 1134}}},
            children: [
                new Paragraph({alignment: AlignmentType.CENTER, children: [text('JOHN DOE', {bold: true, size: 40})]}),
                new Paragraph({alignment: AlignmentType.CENTER, children: [text('john.doe@example.com  |  020 7946 0123  |  Leeds, United Kingdom  |  linkedin.com/in/john-doe', {size: 19})]}),
                heading('PROFILE'),
                plain('Operations manager with ten years in warehousing and freight. I run sites that ship on time, keep people safe and cost less each year.'),
                heading('WORK EXPERIENCE'),
                titled('Operations Manager', 'June 2018 – Present'),
                under('Northwind Logistics, Leeds'),
                bullet('Run a 40,000 square metre site with 120 staff across three shifts.'),
                bullet('Cut late shipments from 6% to under 1% in the first year.'),
                bullet('Brought in a new warehouse system on time and under budget.'),
                titled('Shift Supervisor', 'February 2015 – May 2018'),
                under('Coastal Freight Ltd, Hull'),
                bullet('Led a night shift of 25 pickers and drivers.'),
                bullet('Trained twelve new supervisors in safe lifting and forklift use.'),
                titled('Warehouse Operative', 'September 2013 – January 2015'),
                under('Coastal Freight Ltd, Hull'),
                bullet('Picked, packed and loaded orders for retail customers.'),
                heading('EDUCATION'),
                titled('BA (Hons) Business Management', '2010 – 2013'),
                under('University of Riverside'),
                heading('SKILLS'),
                plain('Team leadership, Budget planning, Lean methods, Health and safety, Forklift licence'),
                heading('CERTIFICATIONS'),
                titled('Certified Logistics Professional', '2019'),
                titled('First Aid at Work', '2021'),
            ],
        },
    ],
})

const docx = join(folder, 'office-word.docx')

writeFileSync(docx, await Packer.toBuffer(word))
execFileSync(SOFFICE, ['--headless', '--convert-to', 'pdf', '--outdir', folder, docx], {stdio: 'inherit'})
rmSync(docx)

// ---------------------------------------------------------------- HTML, through Chrome

for (const file of readdirSync(folder).filter((name) => name.endsWith('.html'))) {
    const pdf = join(folder, file.replace(/\.html$/, '.pdf'))

    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, pathToFileURL(join(folder, file)).href], {stdio: 'inherit'})
}

console.log('Made the import fixtures in', folder)
