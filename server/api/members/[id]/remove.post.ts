/** Out of the shop (ADR 0012). Admins only, and never themself. */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { removeMember } from "../../../services/profiles";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such member" });
  if (id.data === adminId) {
    throw createError({ statusCode: 409, statusMessage: "you cannot remove yourself" });
  }
  if (!(await removeMember(db(), id.data))) {
    throw createError({ statusCode: 404, statusMessage: "no such member" });
  }
  log.info("member removed", { id: id.data, by: adminId });
  return { ok: true };
});
