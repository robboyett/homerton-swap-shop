/** The shelf. Signed in only; the shape carries nothing about people (shared/schema.ts). */
import { db } from "../services/db/client";
import { listShelf } from "../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  return { books: await listShelf(db(), viewerId) };
});
