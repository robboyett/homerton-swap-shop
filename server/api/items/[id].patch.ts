/** The owner corrects their own book's section or age (ADR 0018). Nothing else is editable. */
import { z } from "zod";
import { reshelveSchema } from "../../../shared/schema";
import { db } from "../../services/db/client";
import { bookPage, reshelve } from "../../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such book" });
  const to = await readValidatedBody(event, reshelveSchema.parse);
  if (!(await reshelve(db(), id.data, viewerId, to))) {
    throw createError({ statusCode: 409, statusMessage: "that is not your book" });
  }
  const book = await bookPage(db(), id.data, viewerId);
  if (!book) throw createError({ statusCode: 404, statusMessage: "no such book" });
  log.info("book reshelved by owner", { id: id.data, by: viewerId });
  return { book };
});
