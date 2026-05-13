import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        sourcemap: true,
    },
    server: {
        proxy: {
            '/api2': {
                target: 'https://s-iihr80.iihr.uiowa.edu',
                changeOrigin: true,
                secure: false,
            },
        }
    }
})