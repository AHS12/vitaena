/**
 * Levels on list items, such as how well someone speaks a language: one to five, drawn
 * as dots or a bar by the templates. An item may also carry a word in brackets after
 * its name, "Bangla (Native)", which is printed beside the level.
 */

/** Words for how well someone speaks or knows something, as a level out of five. */
const LEVEL_WORDS: readonly [RegExp, number][] = [
    [/native|mother|fluent|bilingual|expert|c2|মাতৃভাষা|সাবলীল|দক্ষ|मातृभाषा|धाराप्रवाह|अस्खलित|مادری|روانی|اللغة الأم|لغة أم|طلاقة|ممتاز|روان|عالی/i, 5],
    [/advanced|proficient|professional|c1|উন্নত|ভালো|उन्नत|प्रवीण|اعلیٰ|ماہر|متقدم|جيد جدا|پیشرفته|خیلی خوب/i, 4],
    [/intermediate|upper|working|b2|b1|মধ্যম|কাজ চালানোর মতো|मध्यम|درمیانہ|متوسط|جيد/i, 3],
    [/conversational|elementary|basic|limited|a2|প্রাথমিক|সাধারণ|प्रारंभिक|बुनियादी|प्राथमिक|بنیادی|ابتدائی|مبتدئ|أساسي|اساسي|مبتدی|پایه/i, 2],
    [/beginner|starter|a1|শিক্ষানবিশ|नौसिखिया/i, 1],
]

/** The words a level stands for, offered as the note when someone picks a level. */
export const LEVEL_NAMES: readonly string[] = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Native']

/** "Bangla (Native)" as its name and the note in brackets, which may be empty. */
export function splitItem(text: string): {name: string; note: string} {
    const match = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(text)

    return {name: (match ? match[1] : text).trim(), note: match ? match[2].trim() : ''}
}

/** The item written back: its name, then the note in brackets when there is one. */
export const joinItem = (name: string, note: string): string => (note.trim() ? `${name.trim()} (${note.trim()})` : name.trim())

/** The level a note's words name, 1 to 5, or 0 when they name none. */
export const levelOfWords = (note: string): number => LEVEL_WORDS.find(([words]) => words.test(note))?.[1] ?? 0

/** Each item's level, carried across a change to the items by name, so reordering or removing one keeps the rest. */
export function levelsFor(items: readonly string[], before: {items: readonly string[]; levels: readonly number[]}): number[] {
    const known = new Map(before.items.map((item, index) => [splitItem(item).name.toLowerCase(), before.levels[index] ?? 0]))

    return items.map((item) => known.get(splitItem(item).name.toLowerCase()) ?? levelOfWords(splitItem(item).note))
}

/** Levels read from the items' own words, for a group that had none set. */
export const levelsFromWords = (items: readonly string[]): number[] => items.map((item) => levelOfWords(splitItem(item).note))

/** A group's level fields for its items: shown when every item names a level in words. */
export function withWordLevels(items: readonly string[]): {showLevels: boolean; levels: number[]} {
    const levels = levelsFromWords(items)

    return {showLevels: levels.length > 0 && levels.every((level) => level > 0), levels}
}
