/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['src/*.test.ts'],
        root: './src',
        environment: 'node'
    },
})