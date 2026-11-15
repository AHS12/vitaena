import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ImportPdfDialog} from './ImportPdfDialog'
import {usePdfImport, type ImportStep} from './import-pdf'

const show = (step: ImportStep) => usePdfImport.setState({file: 'jane-cv.pdf', step})

afterEach(() => {
    cleanup()
    usePdfImport.setState({file: null})
})

describe('the import dialog', () => {
    it('shows how many pages it has read, and can be cancelled', () => {
        const cancel = vi.fn()

        usePdfImport.setState({cancel})
        show({kind: 'reading', page: 2, pages: 3})
        render(<ImportPdfDialog />)

        expect(screen.getByRole('dialog', {name: 'Importing jane-cv.pdf'})).toBeInTheDocument()
        expect(screen.getByText('Reading page 2 of 3')).toBeInTheDocument()
        expect(screen.getByRole('progressbar', {name: 'Pages read'})).toHaveAttribute('value', '2')

        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}))
        expect(cancel).toHaveBeenCalled()
    })

    it.each([
        [{kind: 'no-text'} as const, /no text to read/],
        [{kind: 'locked'} as const, /locked with a password/],
        [{kind: 'failed', reason: "It doesn't look like a PDF, or it's damaged."} as const, /Couldn't read this PDF\. It doesn't look like a PDF/],
    ])('says what went wrong and offers only Close: %o', (step, words) => {
        show(step)
        render(<ImportPdfDialog />)

        expect(screen.getByText(words)).toBeInTheDocument()
        expect(screen.queryByRole('button', {name: 'Cancel'})).toBeNull()

        fireEvent.click(screen.getByRole('button', {name: 'Close'}))
        expect(usePdfImport.getState().file).toBeNull()
    })

    it('stays closed when nothing is being imported', () => {
        render(<ImportPdfDialog />)

        expect(screen.queryByRole('dialog')).toBeNull()
    })
})
