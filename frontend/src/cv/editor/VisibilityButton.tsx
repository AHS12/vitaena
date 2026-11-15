import {Eye, EyeOff} from 'lucide-react'

/** Shows or hides one part of the CV on the page, keeping it in the file either way. */
export function VisibilityButton({visible, what, onToggle}: {visible: boolean; what: string; onToggle(): void}) {
    return (
        <button type="button" className="icon-button" aria-pressed={!visible} aria-label={visible ? `Hide ${what} from the CV` : `Show ${what} on the CV`} title={visible ? 'Shown on the CV. Click to hide.' : 'Hidden from the CV. Click to show.'} onClick={onToggle}>
            {visible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
        </button>
    )
}
