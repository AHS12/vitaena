import {describe, expect, it} from 'vitest'
import {firstPageOnly} from './thumbnail'

const twoPages = `<svg class="typst-doc" viewBox="0 0 596 1684" width="596" height="1684"><script>x()</script>
<g class="typst-page" data-page-width="596" data-page-height="842"></g>
<g class="typst-page" transform="translate(0, 842)" data-page-width="596" data-page-height="842"></g></svg>`

describe('the library picture', () => {
    it('crops to the first page, at tile size, as XML an image can load', () => {
        const svg = firstPageOnly(twoPages)!

        expect(svg).toContain('viewBox="0 0 596 842"')
        expect(svg).toContain('width="360"')
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
        expect(svg).not.toContain('<script')
    })

    it('gives nothing when there are no pages', () => {
        expect(firstPageOnly('<svg></svg>')).toBeNull()
    })
})
