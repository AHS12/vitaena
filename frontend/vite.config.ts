import {createReadStream, existsSync} from 'node:fs'
import {join} from 'node:path'
import {defineConfig, type Plugin} from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import {pxToRem} from './src/core/settings/px-to-rem'

/**
 * Pictures of saved documents are served by Go, which answers them before Vite is
 * asked. In a plain browser there is no Go, and Vite would answer every unknown
 * address with the app's page, so this says plainly that it has no such file.
 */
function leavePicturesToGo(): Plugin {
    return {
        name: 'leave-pictures-to-go',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use('/documents/', (_request, response) => {
                response.statusCode = 404
                response.end()
            })
        },
    }
}

/**
 * Font packs are downloaded and served by Go. In a plain browser they're served from the
 * npm packages instead, the ones packs.json lists and no others, so they can be tried.
 */
function servePacksFromPackages(): Plugin {
    return {
        name: 'serve-packs-from-packages',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use('/font-packs/', async (request, response) => {
                const {default: manifest} = await import('../backend/fontpacks/packs.json', {with: {type: 'json'}})
                const [id, name] = (request.url ?? '').replace(/^\//, '').split('?')[0].split('/')
                const font = manifest.packs.find((pack) => pack.id === id)?.fonts.find((each) => each.path.endsWith('/' + name))
                const file = font ? join(import.meta.dirname, 'node_modules', font.path) : ''

                if (!file || !existsSync(file)) {
                    response.statusCode = 404
                    response.end()
                    return
                }

                response.setHeader('Content-Type', 'font/ttf')
                createReadStream(file).pipe(response)
            })
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwind(), leavePicturesToGo(), servePacksFromPackages()],
    css: {
        postcss: {
            plugins: [
                {
                    postcssPlugin: 'px-to-rem',
                    Declaration(declaration) {
                        const value = pxToRem(declaration.value)

                        if (value !== declaration.value) {
                            declaration.value = value
                        }
                    },
                },
            ],
        },
    },
    // What's new reads CHANGELOG.md, which lives at the top of the repository.
    server: {fs: {allow: ['..']}},
    // The layout worker loads the Typst compiler on demand, which needs module workers.
    worker: {format: 'es'},
    build: {
        rollupOptions: {
            output: {
                // The interface library is large and changes rarely. Its own chunk
                // keeps the app chunk small and cacheable.
                manualChunks: {
                    ui: ['@heroui/react', 'react-aria-components', 'lucide-react'],
                },
            },
        },
    },
})
