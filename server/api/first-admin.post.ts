/**
 * Rob's own account, made once (ADR 0009). Works only while the profiles table is empty; after
 * that it answers 409 forever. Every later account is made from the admin screen.
 */
import { newProfileSchema } from "../../shared/schema";
import { db } from "../services/db/client";
import { createFirstAdmin } from "../services/profiles";

export default defineEventHandler(async (event) => {
  const profile = await readValidatedBody(event, newProfileSchema.parse);
  const me = await createFirstAdmin(db(), profile);
  if (!me) {
    throw createError({
      statusCode: 409,
      statusMessage:
        "there is already an account. the first admin is made once; use the admin screen",
    });
  }
  log.info("first admin made", { id: me.id });
  const session = await viewerSession(event);
  await session.update({ id: me.id });
  return { viewer: me };
});
