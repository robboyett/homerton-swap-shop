/** How many of your books other people hold right now (ADR 0016). For the nav. */
import { db } from "../../services/db/client";
import { countAskedOfYou } from "../../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  return { waiting: await countAskedOfYou(db(), viewerId) };
});
