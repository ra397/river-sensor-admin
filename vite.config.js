import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        proxy: {
            '/hydroiowa/api': {
                target: 'https://s-iihr80.iihr.uiowa.edu',
                changeOrigin: true,
                secure: false,
            },
        }
    }
})