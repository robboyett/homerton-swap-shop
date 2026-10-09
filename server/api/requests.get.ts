/** Everything live between you and each other person (ADR 0013). Yours only. */
import { db } from "../services/db/client";
import { requestsFor } from "../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  return await requestsFor(db(), viewerId);
});
