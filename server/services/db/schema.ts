/**
 * The Drizzle schema. `shared/schema.ts` is still the data truth and docs/data.md explains it;
 * this is the same two tables expressed for Postgres.
 *
 * It lives under server/services/ because that is the only place a vendor may be imported
 * (AGENTS.md). There is one seam and no exception to it.
 */
import {
  type AnyPgColumn,
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// Relative, not `~~/shared/schema`: drizzle-kit reads this file outside Nuxt and knows no aliases.
import { AGE_BANDS, GENRES, STATUSES } from "../../../shared/schema";

export const ageBand = pgEnum("age_band", AGE_BANDS);
export const genre = pgEnum("genre", GENRES);
export const itemStatus = pgEnum("item_status", STATUSES);
export const itemKind = pgEnum("item_kind", ["book", "collection"]);

/**
 * People. Rows are made by Rob on the admin screen, never by sign-up.
 * No surname, address or postcode column exists, on purpose (docs/data.md). The email is the
 * username and nothing else (ADR 0009).
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The username. Lower-cased and trimmed by the service before it gets here (ADR 0009). */
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  /** E.164. Shown only to the other side of a live reservation. */
  whatsappNumber: text("whatsapp_number").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  /** Who vouched for them. A real reference, as docs/data.md has always declared it. */
  invitedBy: uuid("invited_by").references((): AnyPgColumn => profiles.id),
  /** Out of the shop (ADR 0012): cannot sign in, books removed, reservations released. Reversible. */
  removedAt: timestamp("removed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A book, or a collection posted as one. */
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id),
  kind: itemKind("kind").notNull().default("book"),
  isbn: text("isbn"),
  title: text("title").notNull(),
  author: text("author"),
  blurb: text("blurb"),
  genre: genre("genre").notNull(),
  ageBand: ageBand("age_band").notNull(),
  coverUrl: text("cover_url"),
  photoUrl: text("photo_url"),
  approxCount: integer("approx_count"),
  status: itemStatus("status").notNull().default("available"),
  reservedBy: uuid("reserved_by").references(() => profiles.id),
  reservedAt: timestamp("reserved_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  /** Taken off the shelf by an admin (ADR 0012). The record stays; nobody but an admin sees it. */
  removedAt: timestamp("removed_at", { withTimezone: true }),
  removedReason: text("removed_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
