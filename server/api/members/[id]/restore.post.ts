/** Back in (ADR 0012). Their books stay removed until restored one by one. Admins only. */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { restoreMember } from "../../../services/profiles";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such member" });
  if (!(await restoreMember(db(), id.data))) {
    throw createError({ statusCode: 404, statusMessage: "no such member" });
  }
  log.info("member restored", { id: id.data, by: adminId });
  return { ok: true };
});
