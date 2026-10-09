/**
 * The data shape. This file is the truth; docs/data.md explains it.
 *
 * Two tables, and the closed sets the whole product is built on. If you are adding a field,
 * check docs/plan.md first: "Decided" is closed, and most additions have already been turned
 * down for a reason (no condition, no price, no address, no location).
 */
import { z } from "zod";

/** The only filter. Matches how people talk about kids' books, not publishers' categories. */
export const AGE_BANDS = ["0-3", "4-6", "7-9", "10+"] as const;

/** The grid's sections, in the order they are shown. */
export const GENRES = [
  "picture books",
  "early readers",
  "chapter books",
  "fantasy and adventure",
  "science and nature",
  "young adult",
] as const;

/**
 * A book is on the shelf, promised to someone, gone, or taken off the shelf by Rob (ADR 0012).
 * Nothing else. Removed books keep their record and are shown to nobody but an admin.
 */
export const STATUSES = ["available", "reserved", "collected", "removed"] as const;

export const ageBandSchema = z.enum(AGE_BANDS);
export const genreSchema = z.enum(GENRES);
export const statusSchema = z.enum(STATUSES);

/**
 * A person. Made by Rob on the admin screen, never by sign-up.
 *
 * First name only, and the number is shown solely to the other side of a live reservation
 * (docs/data.md, rule 4). There is no surname, address or postcode field, on purpose.
 *
 * `password_hash` and `email` are in the database and deliberately not here: this shape is what
 * reaches the browser, and neither a hash nor another neighbour's email has any business being
 * sent to it (ADR 0009). Only you ever receive your own email, from /api/me and the routes that
 * sign you in. The Drizzle table in server/services/db/schema.ts is the fuller picture.
 */
export const profileSchema = z.object({
  id: z.string(),
  first_name: z.string().min(1),
  /** E.164. Seeds and fixtures use the Ofcom drama range only (ADR 0005). */
  whatsapp_number: z
    .string()
    .regex(/^\+44\d{10}$/, "must be an E.164 UK mobile, e.g. +447700900123"),
  is_admin: z.boolean(),
  invited_by: z.string().nullable(),
  created_at: z.string(),
});

/** A book, or a collection posted as one. */
export const itemSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  kind: z.enum(["book", "collection"]),
  /** Null for a collection, or a book whose barcode would not read. */
  isbn: z.string().nullable(),
  title: z.string().min(1),
  author: z.string().nullable(),
  /** From the lookup, never written by the owner. */
  blurb: z.string().nullable(),
  genre: genreSchema,
  age_band: ageBandSchema,
  /** Open Library's cover service. */
  cover_url: z.string().nullable(),
  /** Vercel Blob, for a collection or a book with no cover (Phase 3). */
  photo_url: z.string().nullable(),
  /** Collections only: "about 12". */
  approx_count: z.number().int().positive().nullable(),
  status: statusSchema,
  reserved_by: z.string().nullable(),
  reserved_at: z.string().nullable(),
  collected_at: z.string().nullable(),
  /** Set by an admin, with an optional note for their own memory (ADR 0012). */
  removed_at: z.string().nullable(),
  removed_reason: z.string().nullable(),
  created_at: z.string(),
});

export type AgeBand = z.infer<typeof ageBandSchema>;
export type Genre = z.infer<typeof genreSchema>;
export type Status = z.infer<typeof statusSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Item = z.infer<typeof itemSchema>;

/**
 * What the viewer may do with an item, and whose number they may see.
 *
 * This mirrors rule 4 in docs/data.md. In Phase 2 the same five cases are decided in
 * server/services/, which is the only gate: Neon has no row-level security here (ADR 0002).
 */
export type BookState = "available" | "mine" | "other" | "owner" | "collected";

export function bookState(
  item: Pick<Item, "status" | "reserved_by" | "owner_id">,
  viewerId: string,
): BookState {
  // A removed book never reaches a page (server/services/items.ts answers null); if one did,
  // collected is the state that shows nobody a number and nobody a button.
  if (item.status === "collected" || item.status === "removed") return "collected";
  if (item.status === "available") return "available";
  if (item.reserved_by === viewerId) return "mine";
  if (item.owner_id === viewerId) return "owner";
  return "other";
}

/** The two states that reveal a number, and only to the two people in the conversation. */
export function showsWhatsApp(state: BookState): boolean {
  return state === "mine" || state === "owner";
}

/** The username (ADR 0009). Trimmed and lower-cased before anything compares it. */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/** What any page may know about the signed-in person. */
export const viewerSchema = profileSchema.pick({ id: true, first_name: true, is_admin: true });

/** What you may know about yourself: the viewer, plus your own email. Returned by /api/me only. */
export const meSchema = viewerSchema.extend({ email: emailSchema });

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1) });

/** A new account, as Rob fills it in. The password is the one-time one he hands over. */
export const newProfileSchema = z.object({
  email: emailSchema,
  password: z.string().min(12, "at least 12 characters"),
  first_name: z.string().trim().min(1).max(40),
  whatsapp_number: profileSchema.shape.whatsapp_number,
});

export type Viewer = z.infer<typeof viewerSchema>;
export type Me = z.infer<typeof meSchema>;
export type NewProfile = z.infer<typeof newProfileSchema>;

/**
 * A book as the shelf shows it. Nothing about who owns it or who has asked for it: the grid
 * needs only the status, to fade it. This is the only item shape a list route may return.
 */
export const shelfBookSchema = itemSchema.pick({
  id: true,
  kind: true,
  title: true,
  author: true,
  genre: true,
  age_band: true,
  status: true,
  cover_url: true,
  photo_url: true,
  approx_count: true,
});

/**
 * A book as its page shows it to one particular viewer. The projection is rule 4 of
 * docs/data.md made into a shape: `contact` is the other side of a live reservation and null
 * for everyone else, and `reserved_by` and `owner_id` are not here at all.
 */
export const bookPageSchema = shelfBookSchema.extend({
  blurb: itemSchema.shape.blurb,
  created_at: itemSchema.shape.created_at,
  owner_first_name: z.string(),
  state: z.enum(["available", "mine", "other", "owner", "collected"]),
  contact: profileSchema.pick({ first_name: true, whatsapp_number: true }).nullable(),
  /** Collected only: whether this viewer is one of the two who may say "not collected after all". */
  can_undo: z.boolean(),
});

export type ShelfBook = z.infer<typeof shelfBookSchema>;
export type BookPage = z.infer<typeof bookPageSchema>;

/**
 * An ISBN as a person types it: spaces and hyphens allowed, ten or thirteen characters once
 * they are gone, a trailing X allowed on a ten. Normalised to what Open Library expects.
 */
export const isbnSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, "").toUpperCase())
  .pipe(z.string().regex(/^(\d{13}|\d{9}[\dX])$/, "an isbn is 10 or 13 digits"));

/** A book about to be published from the pile: what the lookup found, or what was typed. */
export const newBookSchema = z.object({
  isbn: isbnSchema.nullable(),
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().max(200).nullable(),
  blurb: z.string().max(1000).nullable(),
  /** Open Library's cover service and nowhere else (docs/data.md): every neighbour sees this image. */
  cover_url: z.url({ protocol: /^https$/, hostname: /^covers\.openlibrary\.org$/ }).nullable(),
  genre: genreSchema,
  age_band: ageBandSchema,
});

/** The pile, published in one go. Fifty is more than anyone's arms can carry. */
export const publishSchema = z.object({ books: z.array(newBookSchema).min(1).max(50) });

export type NewBook = z.infer<typeof newBookSchema>;

/**
 * The ISBN inside a scanned barcode, or null if the code is not a book. The barcode on a book is
 * an EAN-13 beginning 978 or 979, which is the ISBN-13 itself. Anything else the camera sees
 * (a price sticker, a toy, a tin of beans) is ignored rather than looked up.
 */
export function bookIsbnFromBarcode(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  return /^97[89]\d{10}$/.test(digits) ? digits : null;
}

/**
 * A member as the admin screen lists them. The email is here because Rob typed it in and needs
 * it to tell two Priyas apart; it goes to the admin screen and nowhere else (ADR 0009, amended).
 */
export const memberSchema = meSchema.extend({
  invited_by_first_name: z.string().nullable(),
  /** Out of the shop (ADR 0012), until an admin lets them back in. */
  removed_at: z.string().nullable(),
});

export const newPasswordSchema = z.object({ password: newProfileSchema.shape.password });

export type Member = z.infer<typeof memberSchema>;

/* ---- moderation (ADR 0012): admin only ---- */

/** Why a book came off the shelf. For Rob's own memory; shown to admins only. */
export const removeSchema = z.object({ reason: z.string().trim().max(200).optional() });

/**
 * What an admin may correct about a person: the name, the number, or both. Leaving the number
 * out keeps the one on file, since the admin screen never sees it (rule 4). The email is the
 * username and is not editable.
 */
export const memberEditSchema = z.object({
  first_name: newProfileSchema.shape.first_name,
  whatsapp_number: newProfileSchema.shape.whatsapp_number.optional(),
});

/** A book as the admin screen lists it: whose it is, and whether it is off the shelf. */
export const adminBookSchema = shelfBookSchema.extend({
  owner_first_name: z.string(),
  removed_at: z.string().nullable(),
  removed_reason: z.string().nullable(),
});

export type AdminBook = z.infer<typeof adminBookSchema>;
