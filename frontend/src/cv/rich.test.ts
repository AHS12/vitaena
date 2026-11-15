import {describe, expect, it} from 'vitest'
import {parseRich, plainOf} from './rich'

describe('formatting in CV text', () => {
    it('leaves plain text as one span', () => {
        expect(parseRich('Cut costs by 20%')).toEqual([{text: 'Cut costs by 20%'}])
    })

    it('reads bold, italic and links', () => {
        expect(parseRich('Led **14 engineers** on *Ledger*, see [the talk](youtube.com/x)')).toEqual([
            {text: 'Led '},
            {text: '14 engineers', bold: true},
            {text: ' on '},
            {text: 'Ledger', italic: true},
            {text: ', see '},
            {text: 'the talk', url: 'https://youtube.com/x'},
        ])
    })

    it('takes underscores for italic only around whole words', () => {
        expect(parseRich('_quietly_ fixed snake_case_names')).toEqual([{text: 'quietly', italic: true}, {text: ' fixed snake_case_names'}])
    })

    it('leaves a lone star or a maths star alone', () => {
        expect(parseRich('Rated 4.9 * by users, 2 * 3 = 6')).toEqual([{text: 'Rated 4.9 * by users, 2 * 3 = 6'}])
    })

    it('keeps a link\'s address in plain text', () => {
        expect(plainOf(parseRich('See [my site](https://nadia.dev) and [nadia.dev](nadia.dev)'))).toBe('See my site (nadia.dev) and nadia.dev')
    })
})
