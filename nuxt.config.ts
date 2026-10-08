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
    // NUXT_SESSION_SECRET: in .env.local locally (vercel env pull) and in Vercel (ADR 0009).
    // DATABASE_URL comes from Vercel Storage; see .env.example.
    sessionSecret: "",
  },
});
