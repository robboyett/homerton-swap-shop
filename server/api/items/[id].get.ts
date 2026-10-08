/** One book, as this viewer may see it, plus ten more from its section. */
import { z } from "zod";
import { db } from "../../services/db/client";
import { bookPage, moreInGenre } from "../../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  // Not a uuid is not a book; Postgres would answer the raw string with a 500.
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  const book = id.success ? await bookPage(db(), id.data, viewerId) : null;
  if (!book) throw createError({ statusCode: 404, statusMessage: "no such book" });
  return { book, more: await moreInGenre(db(), book.genre, book.id) };
});
