/** Publish the pile. Whoever is signed in owns every book in it (ADR 0006). */
import { publishSchema } from "../../shared/schema";
import { db } from "../services/db/client";
import { createItems } from "../services/items";

export default defineEventHandler(async (event) => {
  const ownerId = await requireViewerId(event);
  const { books } = await readValidatedBody(event, publishSchema.parse);
  const ids = await createItems(db(), ownerId, books);
  log.info("published", { count: ids.length });
  return { ids };
});
