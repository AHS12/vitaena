/**
 * What a biodata template is given: the biodata with hidden things left out, dates and
 * heights already written out, and the age worked out on the day the page is drawn.
 *
 * Sections a CV also has are written out as for a CV, so a template draws them the same
 * way; the family is a biodata's own.
 */

import {labelsFor} from '../core/labels/labels'
import {fontById, fontFamilies} from '../cv/fonts'
import {MARGINS, pageLanguage, sectionBody, SPACING, type SectionBody} from '../cv/render-model'
import type {Biodata} from './biodata'

export interface RenderMember {
    readonly relation: string
    readonly name: string
    readonly work: string
    readonly note: string
}

export type BiodataRenderSection = SectionBody | {readonly kind: 'family'; readonly title: string; readonly members: readonly RenderMember[]}

export interface BiodataRenderModel {
    /** The line above the name, or "". */
    readonly heading: string
    /** A small picture above that line, as a data URL, or "". */
    readonly headingImage: string
    readonly name: string
    /** The square photo, or "". */
    readonly photo: string
    /** The full-length photo, or "". */
    readonly fullPhoto: string
    readonly sections: readonly BiodataRenderSection[]
    /** Words a template writes itself, in the biodata's language: a family table's column headings. */
    readonly words: {readonly relation: string; readonly name: string; readonly work: string; readonly note: string}
    readonly design: {
        readonly accent: string
        /** The font's family name, as Typst knows it. */
        readonly font: string
        /** The families a template sets, the font first, then those for other scripts. */
        readonly fonts: readonly string[]
        /** The language, as Typst's lang takes it: "en", "bn". */
        readonly lang: string
        /** Written in Latin letters, so headings may be spaced out or set in capitals. */
        readonly latin: boolean
        readonly fontSize: number
        readonly paper: string
        /** Page margins, in centimetres. */
        readonly margin: number
        /** How much room between blocks, around 1. */
        readonly spacing: number
        readonly border: boolean
    }
}

const shown = (picture: string, hidden: boolean): string => (picture && !hidden ? picture : '')

/** `today` is the day ages are worked out on. */
export function biodataRenderModel(biodata: Biodata, today: Date = new Date()): BiodataRenderModel {
    const {person, design} = biodata
    const labels = labelsFor(design.language)
    const sections = biodata.sections.flatMap((section): BiodataRenderSection[] => {
        if (section.kind !== 'family') {
            const body = sectionBody(section, today, design)

            return body ? [body] : []
        }

        const members = section.members
            .filter((member) => member.visible)
            .map((member) => ({relation: member.relation.trim(), name: member.name.trim(), work: member.work.trim(), note: member.note.trim()}))
            .filter((member) => member.name || member.work || member.note)

        return section.visible && members.length > 0 ? [{kind: 'family', title: section.title.trim(), members}] : []
    })

    return {
        heading: biodata.heading.text.trim(),
        headingImage: biodata.heading.image,
        name: person.name.trim(),
        photo: shown(person.photo, person.hide.includes('photo')),
        fullPhoto: shown(person.fullPhoto, person.hide.includes('fullPhoto')),
        sections,
        words: {relation: labels.rows.relation, name: labels.page.name, work: labels.page.work, note: labels.page.note},
        design: {
            accent: design.accent,
            font: fontById(design.font).family,
            fonts: fontFamilies(design.font, design.scriptFont),
            ...pageLanguage(design.language),
            fontSize: design.fontSize,
            paper: design.paper,
            margin: MARGINS[design.margins],
            spacing: SPACING[design.spacing],
            border: design.border,
        },
    }
}

/** True when nothing the person wrote shows yet, so the page offers an example instead. */
export const isBlank = (model: BiodataRenderModel): boolean => !model.name && !model.heading && model.sections.length === 0
