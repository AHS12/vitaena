import {Eye, EyeOff} from 'lucide-react'

/** Shows or hides one part of the CV on the page, keeping it in the file either way. */
export function VisibilityButton({visible, what, onToggle}: {visible: boolean; what: string; onToggle(): void}) {
    return (
        <button type="button" className="icon-button" aria-pressed={!visible} aria-label={visible ? `Hide ${what} from the page` : `Show ${what} on the page`} title={visible ? 'Shown on the page. Click to hide.' : 'Hidden from the page. Click to show.'} onClick={onToggle}>
            {visible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
        </button>
    )
}
