/** Back on the shelf as available (ADR 0012). Admins only. */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { restoreItem } from "../../../services/items";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such book" });
  if (!(await restoreItem(db(), id.data))) {
    throw createError({ statusCode: 404, statusMessage: "no such book, or not off the shelf" });
  }
  log.info("book restored", { id: id.data, by: adminId });
  return { ok: true };
});
