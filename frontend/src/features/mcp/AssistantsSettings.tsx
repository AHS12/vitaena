/**
 * Settings, AI assistants: whether an assistant may use the documents, how to connect
 * one, and what assistants did, with a way to put a change back.
 */

import {useCallback, useEffect, useState} from 'react'
import {Select} from '../../components/controls'
import {APP} from '../../core/app'
import {SETTING_SPECS, type ChoiceSetting} from '../../core/settings/settings-spec'
import {copyText} from '../../platform/clipboard'
import {desktopApp} from '../../platform/shell'
import {SettingRow} from '../../shell/SettingRow'
import {useDocumentStore} from '../../store/document-store'
import {useSettingsStore} from '../../store/settings-store'
import {clearActivity, listActivity, putBack, type Activity} from './changes'
import {clientSetups} from './connect'

const ACCESS = SETTING_SPECS.find((spec) => spec.key === 'assistants') as ChoiceSetting

/** The most changes the page lists; the file keeps more. */
const SHOWN = 50

function whenOf(iso: string): string {
    const at = new Date(iso)

    if (Number.isNaN(at.getTime())) {
        return ''
    }

    const time = new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'}).format(at)

    return at.toDateString() === new Date().toDateString() ? `today at ${time}` : `${new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short'}).format(at)} at ${time}`
}

function useProgramPath(): string | null {
    const [path, setPath] = useState<string | null>(null)

    useEffect(() => {
        void desktopApp<{ProgramPath(): Promise<string>}>('mcp')
            ?.ProgramPath()
            .then(setPath)
            .catch(() => undefined)
    }, [])

    return path
}

function ConnectRows() {
    const program = useProgramPath()
    const setups = clientSetups(program ?? `/path/to/${APP.id}`)
    const [client, setClient] = useState(setups[0].id)
    const [copied, setCopied] = useState(false)
    const setup = setups.find((candidate) => candidate.id === client) ?? setups[0]

    return (
        <>
            <h3 className="settings__group">Connect an assistant</h3>
            <SettingRow label="Assistant" help={setup.where}>
                <Select<string>
                    label="Assistant"
                    value={setup.id}
                    options={setups.map((candidate) => ({value: candidate.id, label: candidate.label}))}
                    onChange={(value) => {
                        setClient(value)
                        setCopied(false)
                    }}
                />
            </SettingRow>
            <div className="assistants__snippet">
                <pre className="assistants__code" aria-label={`What to add to ${setup.label}`}>
                    {setup.snippet}
                </pre>
                <button type="button" className="button" onClick={() => void copyText(setup.snippet).then(setCopied)}>
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            {program === null ? <p className="settings__intro">In the desktop app, this shows where {APP.name} is installed.</p> : null}
        </>
    )
}

function ActivityRows() {
    const [list, setList] = useState<readonly Activity[] | null>(null)
    const [problem, setProblem] = useState<string | null>(null)
    const notify = useDocumentStore((state) => state.notify)

    const refresh = useCallback(() => {
        void listActivity()
            .then(setList)
            .catch(() => setList([]))
    }, [])

    useEffect(refresh, [refresh])

    const putItBack = async (activity: Activity) => {
        try {
            await putBack(activity)
            setProblem(null)
            notify(`Put "${activity.documentName}" back as it was before ${activity.client} ${activity.summary}.`)
        } catch (error) {
            setProblem(error instanceof Error ? error.message : String(error))
        }
    }

    return (
        <>
            <h3 className="settings__group">What assistants did</h3>
            {list === null ? null : list.length === 0 ? (
                <p className="settings__intro">Nothing yet. Each change an assistant makes is listed here, with a copy of the document from before.</p>
            ) : (
                <>
                    {problem ? <p className="settings__intro setting__warning">{problem}</p> : null}
                    {list.slice(0, SHOWN).map((activity, index) => (
                        <SettingRow key={`${activity.at}-${index}`} label={`${activity.client} ${activity.summary}`} help={`${activity.documentName}, ${whenOf(activity.at)}`}>
                            {activity.copy ? (
                                <button type="button" className="button" onClick={() => void putItBack(activity)}>
                                    Put back
                                </button>
                            ) : null}
                        </SettingRow>
                    ))}
                    <p className="settings__intro">
                        Put back returns a document to how it was before that change, and keeps how it is now as a copy too. Copies
                        are kept 30 days.{' '}
                        <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                                void clearActivity()
                                    .then(refresh)
                                    .catch(() => undefined)
                            }
                        >
                            Clear the list
                        </button>
                    </p>
                </>
            )}
        </>
    )
}

export function AssistantsSettings() {
    const access = String(useSettingsStore((state) => state.values.assistants) ?? 'off')
    const setValue = useSettingsStore((state) => state.setValue)

    return (
        <>
            <p className="settings__intro">
                Let an AI assistant you already use, such as Claude, Cursor or Copilot, read your CVs and biodata, check them and
                help change them. {APP.name} has no AI of its own: the assistant is yours, and it only reaches your documents
                through {APP.name}, on this computer, when you allow it here.
            </p>
            <SettingRow label={ACCESS.label} help={ACCESS.options.find((option) => option.value === access)?.help ?? ACCESS.help}>
                <Select<string> label={ACCESS.label} value={access} options={ACCESS.options} onChange={(value) => setValue('assistants', value)} />
            </SettingRow>
            <ConnectRows />
            <ActivityRows />
        </>
    )
}
