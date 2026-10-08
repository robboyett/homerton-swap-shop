/**
 * The session is a sealed cookie holding the profile id and nothing else (ADR 0009).
 * No sessions table: signing out clears the cookie, and a deleted profile signs out on its next
 * request because /api/me finds nobody.
 */
import type { H3Event } from "h3";
import { db } from "../services/db/client";
import { meById } from "../services/profiles";

type SessionData = { id?: string };

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function viewerSession(event: H3Event) {
  const { sessionSecret } = useRuntimeConfig(event);
  if (typeof sessionSecret !== "string" || sessionSecret.length < 32) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "NUXT_SESSION_SECRET is not set, or is shorter than 32 characters. See docs/runbook.md.",
    });
  }
  return useSession<SessionData>(event, {
    name: "swapshop",
    password: sessionSecret,
    maxAge: THIRTY_DAYS,
    cookie: { sameSite: "lax", httpOnly: true, secure: !import.meta.dev, path: "/" },
  });
}

/** The signed-in profile id, or null. */
export async function viewerId(event: H3Event): Promise<string | null> {
  const session = await viewerSession(event);
  return session.data.id ?? null;
}

/** The signed-in profile id, or a 401. Every route that changes anything starts here. */
export async function requireViewerId(event: H3Event): Promise<string> {
  const id = await viewerId(event);
  if (!id) throw createError({ statusCode: 401, statusMessage: "sign in first" });
  return id;
}

/**
 * The signed-in admin's id, or a 403. Admin means invites and moderation and nothing else
 * (ADR 0006); the flag is read from the database on each call, not trusted from the cookie.
 */
export async function requireAdminId(event: H3Event): Promise<string> {
  const id = await requireViewerId(event);
  const me = await meById(db(), id);
  if (!me?.is_admin) throw createError({ statusCode: 403, statusMessage: "admins only" });
  return id;
}
