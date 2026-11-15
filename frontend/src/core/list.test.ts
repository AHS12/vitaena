import {describe, expect, it} from 'vitest'
import {moveItem} from './list'

describe('moving an item in a list', () => {
    it('moves down and up', () => {
        expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
        expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
    })

    it('leaves the list as it was when the move goes nowhere', () => {
        const list = ['a', 'b']

        expect(moveItem(list, 0, 5)).toEqual(['a', 'b'])
        expect(moveItem(list, -1, 0)).toEqual(['a', 'b'])
        expect(moveItem(list, 1, 1)).toEqual(['a', 'b'])
    })

    it('never changes the list it was given', () => {
        const list = ['a', 'b', 'c']

        moveItem(list, 0, 2)
        expect(list).toEqual(['a', 'b', 'c'])
    })
})
