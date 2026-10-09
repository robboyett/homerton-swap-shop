export default defineNuxtConfig({
  compatibilityDate: "2026-10-08",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "homerton swap shop",
      htmlAttrs: { lang: "en" },
      // What a pasted link shows in WhatsApp, and what a tab or a home screen is called.
      meta: [
        {
          name: "description",
          content: "neighbours in homerton giving away kids' books, for free. invite only.",
        },
        { property: "og:title", content: "homerton swap shop" },
        {
          property: "og:description",
          content: "neighbours in homerton giving away kids' books, for free. invite only.",
        },
        { property: "og:type", content: "website" },
        { name: "theme-color", content: "#ffffff" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },
  runtimeConfig: {
    // NUXT_SESSION_SECRET: in .env.local locally (vercel env pull) and in Vercel (ADR 0009).
    // DATABASE_URL comes from Vercel Storage; see .env.example.
    sessionSecret: "",
  },
});
