// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/google-fonts', '@nuxt/icon'],
  tailwindcss: {
    viewer: false
  },
  googleFonts: {
    families: {
      Inter: [100, 200, 300, 400, 500, 600, 700, 800, 900]
    }
  },
  // ssr: true,
  nitro: {
    routeRules: {
      // Cache the screenshot API responses
      '/api/screenshot': { cache: { maxAge: 60 * 60 } }
    },
    devServer: {
      port: 3002,
      host: '0.0.0.0' // Ensures it binds to all interfaces
    }
    server: {
      responseTimeout: 60000 // 60 seconds
    }
  }
});