/** Changes to a biodata that are its own, and what "Add a section" offers in one. */

import {newSection} from '../cv/editor/edit-ops'
import type {SectionChoice} from '../cv/editor/AddSection'
import {emptyFamilyMember, newId, type Section} from '../cv/sections'
import {detailsWith, type Biodata, type BiodataPerson} from './biodata'

export const updatePerson = (biodata: Biodata, change: Partial<BiodataPerson>): Biodata => ({...biodata, person: {...biodata.person, ...change}})

export const updateHeading = (biodata: Biodata, change: Partial<Biodata['heading']>): Biodata => ({...biodata, heading: {...biodata.heading, ...change}})

const family = (): Section => ({id: newId('section'), kind: 'family', title: 'Family', visible: true, members: [emptyFamilyMember('Father'), emptyFamilyMember('Mother')]})

/**
 * "Add a section" for a biodata: the usual sections, then ready sets of labels, then a
 * custom one of each kind. A ready set only offers labels: the app never fills in a
 * value, or suggests what a person or family should say.
 */
export const BIODATA_SECTION_CHOICES: readonly SectionChoice[] = [
    {id: 'personal', label: 'Personal details', once: true, make: () => detailsWith('Personal details', [{label: 'Date of birth', kind: 'date'}, {label: 'Height', kind: 'height'}, 'Marital status', 'Nationality'])},
    {id: 'education', label: 'Education', once: true, make: () => newSection('Education', 'entries')},
    {id: 'work', label: 'Work', once: true, make: () => newSection('Work', 'entries')},
    {id: 'family', label: 'Family', once: true, make: family},
    {id: 'about', label: 'About me', once: true, make: () => newSection('About me', 'text')},
    {id: 'expectations', label: 'Expectations', once: true, make: () => newSection('Expectations', 'text')},
    {id: 'hobbies', label: 'Hobbies', once: true, make: () => newSection('Hobbies', 'tags')},
    {id: 'contact', label: 'Contact', once: true, make: () => detailsWith('Contact', ['Contact person', 'Relation', 'Phone', 'Address'])},
    {id: 'horoscope', label: 'Horoscope', once: true, group: 'sets', make: () => detailsWith('Horoscope', ['Time of birth', 'Place of birth', 'Rashi', 'Nakshatra', 'Gotra', 'Manglik'])},
    {id: 'religion', label: 'Religious practice', once: true, group: 'sets', make: () => detailsWith('Religious practice', ['Sect', 'Prayer', 'Fasting', 'Religious education'])},
    {id: 'lifestyle', label: 'Lifestyle', once: true, group: 'sets', make: () => detailsWith('Lifestyle', ['Diet', 'Smoking', 'Drinking', 'Languages known'])},
    {id: 'more', label: 'More about me', once: true, group: 'sets', make: () => detailsWith('More about me', ['Complexion', 'Blood group', 'Weight'])},
    {id: 'custom-details', label: 'Custom: labels and values', group: 'custom', make: () => newSection('Details', 'details')},
    {id: 'custom-text', label: 'Custom: a paragraph', group: 'custom', make: () => newSection('Custom section', 'text')},
    {id: 'custom-list', label: 'Custom: a list of entries', group: 'custom', make: () => newSection('Custom section', 'entries')},
]
