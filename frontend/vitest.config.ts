import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const shared = {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
}

export default defineConfig({
    plugins: [react()],
    // What's new reads CHANGELOG.md, which lives at the top of the repository.
    server: {fs: {allow: ['..']}},
    test: {
        projects: [
            {
                extends: true,
                test: {...shared, name: 'app', sequence: {groupOrder: 0}, maxWorkers: '50%', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'], exclude: ['src/**/*.typst.test.ts']},
            },
            {
                // Each of these lays pages out with a Typst compiler of its own and every
                // font. Many at once run Windows out of memory, so only a few run together.
                extends: true,
                test: {...shared, name: 'typst', sequence: {groupOrder: 1}, include: ['src/**/*.typst.test.ts'], maxWorkers: 2},
            },
        ],
    },
})
