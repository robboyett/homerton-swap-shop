/** The owner takes their own book off the shelf (ADR 0018). Ownership is the guard, in the service. */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { withdrawItem } from "../../../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such book" });
  if (!(await withdrawItem(db(), id.data, viewerId))) {
    throw createError({
      statusCode: 409,
      statusMessage: "that is not your book, or it is already off the shelf",
    });
  }
  log.info("book withdrawn by owner", { id: id.data, by: viewerId });
  return { ok: true };
});
