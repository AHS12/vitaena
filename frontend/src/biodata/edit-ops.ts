/** Changes to a biodata that are its own, and what "Add a section" offers in one. */

import {newSection} from '../cv/editor/edit-ops'
import type {SectionChoice} from '../cv/editor/AddSection'
import {emptyFamilyMember, newId, type Section} from '../cv/sections'
import {labelsFor, type Labels} from '../core/labels/labels'
import {detailsWith, type Biodata, type BiodataPerson} from './biodata'

export const updatePerson = (biodata: Biodata, change: Partial<BiodataPerson>): Biodata => ({...biodata, person: {...biodata.person, ...change}})

export const updateHeading = (biodata: Biodata, change: Partial<Biodata['heading']>): Biodata => ({...biodata, heading: {...biodata.heading, ...change}})

const family = (s: Labels['sections'], r: Labels['rows']): Section => ({id: newId('section'), kind: 'family', title: s.family, visible: true, members: [emptyFamilyMember(r.father), emptyFamilyMember(r.mother)]})

/**
 * "Add a section" for a biodata: the usual sections, then ready sets of labels, then a
 * custom one of each kind. A ready set only offers labels: the app never fills in a
 * value, or suggests what a person or family should say. The menu is in English, as the
 * interface is; the headings and labels are in the biodata's language.
 */
export function biodataSectionChoices(language = 'en'): SectionChoice[] {
    const english = labelsFor('en').sections
    const {sections: s, rows: r} = labelsFor(language)
    const once = (id: string, key: keyof Labels['sections'], make: () => Section, group?: string): SectionChoice => ({
        id,
        label: s[key] === english[key] ? english[key] : `${english[key]} · ${s[key]}`,
        title: s[key],
        once: true,
        make,
        ...(group ? {group} : {}),
    })

    return [
        once('personal', 'personalDetails', () => detailsWith(s.personalDetails, [{label: r.dateOfBirth, kind: 'date'}, {label: r.height, kind: 'height'}, r.maritalStatus, r.nationality])),
        once('education', 'education', () => newSection(s.education, 'entries')),
        once('work', 'work', () => newSection(s.work, 'entries')),
        once('family', 'family', () => family(s, r)),
        once('about', 'aboutMe', () => newSection(s.aboutMe, 'text')),
        once('expectations', 'expectations', () => newSection(s.expectations, 'text')),
        once('hobbies', 'hobbies', () => newSection(s.hobbies, 'tags')),
        once('contact', 'contact', () => detailsWith(s.contact, [r.contactPerson, r.relation, r.phone, r.address])),
        once('horoscope', 'horoscope', () => detailsWith(s.horoscope, [r.timeOfBirth, r.placeOfBirth, r.rashi, r.nakshatra, r.gotra, r.manglik]), 'sets'),
        once('religion', 'religiousPractice', () => detailsWith(s.religiousPractice, [r.sect, r.prayer, r.fasting, r.religiousEducation]), 'sets'),
        once('lifestyle', 'lifestyle', () => detailsWith(s.lifestyle, [r.diet, r.smoking, r.drinking, r.languagesKnown]), 'sets'),
        once('more', 'moreAboutMe', () => detailsWith(s.moreAboutMe, [r.complexion, r.bloodGroup, r.weight]), 'sets'),
        {id: 'custom-details', label: 'Custom: labels and values', group: 'custom', make: () => newSection(s.details, 'details')},
        {id: 'custom-text', label: 'Custom: a paragraph', group: 'custom', make: () => newSection(s.custom, 'text')},
        {id: 'custom-list', label: 'Custom: a list of entries', group: 'custom', make: () => newSection(s.custom, 'entries')},
    ]
}

export const BIODATA_SECTION_CHOICES: readonly SectionChoice[] = biodataSectionChoices()
