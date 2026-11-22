import type {Labels} from './labels'

/**
 * Arabic, in Modern Standard Arabic as CVs across the Arab world write it. Months are the
 * names used in Egypt, the Gulf and Morocco; import also reads the Levant's and the
 * Maghreb's.
 */
export const ar: Labels = {
    sections: {
        summary: 'الملخص المهني',
        experience: 'الخبرة العملية',
        education: 'المؤهلات العلمية',
        skills: 'المهارات',
        projects: 'المشاريع',
        certifications: 'الشهادات والدورات',
        languages: 'اللغات',
        volunteering: 'العمل التطوعي',
        awards: 'الجوائز',
        publications: 'المنشورات',
        interests: 'الاهتمامات',
        personalDetails: 'البيانات الشخصية',
        custom: 'قسم جديد',
        details: 'التفاصيل',
        work: 'العمل',
        family: 'معلومات العائلة',
        aboutMe: 'نبذة عني',
        expectations: 'مواصفات شريك الحياة',
        hobbies: 'الهوايات',
        contact: 'التواصل',
        horoscope: 'الأبراج',
        religiousPractice: 'الالتزام الديني',
        lifestyle: 'نمط الحياة',
        moreAboutMe: 'معلومات إضافية',
        digitalSkills: 'المهارات الرقمية',
    },
    rows: {
        dateOfBirth: 'تاريخ الميلاد',
        height: 'الطول',
        maritalStatus: 'الحالة الاجتماعية',
        religion: 'الديانة',
        nationality: 'الجنسية',
        homeTown: 'مسقط الرأس',
        currentCity: 'مدينة الإقامة',
        contactPerson: 'جهة الاتصال',
        relation: 'صلة القرابة',
        phone: 'الهاتف',
        address: 'العنوان',
        timeOfBirth: 'وقت الميلاد',
        placeOfBirth: 'مكان الميلاد',
        rashi: 'راشي',
        nakshatra: 'ناكشاترا',
        gotra: 'غوترا',
        manglik: 'مانغليك',
        sect: 'المذهب',
        prayer: 'الصلاة',
        fasting: 'الصيام',
        religiousEducation: 'التعليم الديني',
        diet: 'النظام الغذائي',
        smoking: 'التدخين',
        drinking: 'الكحول',
        languagesKnown: 'اللغات التي أتقنها',
        complexion: 'لون البشرة',
        bloodGroup: 'فصيلة الدم',
        weight: 'الوزن',
        father: 'الأب',
        mother: 'الأم',
        brother: 'الأخ',
        sister: 'الأخت',
        visaStatus: 'حالة التأشيرة',
        drivingLicence: 'رخصة القيادة',
    },
    page: {
        present: 'حتى الآن',
        monthsShort: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
        // Arabic counts in three forms: one and two have words of their own, three to ten
        // take the plural, and eleven on the singular again.
        years: (count) => {
            const n = Number(count)

            return n === 1 ? 'سنة واحدة' : n === 2 ? 'سنتان' : n % 100 >= 3 && n % 100 <= 10 ? `${count} سنوات` : `${count} سنة`
        },
        cm: 'سم',
        name: 'الاسم',
        work: 'العمل',
        note: 'ملاحظات',
        cefr: {listening: 'الاستماع', reading: 'القراءة', interaction: 'المحادثة', production: 'التعبير الشفهي', writing: 'الكتابة', motherTongue: 'اللغة الأم', native: 'اللغة الأم'},
    },
}
