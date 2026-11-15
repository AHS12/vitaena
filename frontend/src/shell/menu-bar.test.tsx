import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'
import {MenuBar} from './MenuBar'

afterEach(cleanup)

describe('The menu bar', () => {
    // A Mac's web view doesn't move focus to what is clicked, so losing focus can't be
    // what closes a menu.
    it('closes an open menu when you press somewhere else, with focus left where it was', async () => {
        render(
            <>
                <MenuBar />
                <div data-testid="elsewhere" />
            </>,
        )

        fireEvent.click(screen.getByRole('button', {name: 'File'}))
        expect(await screen.findByRole('menu')).toBeTruthy()

        act(() => {
            fireEvent.pointerDown(screen.getByTestId('elsewhere'))
        })

        expect(screen.queryByRole('menu')).toBeNull()
    })
})
