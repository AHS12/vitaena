import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useDocumentStore} from '../store/document-store'
import type {Biodata} from './biodata'
import {BiodataEditor} from './BiodataEditor'

// The pages are Typst's job, tested on their own; here only the editor matters.
vi.mock('../cv/typst/engine', () => ({preview: async () => null, pdf: async () => new Uint8Array(), whenIdle: async () => undefined, svg: async () => ''}))

const biodata = () => useDocumentStore.getState().content as Biodata

beforeEach(() => useDocumentStore.getState().startNew(undefined, 'biodata'))
afterEach(cleanup)

describe('the biodata editor', () => {
    it('takes a heading line and a name, each kept as one step to undo', () => {
        render(<BiodataEditor />)

        fireEvent.change(screen.getByRole('textbox', {name: 'Line above your name'}), {target: {value: 'A line of my own'}})
        fireEvent.blur(screen.getByRole('textbox', {name: 'Line above your name'}))
        fireEvent.change(screen.getByRole('textbox', {name: 'Full name'}), {target: {value: 'Jane Doe'}})
        fireEvent.blur(screen.getByRole('textbox', {name: 'Full name'}))

        expect(biodata().heading.text).toBe('A line of my own')
        expect(biodata().person.name).toBe('Jane Doe')

        useDocumentStore.getState().undo()
        expect(biodata().person.name).toBe('')
    })

    it('fills in the family, one row each, and adds someone else', () => {
        render(<BiodataEditor />)

        const family = screen.getByRole('region', {name: 'Family'})

        fireEvent.change(within(family).getByRole('textbox', {name: 'Father name'}), {target: {value: 'John Doe'}})
        fireEvent.click(within(family).getByRole('button', {name: 'Add someone'}))
        fireEvent.change(within(family).getAllByRole('textbox', {name: 'Relation'})[2], {target: {value: 'Brother'}})
        fireEvent.change(within(family).getByRole('textbox', {name: 'Note on Brother'}), {target: {value: 'Married'}})

        const section = biodata().sections.find((item) => item.kind === 'family')

        expect(section?.kind === 'family' && section.members.map(({relation, name, note}) => [relation, name, note])).toEqual([
            ['Father', 'John Doe', ''],
            ['Mother', '', ''],
            ['Brother', '', 'Married'],
        ])
    })

    it('starts with the personal details ready to fill in, the date of birth shown as date and age', () => {
        render(<BiodataEditor />)

        const personal = screen.getByRole('region', {name: 'Personal details'})

        expect(within(personal).getAllByRole('textbox', {name: 'Label'}).map((input) => (input as HTMLInputElement).value)).toEqual(['Date of birth', 'Height', 'Marital status', 'Religion', 'Nationality', 'Home town', 'Current city'])
        expect(within(within(personal).getByRole('radiogroup', {name: 'Show Date of birth as'})).getByRole('radio', {name: 'Both', checked: true})).toBeInTheDocument()
    })
})
