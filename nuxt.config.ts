// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "@vueuse/nuxt",
    "@nuxt/ui",
    "@nuxtjs/tailwindcss",
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          Roboto: true
        },
        display: "swap"
      }
    ],
    [
      "@nuxtjs/eslint-module",
      {
        lintOnStart: false
      }
    ]
  ],
  typescript: {
    typeCheck: true,
    strict: true
  },
  appConfig: {
    nuxtIcon: {}
  }
});
