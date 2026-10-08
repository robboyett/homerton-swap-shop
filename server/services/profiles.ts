/**
 * People: made by Rob, never by sign-up (docs/plan.md, "Who can join"). Sign-in is here too.
 *
 * Everything returned from this file is the browser shape from shared/schema.ts, never a row:
 * the row carries a password hash and other people's emails, and neither leaves this folder.
 */
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Me, Member, NewProfile } from "../../shared/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import { profiles } from "./db/schema";
import type { Db } from "./db/types";

/** Trimmed and lower-cased, so `Priya@Example.com ` and `priya@example.com` are one person. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

type Row = typeof profiles.$inferSelect;

/** Thrown by createProfile when the email already has an account. The route turns it into a 409. */
export class EmailTakenError extends Error {
  constructor() {
    super("that email already has an account");
    this.name = "EmailTakenError";
  }
}

/** Postgres unique_violation, whichever driver wrapped it. */
function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

function asMe(row: Row): Me {
  return { id: row.id, first_name: row.firstName, is_admin: row.isAdmin, email: row.email };
}

/**
 * A real scrypt hash of a long random string nobody knows. When there is no such email, the
 * password is verified against this instead, so a wrong email takes as long as a wrong password
 * and the sign-in form cannot be used to find out who has an account.
 */
const NOBODY =
  "scrypt$16384$9f184ef73ed297d2292adcc7621f12d1$4b2e8f66ec1f490396b8dc32920ff13a1adb1f50a4a0e8f866ebfa84441357622504e4b2bba9729d77886d6e987b353811e74028b4317447fb7141768064c5a2";

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
  let rows: Row[];
  try {
    rows = await db
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
  } catch (e) {
    if (isUniqueViolation(e)) throw new EmailTakenError();
    throw e;
  }
  const [row] = rows;
  if (!row) throw new Error("insert returned no row");
  return asMe(row);
}

/**
 * Rob's own account, made once on an empty table. Returns null if anyone already exists.
 *
 * This is a count and then an insert, not one statement, and the route in front of it needs no
 * sign-in, because nobody can sign in yet. So from the first deploy until Rob calls it, anyone
 * who finds the URL could claim the admin seat, and two callers in the same instant could both
 * succeed. The answer is process, not code: Rob calls it straight after the deploy and checks
 * that the one row is his. A 409 on his first try means look, not retry.
 */
export async function createFirstAdmin(db: Db, profile: NewProfile): Promise<Me | null> {
  if ((await db.$count(profiles)) > 0) return null;
  return createProfile(db, profile, { invitedBy: null, isAdmin: true });
}

/** Everyone, oldest first, with who vouched for them. For the admin screen only. */
export async function listMembers(db: Db): Promise<Member[]> {
  const inviter = alias(profiles, "inviter");
  const rows = await db
    .select({
      id: profiles.id,
      first_name: profiles.firstName,
      is_admin: profiles.isAdmin,
      email: profiles.email,
      invited_by_first_name: inviter.firstName,
    })
    .from(profiles)
    .leftJoin(inviter, eq(profiles.invitedBy, inviter.id))
    .orderBy(asc(profiles.createdAt), asc(profiles.id));
  return rows;
}

/**
 * A new one-time password, set by Rob and handed over in WhatsApp (ADR 0009). There is no
 * self-service change: this is the only way a password ever changes. False if there is no such
 * person.
 */
export async function setPassword(db: Db, id: string, password: string): Promise<boolean> {
  const changed = await db
    .update(profiles)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(profiles.id, id))
    .returning({ id: profiles.id });
  return changed.length === 1;
}
