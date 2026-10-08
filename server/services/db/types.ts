import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/** Either driver: Neon over HTTP in production, Postgres in-process in tests (ADR 0007). */
export type Db = PgDatabase<PgQueryResultHKT>;
