/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['*.test.ts'],
        root: './src/tests',
        passWithNoTests: false,
        reporters: [
            'verbose'
        ],
    },
})