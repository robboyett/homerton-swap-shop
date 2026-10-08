/** A corrected first name or WhatsApp number (ADR 0012). Admins only. */
import { z } from "zod";
import { memberEditSchema } from "../../../shared/schema";
import { db } from "../../services/db/client";
import { updateMember } from "../../services/profiles";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such member" });
  const edit = await readValidatedBody(event, memberEditSchema.parse);
  if (!(await updateMember(db(), id.data, edit))) {
    throw createError({ statusCode: 404, statusMessage: "no such member" });
  }
  log.info("member edited", { id: id.data, by: adminId });
  return { ok: true };
});
