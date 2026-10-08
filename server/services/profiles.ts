/**
 * People: made by Rob, never by sign-up (docs/plan.md, "Who can join"). Sign-in is here too.
 *
 * Everything returned from this file is the browser shape from shared/schema.ts, never a row:
 * the row carries a password hash and other people's emails, and neither leaves this folder.
 */
import { eq } from "drizzle-orm";
import type { Me, NewProfile } from "../../shared/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import { profiles } from "./db/schema";
import type { Db } from "./db/types";

/** Trimmed and lower-cased, so `Priya@Example.com ` and `priya@example.com` are one person. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

type Row = typeof profiles.$inferSelect;

function asMe(row: Row): Me {
  return { id: row.id, first_name: row.firstName, is_admin: row.isAdmin, email: row.email };
}

/**
 * A real scrypt hash of a long random string nobody knows. When there is no such email, the
 * password is verified against this instead, so a wrong email takes as long as a wrong password
 * and the sign-in form cannot be used to find out who has an account.
 */
const NOBODY =
  "scrypt$16384$a3f1c9d2e8b74a6f0c5d1e2f3a4b5c6d$6a0d1c6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a291807f6e5d4c3b2a1908f7e6d5c4b3a291807f6e5d4c3b2a1908f7e6d5c4b3a2918";

export async function meById(db: Db, id: string): Promise<Me | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, id));
  return row ? asMe(row) : null;
}

/** The person, if the email and password match; otherwise null, with no hint as to which was wrong. */
export async function signIn(db: Db, email: string, password: string): Promise<Me | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, normaliseEmail(email)));
  const ok = await verifyPassword(password, row?.passwordHash ?? NOBODY);
  return ok && row ? asMe(row) : null;
}

/**
 * A new account. `invitedBy` is the admin who made it, or null for the first one.
 * A second account with the same email fails on the unique constraint; the caller says so.
 */
export async function createProfile(
  db: Db,
  profile: NewProfile,
  options: { invitedBy: string | null; isAdmin?: boolean },
): Promise<Me> {
  const rows = await db
    .insert(profiles)
    .values({
      email: normaliseEmail(profile.email),
      firstName: profile.first_name.trim(),
      whatsappNumber: profile.whatsapp_number,
      passwordHash: await hashPassword(profile.password),
      isAdmin: options.isAdmin ?? false,
      invitedBy: options.invitedBy,
    })
    .returning();
  const [row] = rows;
  if (!row) throw new Error("insert returned no row");
  return asMe(row);
}

/**
 * Rob's own account, made once on an empty table. Returns null if anyone already exists.
 *
 * This is a count and then an insert, not one statement. It runs once, by the one person who
 * has the URL before anyone else, against an empty database; the worst case of the gap is that
 * he makes himself twice. Not worth a cleverer query.
 */
export async function createFirstAdmin(db: Db, profile: NewProfile): Promise<Me | null> {
  if ((await db.$count(profiles)) > 0) return null;
  return createProfile(db, profile, { invitedBy: null, isAdmin: true });
}
