import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {useFontPacks} from './downloaded-fonts'
import {FONT_PACKS} from './font-packs'
import {FontPackNotice} from './FontPackNotice'

vi.mock('./typst/engine', () => ({setInstalledPacks: () => undefined}))

afterEach(cleanup)

const japanese = FONT_PACKS.find((pack) => pack.id === 'ja')!

describe('the notice for fonts that are not downloaded', () => {
    it('offers the download with its size, shows its progress, and goes once the fonts are here', async () => {
        render(<FontPackNotice wanted={[japanese]} />)

        expect(screen.getByText(/The fonts for Japanese aren't on this computer yet/)).toBeTruthy()
        fireEvent.click(screen.getByRole('button', {name: 'Download (17 MB)'}))

        expect(await screen.findByText(/Downloading…/)).toBeTruthy()
        await vi.waitFor(() => expect(screen.queryByRole('status')).toBeNull(), {timeout: 3000})
        expect(useFontPacks.getState().packs.find((pack) => pack.id === 'ja')?.installed).toBe(true)
    })

    it('says why a download failed, and offers to try again', async () => {
        useFontPacks.setState({failed: {ko: 'GitHub answered 404 Not Found'}})
        render(<FontPackNotice wanted={[FONT_PACKS.find((pack) => pack.id === 'ko')!]} />)

        expect(screen.getByText(/Couldn't download the fonts for Korean: GitHub answered 404 Not Found/)).toBeTruthy()
        expect(screen.getByRole('button', {name: 'Try again'})).toBeTruthy()
    })
})
