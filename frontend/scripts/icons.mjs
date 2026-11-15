// Makes every app icon file from the SVGs, so they're drawn once and stay in step.
// Run with `make icons` after changing an SVG.
//
//   build/appicon.svg            the full icon: installer, taskbar, Dock, the website
//   frontend/public/favicon.svg  the same mark with fewer, thicker lines, for 16–48 px
//   build/icon-src/tray-mac.svg  black on clear, for the Mac menu bar
//
// The Windows .ico takes its small sizes from the small art, since the full art shrunk to
// 16 px turns its lines to a smudge. The Mac .icns is made from appicon.png by the build.

import {readFileSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {Resvg} from '@resvg/resvg-js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const at = (path) => root + path

const png = (svgPath, size) => new Resvg(readFileSync(at(svgPath)), {fitTo: {mode: 'width', value: size}}).render().asPng()

/** A Windows .ico of PNG entries, which every Windows since Vista reads. */
function ico(entries) {
    const header = Buffer.alloc(6)

    header.writeUInt16LE(1, 2)
    header.writeUInt16LE(entries.length, 4)

    let offset = 6 + 16 * entries.length
    const directory = entries.map(([size, data]) => {
        const entry = Buffer.alloc(16)

        // 0 means 256 in an .ico directory.
        entry.writeUInt8(size >= 256 ? 0 : size, 0)
        entry.writeUInt8(size >= 256 ? 0 : size, 1)
        entry.writeUInt16LE(1, 4)
        entry.writeUInt16LE(32, 6)
        entry.writeUInt32LE(data.length, 8)
        entry.writeUInt32LE(offset, 12)
        offset += data.length
        return entry
    })

    return Buffer.concat([header, ...directory, ...entries.map(([, data]) => data)])
}

const FULL = 'build/appicon.svg'
const SMALL = 'frontend/public/favicon.svg'

writeFileSync(at('build/appicon.png'), png(FULL, 1024))
writeFileSync(
    at('build/windows/icon.ico'),
    ico([16, 24, 32, 48, 64, 128, 256].map((size) => [size, png(size <= 48 ? SMALL : FULL, size)])),
)
writeFileSync(at('backend/tray-mac.png'), png('build/icon-src/tray-mac.svg', 44))

console.log('Made build/appicon.png, build/windows/icon.ico and backend/tray-mac.png')
