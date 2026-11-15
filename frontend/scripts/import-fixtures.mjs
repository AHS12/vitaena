/**
 * Makes the PDFs the import is tested on that the app's own templates don't make: CVs
 * laid out the way other apps lay them out, made the way those apps make PDFs.
 *
 * - office-word.docx: a Word document written here, and office-word.pdf, the same
 *   exported by LibreOffice, as someone's CV from Word or LibreOffice is.
 * - word-table.docx: a Word document laid out as Word templates often are: the name and
 *   contact details in the page header, a table as the page's two columns, and each
 *   job's title and dates in a row of their own.
 * - Each .html beside it: printed by Chrome, as Google Docs and many online makers do.
 *
 * Every CV is invented, and every font is one the app ships under the SIL Open Font
 * License, embedded so nothing on this computer ends up in a committed file.
 *
 * Needs Chrome and LibreOffice: set CHROME and SOFFICE if they aren't where Windows puts
 * them. Run with `make import-fixtures`; the PDFs are committed, so tests don't need either.
 */

import {execFileSync} from 'node:child_process'
import {readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {AlignmentType, BorderStyle, Document, ExternalHyperlink, Header, HeadingLevel, LevelFormat, Packer, Paragraph, Table, TableCell, TableRow, TabStopType, TextRun, WidthType} from 'docx'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const folder = resolve(here, '../src/cv/import/fixtures')
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

// Lato everywhere, bullets and blank lines included, so no font of this computer's is embedded.
const LATO_ONLY = {
    styles: {default: {document: {run: {font: FONT}}}},
    numbering: {
        config: [
            {
                reference: 'bullets',
                levels: [{level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: {run: {font: FONT}, paragraph: {indent: {left: 360, hanging: 240}}}}],
            },
        ],
    },
}

const word = new Document({
    ...LATO_ONLY,
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

// ---------------------------------------------------------------- Word, as templates lay it out

const NONE = {style: BorderStyle.NONE, size: 0, color: 'FFFFFF'}
const NO_BORDERS = {top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE}
const section = (value) => new Paragraph({heading: HeadingLevel.HEADING_2, children: [new TextRun({text: value, font: FONT, allCaps: true})]})
const cell = (children, width) => new TableCell({width: {size: width, type: WidthType.PERCENTAGE}, borders: NO_BORDERS, children})
/** A job's title and its dates, each in a cell of a borderless row. */
const dated = (title, dates) =>
    new Table({
        width: {size: 100, type: WidthType.PERCENTAGE},
        borders: NO_BORDERS,
        rows: [new TableRow({children: [cell([new Paragraph({children: [text(title, {bold: true})]})], 70), cell([new Paragraph({alignment: AlignmentType.RIGHT, children: [text(dates)]})], 30)]})],
    })

const template = new Document({
    ...LATO_ONLY,
    sections: [
        {
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({children: [text('Sam Doe', {bold: true, size: 44})]}),
                        new Paragraph({children: [text('Retail Manager', {size: 24})]}),
                        new Paragraph({
                            children: [
                                new ExternalHyperlink({link: 'mailto:sam.doe@example.com', children: [text('Email me')]}),
                                text('  ·  07700 900123  ·  York, United Kingdom  ·  '),
                                new ExternalHyperlink({link: 'https://www.linkedin.com/in/sam-doe', children: [text('LinkedIn')]}),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Table({
                    width: {size: 100, type: WidthType.PERCENTAGE},
                    borders: NO_BORDERS,
                    rows: [
                        new TableRow({
                            children: [
                                cell([section('Skills'), plain('Customer service'), plain('Stock control'), plain('Cash handling'), section('Languages'), plain('Polish — Native'), plain('English — Fluent')], 30),
                                cell(
                                    [
                                        section('Experience'),
                                        dated('Store Manager', 'May 2021 – Present'),
                                        under('Greenway Grocers, York'),
                                        bullet('Run a store of 18 staff open seven days a week.'),
                                        bullet('Grew weekly sales by 12% in the first year.'),
                                        dated('Assistant Manager', 'June 2016 – April 2021'),
                                        under('Greenway Grocers, Leeds'),
                                        bullet('Planned rotas and trained new starters.'),
                                        section('Education'),
                                        dated('BTEC Retail Management', '2014 – 2016'),
                                        under('York College'),
                                    ],
                                    70,
                                ),
                            ],
                        }),
                    ],
                }),
            ],
        },
    ],
})

writeFileSync(join(folder, 'word-table.docx'), await Packer.toBuffer(template))

// ---------------------------------------------------------------- HTML, through Chrome

for (const file of readdirSync(folder).filter((name) => name.endsWith('.html'))) {
    const pdf = join(folder, file.replace(/\.html$/, '.pdf'))

    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, pathToFileURL(join(folder, file)).href], {stdio: 'inherit'})
}

console.log('Made the import fixtures in', folder)
