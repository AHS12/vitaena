/**
 * The made-up biodata in Bangla, with the same people, schools and employer as the
 * English one, all invented. It has no heading line and no religion, as the English one.
 */

import {DEFAULT_BIODATA_DESIGN, type Biodata} from './biodata'

const text = (id: string, label: string, value: string) => ({id, visible: true, label, kind: 'text' as const, value})

const member = (id: string, relation: string, name: string, work: string, note = '') => ({id, visible: true, relation, name, work, note})

export function sampleBiodataBn(): Biodata {
    return {
        heading: {text: '', image: ''},
        person: {name: 'জেন ডো', photo: '', fullPhoto: '', hide: []},
        sections: [
            {
                id: 'personal',
                kind: 'details',
                title: 'ব্যক্তিগত তথ্য',
                visible: true,
                rows: [
                    {id: 'birth', visible: true, label: 'জন্ম তারিখ', kind: 'date', date: '1996-03-12', show: 'both'},
                    {id: 'height', visible: true, label: 'উচ্চতা', kind: 'height', cm: 163, show: 'both'},
                    text('status', 'বৈবাহিক অবস্থা', 'অবিবাহিত'),
                    text('nationality', 'জাতীয়তা', 'বাংলাদেশি'),
                    text('home', 'স্থায়ী ঠিকানা', 'রিভারসাইড'),
                    text('city', 'বর্তমান ঠিকানা', 'ঢাকা'),
                    text('languages', 'ভাষা', 'বাংলা, ইংরেজি'),
                ],
            },
            {
                id: 'education',
                kind: 'entries',
                title: 'শিক্ষাগত যোগ্যতা',
                visible: true,
                entries: [
                    {id: 'msc', visible: true, title: 'অর্থনীতিতে স্নাতকোত্তর', org: 'রিভারসাইড বিশ্ববিদ্যালয়', location: '', start: '2018-01', end: '2019-12', current: false, summary: '', bullets: [], hide: []},
                    {id: 'bsc', visible: true, title: 'অর্থনীতিতে স্নাতক', org: 'রিভারসাইড বিশ্ববিদ্যালয়', location: '', start: '2014-01', end: '2017-12', current: false, summary: '', bullets: [], hide: []},
                ],
            },
            {
                id: 'work',
                kind: 'entries',
                title: 'পেশা',
                visible: true,
                entries: [{id: 'job', visible: true, title: 'গবেষণা বিশ্লেষক', org: 'নর্থগেট পলিসি ইনস্টিটিউট', location: 'ঢাকা', start: '2020-02', end: '', current: true, summary: '', bullets: [], hide: []}],
            },
            {
                id: 'family',
                kind: 'family',
                title: 'পারিবারিক তথ্য',
                visible: true,
                members: [
                    member('father', 'পিতা', 'জন ডো', 'অবসরপ্রাপ্ত সিভিল ইঞ্জিনিয়ার'),
                    member('mother', 'মাতা', 'মেরি ডো', 'স্কুলশিক্ষক'),
                    member('brother', 'ভাই', 'স্যাম ডো', 'চিকিৎসক', 'বিবাহিত'),
                    member('sister', 'বোন', 'অ্যান ডো', 'বিশ্ববিদ্যালয়ের ছাত্রী'),
                ],
            },
            {
                id: 'about',
                kind: 'text',
                title: 'নিজের সম্পর্কে',
                visible: true,
                text: 'শান্ত, কৌতূহলী এবং পরিবারের সঙ্গে ঘনিষ্ঠ। রান্না করতে, দীর্ঘ পথ হাঁটতে আর ইতিহাস নিয়ে পড়তে ভালোবাসি।',
            },
            {
                id: 'expectations',
                kind: 'text',
                title: 'প্রত্যাশিত জীবনসঙ্গী',
                visible: true,
                text: 'দয়ালু ও শিক্ষিত কেউ, যিনি পরিবারকে মূল্য দেন এবং একসঙ্গে শিখতে চান।',
            },
            {
                id: 'contact',
                kind: 'details',
                title: 'যোগাযোগ',
                visible: true,
                rows: [text('person', 'যোগাযোগের ব্যক্তি', 'জন ডো'), text('relation', 'সম্পর্ক', 'পিতা'), text('phone', 'ফোন', '+1 555 0100')],
            },
        ],
        design: {...DEFAULT_BIODATA_DESIGN, language: 'bn', digits: 'native'},
    }
}
