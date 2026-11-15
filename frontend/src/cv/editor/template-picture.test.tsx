import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'
import {TemplatePicture} from './TemplatePicture'

afterEach(cleanup)

describe('a template card\'s picture', () => {
    it('shows a sketch of a page until the picture is ready', () => {
        const {container, rerender} = render(<TemplatePicture src={undefined} />)

        expect(screen.getByTestId('template-loading')).toBeInTheDocument()
        expect(container.querySelector('img')).toBeNull()

        rerender(<TemplatePicture src="blob:page" />)

        expect(screen.queryByTestId('template-loading')).toBeNull()
        expect(container.querySelector('img')).toHaveAttribute('src', 'blob:page')
    })
})
