import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        sourcemap: true,
    },
    server: {
        proxy: {
            '/api2': {
                target: 'https://hydroiowa.org',
                changeOrigin: true,
                secure: false,
            },
        }
    }
})