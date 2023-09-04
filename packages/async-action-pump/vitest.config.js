/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { f } from 'vitest/dist/types-3c7dbfa5'

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