/**
 * A made-up biodata. Tests lay it out, the template gallery shows it, and it shows
 * someone new what a filled-in biodata looks like.
 *
 * Everything in it is invented: the people, the schools, the employer and the phone
 * number. It has no heading line and no religion, since those are each person's own to
 * choose, and the app never suggests either.
 */

import {DEFAULT_BIODATA_DESIGN, NO_SECOND, type Biodata} from './biodata'
import {isLanguage} from '../core/labels/labels'
import {inLanguage} from '../cv/relabel'
import {sampleBiodataBn} from './sample-bn'

const text = (id: string, label: string, value: string) => ({id, visible: true, label, kind: 'text' as const, value})

const member = (id: string, relation: string, name: string, work: string, note = '') => ({id, visible: true, relation, name, work, note})

/**
 * The example in a language: Bangla has its own; any other is the English one with its
 * headings and labels in that language.
 */
export function sampleBiodata(language = 'en'): Biodata {
    if (language === 'bn') {
        return sampleBiodataBn()
    }

    return isLanguage(language) && language !== 'en' ? inLanguage(englishBiodata(), language) : englishBiodata()
}

function englishBiodata(): Biodata {
    return {
        heading: {text: '', image: ''},
        person: {name: 'Jane Doe', photo: '', fullPhoto: '', hide: []},
        sections: [
            {
                id: 'personal',
                kind: 'details',
                title: 'Personal details',
                visible: true,
                rows: [
                    {id: 'birth', visible: true, label: 'Date of birth', kind: 'date', date: '1996-03-12', show: 'both'},
                    {id: 'height', visible: true, label: 'Height', kind: 'height', cm: 163, show: 'both'},
                    text('status', 'Marital status', 'Never married'),
                    text('nationality', 'Nationality', 'Bangladeshi'),
                    text('home', 'Home town', 'Riverside'),
                    text('city', 'Current city', 'Dhaka'),
                    text('languages', 'Languages', 'Bangla, English'),
                ],
            },
            {
                id: 'education',
                kind: 'entries',
                title: 'Education',
                visible: true,
                entries: [
                    {id: 'msc', visible: true, title: 'MSc in Economics', org: 'Riverside University', location: '', start: '2018-01', end: '2019-12', current: false, summary: '', bullets: [], hide: []},
                    {id: 'bsc', visible: true, title: 'BSc in Economics', org: 'Riverside University', location: '', start: '2014-01', end: '2017-12', current: false, summary: '', bullets: [], hide: []},
                ],
            },
            {
                id: 'work',
                kind: 'entries',
                title: 'Work',
                visible: true,
                entries: [{id: 'job', visible: true, title: 'Research Analyst', org: 'Northgate Policy Institute', location: 'Dhaka', start: '2020-02', end: '', current: true, summary: '', bullets: [], hide: []}],
            },
            {
                id: 'family',
                kind: 'family',
                title: 'Family',
                visible: true,
                members: [
                    member('father', 'Father', 'John Doe', 'Retired civil engineer'),
                    member('mother', 'Mother', 'Mary Doe', 'Schoolteacher'),
                    member('brother', 'Brother', 'Sam Doe', 'Doctor', 'Married'),
                    member('sister', 'Sister', 'Ann Doe', 'University student'),
                ],
            },
            {
                id: 'about',
                kind: 'text',
                title: 'About me',
                visible: true,
                text: 'Calm, curious and close to my family. I enjoy cooking, long walks and reading about history.',
            },
            {
                id: 'expectations',
                kind: 'text',
                title: 'Expectations',
                visible: true,
                text: 'Someone kind and well educated, who values family and wants to keep learning together.',
            },
            {
                id: 'contact',
                kind: 'details',
                title: 'Contact',
                visible: true,
                rows: [text('person', 'Contact person', 'John Doe'), text('relation', 'Relation', 'Father'), text('phone', 'Phone', '+1 555 0100')],
            },
        ],
        second: NO_SECOND,
        design: {...DEFAULT_BIODATA_DESIGN},
    }
}
