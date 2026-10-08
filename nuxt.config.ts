export default defineNuxtConfig({
  compatibilityDate: "2026-10-08",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "homerton swap shop",
      htmlAttrs: { lang: "en" },
    },
  },
  runtimeConfig: {
    // Set NUXT_SESSION_SECRET in .env locally and in Vercel (Phase 2).
    // DATABASE_URL comes from Vercel Storage; see .env.example.
    sessionSecret: "",
  },
});
