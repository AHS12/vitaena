/**
 * The made-up CV in Bangla: the same invented person, employers and schools as the
 * English one. Names of products, tools and companies stay in English letters, as Bangla
 * CVs write them.
 */

import {DEFAULT_DESIGN, type Cv, type CvEntry} from './cv'

const job = (id: string, title: string, org: string, start: string, end: string, bullets: string[], current = false): CvEntry => ({
    id,
    visible: true,
    title,
    org,
    location: 'ঢাকা, বাংলাদেশ',
    start,
    end,
    current,
    summary: '',
    bullets,
    hide: [],
})

export function sampleCvBn(): Cv {
    return {
        person: {
            name: 'জেন ডো',
            headline: 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার',
            email: 'jane.doe@example.com',
            phone: '+1 555 0100',
            location: 'ঢাকা, বাংলাদেশ',
            links: [{id: 'link-1', label: '', url: 'https://www.example.com/jane-doe'}],
            photo: '',
            hide: [],
        },
        sections: [
            {
                id: 'summary',
                kind: 'text',
                title: 'সারসংক্ষেপ',
                visible: true,
                text: 'পেমেন্ট ও লজিস্টিকস প্ল্যাটফর্ম তৈরিতে নয় বছরের অভিজ্ঞ ইঞ্জিনিয়ার। ধীর সিস্টেমকে দ্রুত করা এবং আশপাশের সহকর্মীদের এগিয়ে নেওয়ার জন্য পরিচিত।',
            },
            {
                id: 'experience',
                kind: 'entries',
                title: 'কর্ম অভিজ্ঞতা',
                visible: true,
                entries: [
                    job('e1', 'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার', 'Harbourline Payments', '2022-03', '', ['Go-তে সেটেলমেন্ট সার্ভিস নতুন করে লেখার নেতৃত্ব দিয়েছি; রাতের কাজের সময় ৪ ঘণ্টা থেকে ২৫ মিনিটে নেমেছে।', 'প্রতারণা শনাক্তের পাইপলাইন নকশা করেছি, যা এখন দিনে ২০ লাখ লেনদেন যাচাই করে।', 'ছয়জন ইঞ্জিনিয়ারকে পরামর্শ দিয়েছি; তাঁদের তিনজন এক বছরের মধ্যে পদোন্নতি পেয়েছেন।'], true),
                    job('e2', 'সফটওয়্যার ইঞ্জিনিয়ার', 'Swiftly Rides', '2019-01', '2022-02', ['পাঁচ শহরের প্রতিটি রাইড ও ডেলিভারির জন্য ড্রাইভার মেলানোর সার্ভিস তৈরি করেছি।', 'ক্যাশিং ও কোয়েরি নতুন করে সাজিয়ে API-র p95 সময় ৯০০ ms থেকে ১৮০ ms-এ এনেছি।', 'অন-কল রোটেশন চালিয়েছি এবং ঘটনা পর্যালোচনার নিয়ম লিখেছি, যা দল এখনো ব্যবহার করে।']),
                    job('e3', 'সফটওয়্যার ইঞ্জিনিয়ার', 'Brightleaf Software', '2016-07', '2018-12', ['স্বাস্থ্য ও আর্থিক খাতের গ্রাহকদের জন্য C#, TypeScript ও PostgreSQL-এ প্রকল্প সম্পন্ন করেছি।', 'রিলিজ বিল্ড স্বয়ংক্রিয় করে ডিপ্লয়ের সময় এক দিনের হাতের কাজ থেকে ২০ মিনিটে এনেছি।']),
                    job('e4', 'জুনিয়র ডেভেলপার', 'Meridian Systems', '2015-01', '2016-06', ['৪০টি ক্লিনিকে ব্যবহৃত হাসপাতালের রেকর্ড সিস্টেম রক্ষণাবেক্ষণ করেছি।', '২০০টির বেশি ত্রুটি সারিয়েছি এবং প্রকল্পে প্রথম স্বয়ংক্রিয় টেস্ট যোগ করেছি।']),
                ],
            },
            {
                id: 'education',
                kind: 'entries',
                title: 'শিক্ষাগত যোগ্যতা',
                visible: true,
                entries: [
                    {
                        id: 'ed1',
                        visible: true,
                        title: 'কম্পিউটার বিজ্ঞান ও প্রকৌশলে বিএসসি',
                        org: 'রিভারসাইড ইনস্টিটিউট অব টেকনোলজি',
                        location: 'ঢাকা, বাংলাদেশ',
                        start: '2010-01',
                        end: '2014-12',
                        current: false,
                        summary: 'শহরের ডেলিভারি বহরের জন্য দ্রুত রুট পরিকল্পনা নিয়ে থিসিস।',
                        bullets: [],
                        hide: [],
                    },
                ],
            },
            {
                id: 'projects',
                kind: 'entries',
                title: 'প্রকল্প',
                visible: true,
                entries: [
                    job('p1', 'ওপেন-সোর্স রক্ষণাবেক্ষণকারী', 'calendar-kit', '2020-05', '', ['ক্যালেন্ডারের তারিখ নিয়ে কাজের একটি Go লাইব্রেরি, ৩০০টির বেশি প্রকল্পে ব্যবহৃত।', 'পূর্ণ টেস্ট ও ডকুমেন্টেশন সাইট লিখেছি।'], true),
                    job('p2', 'বক্তা', 'City Go Meetup', '2023-09', '2023-09', ['আলোচনা: "ধীর অংশটি খুঁজে বের করা" – প্রোডাকশনে Go সার্ভিসের প্রোফাইলিং।']),
                ],
            },
            {
                id: 'skills',
                kind: 'tags',
                title: 'দক্ষতা',
                visible: true,
                groups: [
                    {id: 'g1', visible: true, showLevels: false, levels: [], label: 'প্রোগ্রামিং ভাষা', items: ['Go', 'TypeScript', 'C#', 'SQL']},
                    {id: 'g2', visible: true, showLevels: false, levels: [], label: 'সিস্টেম', items: ['PostgreSQL', 'Kafka', 'Redis', 'Kubernetes', 'AWS']},
                    {id: 'g3', visible: true, showLevels: false, levels: [], label: 'চর্চা', items: ['সিস্টেম ডিজাইন', 'পারফরম্যান্স টিউনিং', 'কোড রিভিউ', 'মেন্টরিং']},
                ],
            },
            {
                id: 'languages',
                kind: 'tags',
                title: 'ভাষা',
                visible: true,
                groups: [{id: 'g4', visible: true, showLevels: true, levels: [5, 4.5], label: '', items: ['বাংলা (মাতৃভাষা)', 'ইংরেজি (উন্নত)']}],
            },
        ],
        design: {...DEFAULT_DESIGN, language: 'bn'},
    }
}
