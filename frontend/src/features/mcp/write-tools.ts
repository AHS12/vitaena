/**
 * The tools that change documents: make one, copy one, edit one, and change its look.
 * Each needs Read and edit in the AI assistants setting.
 */

import {z} from 'zod'
import {LANGUAGE_IDS, LANGUAGES, type DocumentLanguage} from '../../core/labels/labels'
import {CV_FONTS, SCRIPT_FONTS} from '../../cv/fonts'
import {addedFamilies, useAddedFonts} from '../../cv/added-fonts'
import {inLanguage} from '../../cv/relabel'
import {COUNTRIES, COUNTRY_IDS, DATE_STYLES, forCountry} from '../../cv/countries'
import type {Cv} from '../../cv/cv'
import type {Sectioned} from '../../cv/sections'
import {nounOfKind} from '../../store/document-types'
import {freeName, saveChange, saveNew, summaryOf} from './changes'
import {loadDocument, toolsFor} from './documents'
import {applyOperations, OperationError, operationSchema, OPS_HELP} from './edit-ops'
import {KINDS} from './read-tools'
import {defineTool} from './tool'

const idInput = z.string().min(1).describe("The document's id, from list_documents.")

const operationsInput = z.array(operationSchema).min(1).describe('The changes, applied in order. If one can\'t be done, none are.')

function applied(content: unknown, kind: string, operations: z.infer<typeof operationsInput>) {
    try {
        return applyOperations(content as Parameters<typeof applyOperations>[0], kind, operations)
    } catch (error) {
        if (error instanceof OperationError) {
            throw error
        }

        throw new Error(`The changes couldn't be made: ${error instanceof Error ? error.message : String(error)}`, {cause: error})
    }
}

const addedInWords = (added: readonly {what: string; id: string}[]): string => (added.length === 0 ? '' : `\nAdded: ${added.map((item) => `${item.what}, id ${item.id}`).join('; ')}.`)

export const editDocumentTool = defineTool({
    name: 'edit_document',
    title: 'Edit a document',
    description: [
        'Changes a document\'s content in small steps, applied together: if one can\'t be done, nothing changes. Read the document first with read_document for the ids. If it\'s open in the editor, the change arrives there unsaved, as one step the person can undo; otherwise it\'s saved, with a copy kept from before.',
        'Text can use **bold**, *italic* and [a link](https://example.com). Write in the person\'s own voice, and never invent facts about them.',
        'Ops:',
        ...OPS_HELP.map((line) => `- ${line}`),
    ].join('\n'),
    input: z.object({id: idInput, operations: operationsInput}),
    readOnly: false,
    destructive: true,
    run: async ({id, operations}, context) => {
        const document = await loadDocument(id)
        const result = applied(document.content, document.kind, operations)
        const said = await saveChange(document, result.content, result.changes, context)

        return {text: `${said}${addedInWords(result.added)}`, structured: {changes: result.changes, added: result.added}}
    },
})

const ACCENT = /^#[0-9a-fA-F]{6}$/

export const setDesignTool = defineTool({
    name: 'set_design',
    title: 'Change the design',
    description: `Changes how a document looks: its template, accent colour, font, text size, paper, margins and spacing; for a CV, ATS mode (one column for screening systems) and how levels are drawn; for a biodata, the border. Also the language the app writes the headings, labels and dates in (${LANGUAGES.map((info) => `${info.id} for ${info.name}`).join(', ')}): changing it carries the app's own headings and labels across and leaves the person's words alone. Give only what to change. Fonts: ${CV_FONTS.map((font) => `${font.id} (${font.label}, ${font.kind.toLowerCase()})`).join(', ')}. Fonts for Bangla or Arabic text (scriptFont, "" for the one that suits the font and language): ${SCRIPT_FONTS.map((font) => font.id).join(', ')}. list_templates gives the template ids.`,
    input: z.object({
        id: idInput,
        template: z.string().optional(),
        accent: z.string().optional().describe('A colour as #rrggbb.'),
        font: z.string().optional().describe('A built-in font id, or custom: and the family of a font the person added (list_templates lists them).'),
        fontSize: z.number().min(8).max(13).optional().describe('In points, 8 to 13, in half steps.'),
        paper: z.enum(['a4', 'us-letter']).optional(),
        margins: z.enum(['narrow', 'normal', 'wide']).optional(),
        spacing: z.enum(['compact', 'normal', 'relaxed']).optional(),
        atsMode: z.boolean().optional().describe('CV only.'),
        levelStyle: z.enum(['template', 'dots', 'bar', 'squares']).optional().describe('CV only.'),
        country: z.enum(COUNTRY_IDS).optional().describe(`CV only. Where it's for, which sets the paper and how dates are written, and gives check_document that place's advice: ${COUNTRIES.map((country) => `${country.id} for ${country.name}`).join(', ')}.`),
        dateStyle: z.enum(DATE_STYLES).optional().describe('CV only. How entries’ months are written: month-name "Jan 2020", numeric-slash "01/2020", numeric-dot "01.2020", year "2020".'),
        border: z.boolean().optional().describe('Biodata only.'),
        language: z.enum(LANGUAGE_IDS).optional().describe('The language of the headings, labels and dates the app writes.'),
        digits: z.enum(['latin', 'native']).optional().describe('Numbers the app writes: native for the language\'s own digits (০১২ in Bangla), latin for 0 to 9.'),
        scriptFont: z.string().optional().describe('The font for Bangla letters: "" for the one that suits the main font, a bundled one\'s id, or custom: and the family of one the person added.'),
    }),
    readOnly: false,
    idempotent: true,
    run: async ({id, ...design}, context) => {
        const document = await loadDocument(id)
        const tools = toolsFor(document.kind)
        const given = Object.fromEntries(Object.entries(design).filter(([, value]) => value !== undefined))
        const cvOnly = ['atsMode', 'levelStyle', 'country', 'dateStyle'].filter((key) => key in given && document.kind !== 'cv')
        const biodataOnly = ['border'].filter((key) => key in given && document.kind !== 'biodata')

        if (Object.keys(given).length === 0) {
            throw new Error('Give at least one thing to change.')
        }

        if (cvOnly.length > 0 || biodataOnly.length > 0) {
            throw new Error(`A ${nounOfKind(document.kind)} has no ${[...cvOnly, ...biodataOnly].join(' or ')}.`)
        }

        if (design.template !== undefined && !tools.templates.some((template) => template.id === design.template)) {
            throw new Error(`There's no template "${design.template}" for a ${nounOfKind(document.kind)}. They are: ${tools.templates.map((template) => template.id).join(', ')}.`)
        }

        if (design.accent !== undefined && !ACCENT.test(design.accent)) {
            throw new Error(`The accent must be a colour as #rrggbb, not "${design.accent}".`)
        }

        const added = addedFamilies(useAddedFonts.getState().fonts).map((family) => family.id)

        if (design.font !== undefined && !CV_FONTS.some((font) => font.id === design.font) && !added.includes(design.font)) {
            throw new Error(`There's no font "${design.font}". They are: ${[...CV_FONTS.map((font) => font.id), ...added].join(', ')}.`)
        }

        if (design.scriptFont !== undefined && design.scriptFont !== '' && !SCRIPT_FONTS.some((font) => font.id === design.scriptFont) && !added.includes(design.scriptFont)) {
            throw new Error(`There's no script font "${design.scriptFont}". They are: "" (matching), ${[...SCRIPT_FONTS.map((font) => font.id), ...added].join(', ')}.`)
        }

        if (design.fontSize !== undefined && design.fontSize * 2 !== Math.round(design.fontSize * 2)) {
            throw new Error('The text size goes in half points, such as 10 or 10.5.')
        }

        const content = document.content as Sectioned & {design: {language: string}}
        const words: Record<string, string> = {fontSize: 'text size', atsMode: 'ATS mode', levelStyle: 'level style', scriptFont: 'script font', dateStyle: 'date style', country: 'place it’s for'}
        const changes = Object.keys(given).map((key) => `set the ${words[key] ?? key}`)
        // A new language carries the app's own headings and labels across, as Style does.
        const moved = design.language !== undefined && design.language !== content.design.language ? inLanguage(content, design.language) : content
        // A place sets its paper and dates first, as Style does; what's given besides wins.
        const placed = design.country !== undefined ? forCountry(moved as unknown as Cv, design.country, false) : moved
        const said = await saveChange(document, {...placed, design: {...placed.design, ...given}}, changes, context)

        return {text: said, structured: {changes}}
    },
})

export const createDocumentTool = defineTool({
    name: 'create_document',
    title: 'Make a document',
    description:
        'Makes a new CV or biodata, saves it in the app and gives its id. It starts with the usual empty sections for its kind (read_document shows them); give operations, as edit_document takes them, to fill it in the same call. It isn\'t opened: the person finds it in their documents.',
    input: z.object({
        kind: z.enum(KINDS),
        name: z.string().min(1).describe('What the person will see it called, such as "Jane Doe – Product designer".'),
        template: z.string().optional().describe('A template id from list_templates. Default: the kind\'s usual one.'),
        language: z.enum(LANGUAGE_IDS).optional().describe('The language its headings, labels and dates start in. Default: en.'),
        country: z.enum(COUNTRY_IDS).optional().describe('CV only. Where it’s for, as set_design takes it: sets the paper and dates and adds the sections CVs there usually have, such as personal details for de.'),
        operations: z.array(operationSchema).optional().describe('Changes to make to it straight away, as for edit_document.'),
    }),
    readOnly: false,
    run: async ({kind, name, template, language, country, operations}, context) => {
        const tools = toolsFor(kind)
        const empty = tools.emptyIn((language ?? 'en') as DocumentLanguage) as {design: object}

        if (template !== undefined && !tools.templates.some((candidate) => candidate.id === template)) {
            throw new Error(`There's no template "${template}" for a ${nounOfKind(kind)}. They are: ${tools.templates.map((candidate) => candidate.id).join(', ')}.`)
        }

        if (country !== undefined && kind !== 'cv') {
            throw new Error(`A ${nounOfKind(kind)} has no country.`)
        }

        const templated = template === undefined ? empty : {...empty, design: {...empty.design, template}}
        const start = country !== undefined ? forCountry(templated as Cv, country, true) : templated
        const result = operations && operations.length > 0 ? applied(start, kind, operations) : {content: start, changes: [], added: []}
        const chosen = await freeName(name)
        const id = await saveNew(kind, chosen, result.content, context, `made it${result.changes.length > 0 ? ` and ${summaryOf(result.changes)}` : ''}`)

        return {
            text: `Made the ${nounOfKind(kind)} "${chosen}", id ${id}, and saved it.${result.changes.length > 0 ? ` Then: ${result.changes.join('; ')}.` : ''}${addedInWords(result.added)}`,
            structured: {id, name: chosen, changes: result.changes, added: result.added},
        }
    },
})

export const duplicateDocumentTool = defineTool({
    name: 'duplicate_document',
    title: 'Copy a document',
    description: 'Saves a copy of a document under a new name and gives its id, such as to fit a CV to one job without changing the original. A document open in the editor is copied as it is there now.',
    input: z.object({
        id: idInput,
        name: z.string().optional().describe('The copy\'s name. Default: the original\'s, with a number.'),
    }),
    readOnly: false,
    run: async ({id, name}, context) => {
        const document = await loadDocument(id)
        const chosen = await freeName(name ?? document.name)
        const copyId = await saveNew(document.kind, chosen, document.content, context, `copied "${document.name}"`)

        return {text: `Saved a copy of "${document.name}" as "${chosen}", id ${copyId}.`, structured: {id: copyId, name: chosen}}
    },
})

export const WRITE_TOOLS = [createDocumentTool, duplicateDocumentTool, editDocumentTool, setDesignTool]
