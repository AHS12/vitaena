/**
 * A biodata: the page or two about a person and their family that families in
 * Bangladesh, India, Pakistan and Nepal share when looking for a marriage.
 *
 * It's made of the same sections as a CV, plus the family, under a heading line and a
 * name. Unlike a CV it's never read by screening software, so it has no ATS mode, and it
 * has room for a second, full-length photo.
 */

import {z} from 'zod'
import type {DocumentType} from '../core/document/document-file'
import {detailsSection, entriesSection, familySection, newId, tagsSection, textSection, emptyFamilyMember, type Section} from '../cv/sections'
import {emptyDetailRow} from '../cv/details'

/** A picture as a JPEG or PNG data URL, or "" for none. Kept small, inside the file. */
const picture = z.union([z.literal(''), z.string().regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/)])

const headingSchema = z.object({
    /** The line above the name, in the person's own words. The app never suggests one. */
    text: z.string(),
    /** A small picture above that line, which the person adds themselves. */
    image: picture,
})

const personSchema = z.object({
    name: z.string(),
    /** A square photo, which every template places. */
    photo: picture,
    /** A full-length photo of any shape, which some templates show as well. */
    fullPhoto: picture,
    /** Pictures kept but left off the page. */
    hide: z.array(z.enum(['photo', 'fullPhoto'])),
})

const sectionSchema = z.discriminatedUnion('kind', [detailsSection, familySection, entriesSection, textSection, tagsSection])

const designSchema = z.object({
    template: z.string().min(1),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    /** An id from CV_FONTS. An unknown one falls back to the first. */
    font: z.string().min(1),
    fontSize: z.number().min(8).max(13),
    paper: z.enum(['a4', 'us-letter']),
    margins: z.enum(['narrow', 'normal', 'wide']),
    spacing: z.enum(['compact', 'normal', 'relaxed']),
    /** A border around each page, drawn in the template's own way. */
    border: z.boolean(),
})

const biodataSchema = z.object({
    heading: headingSchema,
    person: personSchema,
    sections: z.array(sectionSchema),
    design: designSchema,
})

export type Biodata = z.infer<typeof biodataSchema>
export type BiodataPerson = Biodata['person']
export type BiodataDesign = Biodata['design']
export type BiodataSection = Biodata['sections'][number]
export type BiodataPicture = BiodataPerson['hide'][number]

export const DEFAULT_BIODATA_DESIGN: BiodataDesign = {template: 'clean', accent: '#7a1f4b', font: 'source-serif-4', fontSize: 10.5, paper: 'a4', margins: 'normal', spacing: 'normal', border: false}

/** A details section with these labels and every value empty. */
export function detailsWith(title: string, labels: readonly (string | {readonly label: string; readonly kind: 'date' | 'height'})[]): Section {
    return {
        id: newId('section'),
        kind: 'details',
        title,
        visible: true,
        rows: labels.map((item) => (typeof item === 'string' ? emptyDetailRow('text', item) : emptyDetailRow(item.kind, item.label))),
    }
}

const section = (kind: 'entries' | 'text', title: string): Section =>
    kind === 'entries' ? {id: newId('section'), kind, title, visible: true, entries: []} : {id: newId('section'), kind, title, visible: true, text: ''}

/** A new biodata: the sections most have, in the usual order, with labels and no values. */
export function emptyBiodata(): Biodata {
    return {
        heading: {text: '', image: ''},
        person: {name: '', photo: '', fullPhoto: '', hide: []},
        sections: [
            detailsWith('Personal details', [{label: 'Date of birth', kind: 'date'}, {label: 'Height', kind: 'height'}, 'Marital status', 'Religion', 'Nationality', 'Home town', 'Current city']),
            section('entries', 'Education'),
            section('entries', 'Work'),
            {id: newId('section'), kind: 'family', title: 'Family', visible: true, members: [emptyFamilyMember('Father'), emptyFamilyMember('Mother')]},
            section('text', 'About me'),
            section('text', 'Expectations'),
            detailsWith('Contact', ['Contact person', 'Relation', 'Phone', 'Address']),
        ] as BiodataSection[],
        design: {...DEFAULT_BIODATA_DESIGN},
    }
}

export const biodataType: DocumentType<Biodata> = {
    kind: 'biodata',
    noun: 'biodata',
    plural: 'biodata',
    version: 1,
    content: biodataSchema,
    empty: emptyBiodata,
    // Loaded on use, so tests and the library list never pull in the layout engine.
    thumbnail: async (biodata) => {
        const [{pageThumbnail}, {biodataRenderModel}] = await Promise.all([import('../cv/thumbnail'), import('./render-model')])

        return pageThumbnail(biodataRenderModel(biodata), biodata.design.template)
    },
}
