/**
 * A group of languages on the European scale: each language with its level for all five
 * skills at once, or one by one for listening, reading, spoken interaction, spoken
 * production and writing, as Europass asks.
 */

import {allAt, CEFR_LEVELS, CEFR_SKILLS, type CefrLevel} from '../cefr'

const SKILL_NAMES = {listening: 'Listening', reading: 'Reading', interaction: 'Spoken interaction', production: 'Spoken production', writing: 'Writing'} as const

const SHORT = {listening: 'Listen', reading: 'Read', interaction: 'Talk', production: 'Speak', writing: 'Write'} as const

const LEVEL_LABEL = (level: CefrLevel): string => (level === '' ? '–' : level === 'native' ? 'Native' : level)

function LevelSelect({label, value, onChange, mixed}: {label: string; value: CefrLevel; onChange(level: CefrLevel): void; mixed?: boolean}) {
    return (
        <select className="cefr-grid__select" aria-label={label} value={mixed ? 'mixed' : value} onChange={(event) => onChange(event.target.value as CefrLevel)}>
            {mixed ? (
                <option value="mixed" disabled>
                    Mixed
                </option>
            ) : null}
            {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                    {LEVEL_LABEL(level)}
                </option>
            ))}
        </select>
    )
}

export function CefrGrid({items, cefr, onChange}: {items: readonly string[]; cefr: readonly (readonly CefrLevel[])[]; onChange(cefr: CefrLevel[][]): void}) {
    const set = (index: number, levels: CefrLevel[]) => onChange(items.map((_, each) => (each === index ? levels : [...(cefr[each] ?? allAt(''))])))

    if (items.length === 0) {
        return <p className="form-field__hint">Add each language above, then its level here.</p>
    }

    return (
        <div className="cefr-grid" role="table" aria-label="European levels">
            <div className="cefr-grid__row cefr-grid__row--head" role="row">
                <span role="columnheader">Language</span>
                <span role="columnheader" title="The same level for every skill">
                    All
                </span>
                {CEFR_SKILLS.map((skill) => (
                    <span key={skill} role="columnheader" title={SKILL_NAMES[skill]}>
                        {SHORT[skill]}
                    </span>
                ))}
            </div>
            {items.map((item, index) => {
                const levels = cefr[index] ?? allAt('')
                const same = levels.every((level) => level === levels[0])

                return (
                    <div key={`${item}-${index}`} className="cefr-grid__row" role="row">
                        <span className="cefr-grid__name" role="rowheader">
                            {item}
                        </span>
                        <LevelSelect label={`${item}, every skill`} value={levels[0]} mixed={!same} onChange={(level) => set(index, allAt(level))} />
                        {CEFR_SKILLS.map((skill, at) => (
                            <LevelSelect key={skill} label={`${item}, ${SKILL_NAMES[skill].toLowerCase()}`} value={levels[at]} onChange={(level) => set(index, levels.map((old, each) => (each === at ? level : old)))} />
                        ))}
                    </div>
                )
            })}
            <p className="form-field__hint">A1 and A2 are basic, B1 and B2 independent, C1 and C2 proficient. Europass gives each skill its own; All sets the five at once.</p>
        </div>
    )
}
