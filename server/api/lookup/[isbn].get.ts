/**
 * Look an ISBN up. 400 if it is not one, 404 if Open Library has never heard of it (the page
 * then offers typing it in), 502 if Open Library is not answering.
 */
import { isbnSchema } from "../../../shared/schema";
import { lookupIsbn } from "../../services/openlibrary";

export default defineEventHandler(async (event) => {
  await requireViewerId(event);
  const isbn = isbnSchema.safeParse(getRouterParam(event, "isbn"));
  if (!isbn.success)
    throw createError({ statusCode: 400, statusMessage: "an isbn is 10 or 13 digits" });
  let found: Awaited<ReturnType<typeof lookupIsbn>>;
  try {
    found = await lookupIsbn(isbn.data);
  } catch (e) {
    log.warn("open library not answering", { message: (e as Error).message });
    throw createError({ statusCode: 502, statusMessage: "the library isn't answering" });
  }
  if (!found) throw createError({ statusCode: 404, statusMessage: "not in the library" });
  return { found };
});
