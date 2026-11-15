// @vitest-environment node

/** Finding the photo in a PDF: which picture it is, and its pixels. */

import {crc32, deflateSync} from 'node:zlib'
import {beforeAll, describe, expect, it} from 'vitest'
import type {TypstCompiler} from '@myriaddreamin/typst.ts'
import {renderModel} from '../render-model'
import {sampleCv} from '../sample'
import {templatePdf, typstCompiler} from '../../tests/typst'
import {photoFrom, photoPlacement, picturePlacements, type Operators} from './photo'
import {readPdfLayout} from './read-pdf'

/** A 40 by 40 PNG, red on the left half and blue on the right, as a data URL. */
function twoColourPng(): string {
    const side = 40
    const row = () => Buffer.concat([Buffer.from([0]), ...Array.from({length: side}, (_, x) => Buffer.from(x < side / 2 ? [0xc0, 0x40, 0x40] : [0x40, 0x40, 0xc0]))])
    const chunk = (type: string, data: Buffer) => {
        const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
        const length = Buffer.alloc(4)
        const check = Buffer.alloc(4)

        length.writeUInt32BE(data.length)
        check.writeUInt32BE(crc32(body))
        return Buffer.concat([length, body, check])
    }
    const header = Buffer.alloc(13)

    header.writeUInt32BE(side, 0)
    header.writeUInt32BE(side, 4)
    header.set([8, 2, 0, 0, 0], 8)

    const png = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', header),
        chunk('IDAT', deflateSync(Buffer.concat(Array.from({length: side}, row)))),
        chunk('IEND', Buffer.alloc(0)),
    ])

    return `data:image/png;base64,${png.toString('base64')}`
}

const OPS: Operators = {save: 10, restore: 11, transform: 12, paintFormXObjectBegin: 74, paintFormXObjectEnd: 75, paintImageXObject: 85, paintImageXObjectRepeat: 88}

describe('where pictures are drawn', () => {
    it('follows the transforms to each picture, through saves and restores', () => {
        const placements = picturePlacements(
            [OPS.save, OPS.transform, OPS.transform, OPS.paintImageXObject, OPS.restore, OPS.transform, OPS.paintImageXObject],
            [null, [1, 0, 0, 1, 400, 700], [80, 0, 0, 90, 0, 0], ['img_photo', 1, 1], null, [12, 0, 0, 12, 50, 50], ['img_icon', 1, 1]],
            OPS,
        )

        expect(placements).toEqual([
            {id: 'img_photo', x: 400, y: 700, width: 80, height: 90},
            {id: 'img_icon', x: 50, y: 50, width: 12, height: 12},
        ])
    })

    it('takes the largest photo-sized picture, not an icon or a background', () => {
        const at = (id: string, width: number, height: number) => ({id, x: 0, y: 0, width, height})

        expect(photoPlacement([at('icon', 12, 12), at('photo', 80, 90), at('background', 595, 842), at('banner', 400, 60)], 595)?.id).toBe('photo')
        expect(photoPlacement([at('icon', 12, 12), at('banner', 400, 60)], 595)).toBeNull()
    })

    it('reads RGB pixels as RGBA', () => {
        expect(photoFrom({width: 1, height: 2, kind: 2, data: new Uint8Array([1, 2, 3, 4, 5, 6])})?.rgba).toEqual(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]))
    })
})

describe('the photo in a PDF', () => {
    let compiler: TypstCompiler

    beforeAll(async () => {
        compiler = await typstCompiler()
    }, 60_000)

    it('is found in a template that shows one, with its pixels', async () => {
        const cv = sampleCv()
        const pdf = await templatePdf(compiler, new URL('../templates/professional.typ', import.meta.url), '/cv.json', renderModel({...cv, person: {...cv.person, photo: twoColourPng()}}))
        const {photo} = await readPdfLayout(pdf)

        expect(photo).toMatchObject({width: 40, height: 40})
        // Red on the left, blue on the right, as drawn.
        expect([...photo!.rgba!.slice(0, 3)]).toEqual([0xc0, 0x40, 0x40])
        expect([...photo!.rgba!.slice(39 * 4, 39 * 4 + 3)]).toEqual([0x40, 0x40, 0xc0])
    })

    it('is null when there is none', async () => {
        const pdf = await templatePdf(compiler, new URL('../templates/professional.typ', import.meta.url), '/cv.json', renderModel(sampleCv()))

        expect((await readPdfLayout(pdf)).photo).toBeNull()
    })
})
