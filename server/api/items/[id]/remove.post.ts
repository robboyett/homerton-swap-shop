/** Off the shelf, record kept (ADR 0012). Admins only; the static segment wins over [move]. */
import { z } from "zod";
import { removeSchema } from "../../../../shared/schema";
import { db } from "../../../services/db/client";
import { removeItem } from "../../../services/items";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such book" });
  const { reason } = await readValidatedBody(event, removeSchema.parse);
  if (!(await removeItem(db(), id.data, reason || null))) {
    throw createError({ statusCode: 404, statusMessage: "no such book, or already off the shelf" });
  }
  log.info("book removed", { id: id.data, by: adminId });
  return { ok: true };
});
