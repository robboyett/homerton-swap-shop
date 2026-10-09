/** Publish the pile. Whoever is signed in owns every book in it (ADR 0006). */
import { publishSchema } from "../../shared/schema";
import { db } from "../services/db/client";
import { createItems } from "../services/items";

export default defineEventHandler(async (event) => {
  const me = await requireViewer(event);
  // Publishing is the moment a number gets shown to whoever asks (ADR 0014).
  if (!me.has_number)
    throw createError({ statusCode: 409, statusMessage: "add your mobile number first" });
  const { books } = await readValidatedBody(event, publishSchema.parse);
  const ids = await createItems(db(), me.id, books);
  log.info("published", { count: ids.length });
  return { ids };
});
