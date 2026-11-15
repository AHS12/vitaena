import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {BulletList} from '../../components/BulletList'
import {SplitPane} from '../../components/SplitPane'
import {TagInput} from '../../components/TagInput'
import {useDocumentStore} from '../../store/document-store'
import {CvEditor} from '../CvEditor'
import {sampleCv} from '../sample'
import {emailWarning, entryWords, linkWarning, moveSection, newSection, updateEntry} from './edit-ops'

// The pages are Typst's job, tested on their own; here only the editor matters.
vi.mock('../typst/engine', () => ({preview: async () => null, pdf: async () => new Uint8Array()}))

afterEach(cleanup)

describe('changes to a CV', () => {
    it('moves a section and leaves the others in order', () => {
        const cv = sampleCv()
        const moved = moveSection(cv, 4, 0)

        expect(moved.sections.map((section) => section.title)).toEqual(['Skills', 'Summary', 'Experience', 'Education', 'Projects', 'Languages'])
        expect(cv.sections[0].title).toBe('Summary')
    })

    it('changes one entry and keeps every other the same object', () => {
        const cv = sampleCv()
        const next = updateEntry(cv, 'experience', 'e2', {title: 'Lead Engineer'})
        const before = cv.sections[1]
        const after = next.sections[1]

        expect(after.kind === 'entries' && after.entries[1].title).toBe('Lead Engineer')
        expect(before.kind === 'entries' && after.kind === 'entries' && after.entries[0]).toBe(before.kind === 'entries' && before.entries[0])
        expect(next.sections[0]).toBe(cv.sections[0])
    })

    it('starts a new list section with one entry ready to fill in', () => {
        const section = newSection('Projects', 'entries')

        expect(section.kind === 'entries' && section.entries).toHaveLength(1)
    })

    it('names an entry\'s fields to suit its section', () => {
        expect(entryWords('Education').title).toBe('Degree')
        expect(entryWords('Work experience').org).toBe('Company')
        expect(entryWords('Certifications').org).toBe('Issued by')
    })

    it('warns gently about contact details that look wrong, and says nothing about empty ones', () => {
        expect(emailWarning('')).toBeNull()
        expect(emailWarning('jane@example.com')).toBeNull()
        expect(emailWarning('jane@')).not.toBeNull()
        expect(linkWarning('linkedin.com/in/jane')).toBeNull()
        expect(linkWarning('my profile')).not.toBeNull()
    })
})

function Bullets({initial}: {initial: string[]}) {
    const [values, setValues] = useState(initial)

    return (
        <>
            <BulletList label="Achievements" values={values} onChange={setValues} />
            <output data-testid="values">{JSON.stringify(values)}</output>
        </>
    )
}

const valuesNow = () => JSON.parse(screen.getByTestId('values').textContent ?? '[]') as string[]

describe('editing bullets', () => {
    it('starts a new bullet at the cursor with Enter', () => {
        render(<Bullets initial={['Shipped the app and fixed the bugs']} />)
        const first = screen.getByRole('textbox', {name: 'Achievements, bullet 1'}) as HTMLTextAreaElement

        first.setSelectionRange(16, 16)
        fireEvent.keyDown(first, {key: 'Enter'})

        expect(valuesNow()).toEqual(['Shipped the app ', 'and fixed the bugs'])
        expect(document.activeElement).toBe(screen.getByRole('textbox', {name: 'Achievements, bullet 2'}))
    })

    it('joins a bullet to the one above with Backspace at its start', () => {
        render(<Bullets initial={['First', 'second']} />)
        const second = screen.getByRole('textbox', {name: 'Achievements, bullet 2'}) as HTMLTextAreaElement

        second.setSelectionRange(0, 0)
        fireEvent.keyDown(second, {key: 'Backspace'})

        expect(valuesNow()).toEqual(['Firstsecond'])
    })

    it('moves a bullet with Alt and the arrows, and keeps typing in it', () => {
        render(<Bullets initial={['One', 'Two', 'Three']} />)
        const first = screen.getByRole('textbox', {name: 'Achievements, bullet 1'})

        fireEvent.keyDown(first, {key: 'ArrowDown', altKey: true})

        expect(valuesNow()).toEqual(['Two', 'One', 'Three'])
        expect(document.activeElement).toBe(screen.getByRole('textbox', {name: 'Achievements, bullet 2'}))
    })

    it('marks a bullet long enough to be cut short', () => {
        render(<Bullets initial={['x'.repeat(260)]} />)

        expect(screen.getByText(/A highlighted bullet is long/)).toBeInTheDocument()
    })
})

function Tags({initial}: {initial: string[]}) {
    const [values, setValues] = useState(initial)

    return (
        <>
            <TagInput label="Skills" values={values} onChange={setValues} />
            <output data-testid="values">{JSON.stringify(values)}</output>
        </>
    )
}

describe('editing chips', () => {
    it('adds on Enter and on a comma, and skips one already there', () => {
        render(<Tags initial={['Go']} />)
        const input = screen.getByRole('textbox', {name: 'Skills'})

        fireEvent.change(input, {target: {value: 'SQL'}})
        fireEvent.keyDown(input, {key: 'Enter'})
        fireEvent.change(input, {target: {value: 'go, Rust,'}})

        expect(valuesNow()).toEqual(['Go', 'SQL', 'Rust'])
    })

    it('removes with its button, and the last with Backspace in an empty box', () => {
        render(<Tags initial={['Go', 'SQL', 'Rust']} />)

        fireEvent.click(screen.getByRole('button', {name: 'Remove SQL'}))
        fireEvent.keyDown(screen.getByRole('textbox', {name: 'Skills'}), {key: 'Backspace'})

        expect(valuesNow()).toEqual(['Go'])
    })
})

describe('the side pane', () => {
    beforeEach(() => window.localStorage.clear())

    it('folds away with Enter on the divider, and remembers that', () => {
        const {unmount} = render(
            <SplitPane storageKey="test.layout" label="Editor" defaultWidth={400} minWidth={300} side={() => <p>Side</p>}>
                {() => <p>Main</p>}
            </SplitPane>,
        )

        fireEvent.keyDown(screen.getByRole('separator'), {key: 'Enter'})
        expect(screen.queryByText('Side')).toBeNull()

        unmount()
        render(
            <SplitPane storageKey="test.layout" label="Editor" defaultWidth={400} minWidth={300} side={() => <p>Side</p>}>
                {() => <p>Main</p>}
            </SplitPane>,
        )
        expect(screen.queryByText('Side')).toBeNull()
    })
})

describe('the CV editor', () => {
    beforeEach(() => {
        window.localStorage.clear()
        useDocumentStore.getState().startNew()
        useDocumentStore.getState().previewEdit(sampleCv())
    })

    it('moves a section with Alt+↓, as one step to undo', () => {
        render(<CvEditor />)
        const summary = screen.getByRole('region', {name: 'Summary'})

        fireEvent.keyDown(within(summary).getByRole('textbox', {name: 'Section heading'}), {key: 'ArrowDown', altKey: true})
        expect(useDocumentStore.getState().content.sections.map((section) => section.title).slice(0, 2)).toEqual(['Experience', 'Summary'])

        useDocumentStore.getState().undo()
        expect(useDocumentStore.getState().content.sections[0].title).toBe('Summary')
    })

    it('shows each entry folded, with its name and dates', () => {
        render(<CvEditor />)

        expect(screen.getByRole('button', {name: /Senior Software Engineer, Harbourline Payments.*Mar 2022 – Present/})).toHaveAttribute('aria-expanded', 'false')
    })
})

describe('formatting and showing parts', () => {
    beforeEach(() => {
        window.localStorage.clear()
        useDocumentStore.getState().startNew()
        useDocumentStore.getState().previewEdit(sampleCv())
    })

    it('makes the selected words bold with Ctrl+B', () => {
        render(<Bullets initial={['Cut costs by 20%']} />)
        const bullet = screen.getByRole('textbox', {name: 'Achievements, bullet 1'}) as HTMLTextAreaElement

        bullet.setSelectionRange(4, 9)
        fireEvent.keyDown(bullet, {key: 'b', ctrlKey: true})

        expect(valuesNow()).toEqual(['Cut **costs** by 20%'])
    })

    it('leaves an entry\'s dates off the page, keeping them, as one step to undo', () => {
        render(<CvEditor />)

        fireEvent.click(screen.getByRole('button', {name: /^Senior Software Engineer, Harbourline Payments/, expanded: false}))
        fireEvent.click(screen.getByRole('button', {name: 'Dates', pressed: true}))

        const entry = () => {
            const section = useDocumentStore.getState().content.sections[1]

            return section.kind === 'entries' ? section.entries[0] : null
        }

        expect(entry()).toMatchObject({start: '2022-03', hide: ['dates']})
        useDocumentStore.getState().undo()
        expect(entry()?.hide).toEqual([])
    })
})

describe('levels on a list', () => {
    it('turn on with a switch, and a dot sets an item\'s level', () => {
        useDocumentStore.getState().previewEdit(sampleCv())
        render(<CvEditor />)

        const languages = screen.getByRole('region', {name: 'Languages'})
        const bangla = within(languages).getByRole('radiogroup', {name: /^Level of Bangla/})

        fireEvent.click(within(bangla).getByRole('radio', {name: /^3 of 5/}))

        const section = useDocumentStore.getState().content.sections.find((item) => item.id === 'languages')

        expect(section?.kind === 'tags' && section.groups[0].levels).toEqual([3, 4.5])
        // The word the app filled in follows the level; one typed by hand would stay.
        expect(section?.kind === 'tags' && section.groups[0].items[0]).toBe('Bangla (Intermediate)')

        fireEvent.click(within(languages).getByRole('switch', {name: 'Show levels'}))
        const after = useDocumentStore.getState().content.sections.find((item) => item.id === 'languages')

        expect(after?.kind === 'tags' && after.groups[0].showLevels).toBe(false)
        expect(within(languages).queryByRole('radiogroup')).toBeNull()
    })
})

describe('a details section', () => {
    beforeEach(() => {
        useDocumentStore.getState().startNew()
        useDocumentStore.getState().previewEdit({...sampleCv(), sections: [newSection('Personal details', 'details')]})
    })

    const rows = () => {
        const section = useDocumentStore.getState().content.sections[0]

        return section.kind === 'details' ? section.rows : []
    }

    it('takes a label and a value, and adds a date and a height that pick how they show', () => {
        render(<CvEditor />)

        const details = screen.getByRole('region', {name: 'Personal details'})

        fireEvent.change(within(details).getByRole('textbox', {name: 'Label'}), {target: {value: 'Nationality'}})
        fireEvent.change(within(details).getByRole('textbox', {name: 'Nationality value'}), {target: {value: 'British'}})
        fireEvent.click(within(details).getByRole('button', {name: 'Add a height'}))
        fireEvent.change(within(details).getByRole('spinbutton', {name: 'Height, feet'}), {target: {value: '5'}})
        fireEvent.change(within(details).getByRole('spinbutton', {name: 'Height, inches'}), {target: {value: '6'}})
        fireEvent.click(within(details).getByRole('radio', {name: 'cm'}))

        expect(rows()).toMatchObject([
            {label: 'Nationality', kind: 'text', value: 'British'},
            {label: 'Height', kind: 'height', cm: 168, show: 'cm'},
        ])
        expect(within(details).getByRole('spinbutton', {name: 'Height in centimetres'})).toHaveValue(168)
    })

    it('hides a row and removes one, each as a step to undo', () => {
        render(<CvEditor />)

        const details = screen.getByRole('region', {name: 'Personal details'})

        fireEvent.click(within(details).getByRole('button', {name: 'Add a date'}))
        fireEvent.click(within(details).getAllByRole('button', {name: 'Hide this row from the CV'})[0])
        expect(rows().map((row) => row.visible)).toEqual([false, true])

        fireEvent.click(within(details).getByRole('button', {name: 'Remove Date of birth'}))
        expect(rows().map((row) => row.kind)).toEqual(['text'])

        useDocumentStore.getState().undo()
        expect(rows().map((row) => row.kind)).toEqual(['text', 'date'])
    })
})
