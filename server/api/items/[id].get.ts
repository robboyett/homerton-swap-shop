/** One book, as this viewer may see it, plus ten more from its section. */
import { db } from "../../services/db/client";
import { bookPage, moreInGenre } from "../../services/items";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  const id = getRouterParam(event, "id") ?? "";
  const book = await bookPage(db(), id, viewerId);
  if (!book) throw createError({ statusCode: 404, statusMessage: "no such book" });
  return { book, more: await moreInGenre(db(), book.genre, book.id) };
});
