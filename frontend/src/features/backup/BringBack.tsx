import {ArchiveRestore} from 'lucide-react'
import {libraryWords} from '../../store/document-types'
import {useUiStore} from '../../store/ui-store'
import {canBackUp} from './platform'

/** Home's way back, before anything is saved: work may be in a backup from another computer. */
export function BringBack() {
    return canBackUp() ? (
        <button type="button" className="button" onClick={() => useUiStore.getState().openSettings('Backup')}>
            <ArchiveRestore size={13} aria-hidden="true" />
            Bring back {libraryWords().plural} from a backup
        </button>
    ) : null
}
