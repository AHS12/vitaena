/** The field for a second label, in the editor parts every type made of sections shares. */

import {useSecondLabels} from './second-labels-context'

/** The small field for an item's second label, or nothing when second labels are off. */
export function SecondLabel({id, of}: {id: string; of: string}) {
    const second = useSecondLabels()

    if (!second) {
        return null
    }

    return (
        <input
            className="form-field__input second-label"
            aria-label={`${of || 'Label'}, second language`}
            value={second.get(id)}
            placeholder={`In ${second.language}`}
            onChange={(event) => second.type(id, event.target.value)}
            onBlur={second.commit}
        />
    )
}
