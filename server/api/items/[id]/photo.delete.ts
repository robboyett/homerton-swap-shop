/** An admin takes a photo down (ADR 0015). The plain cover comes back; the store is tidied. */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { bookPage, clearPhoto } from "../../../services/items";
import { deleteCoverPhoto } from "../../../services/photos";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such book" });
  const was = await clearPhoto(db(), id.data);
  if (!was) throw createError({ statusCode: 404, statusMessage: "no photo on that book" });
  await deleteCoverPhoto(was);
  log.info("cover photo removed", { id: id.data, by: adminId });
  const book = await bookPage(db(), id.data, adminId);
  if (!book) throw createError({ statusCode: 404, statusMessage: "no such book" });
  return { book };
});
