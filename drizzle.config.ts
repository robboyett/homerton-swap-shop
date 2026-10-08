import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/services/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migration files are generated and committed, never pushed straight at a database (ADR 0002).
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
