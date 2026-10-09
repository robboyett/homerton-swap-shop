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
    throw createError({
      statusCode: edit.whatsapp_number ? 409 : 404,
      statusMessage: edit.whatsapp_number
        ? "no such member, or they have not given a number yet; the first one is theirs to give"
        : "no such member",
    });
  }
  log.info("member edited", { id: id.data, by: adminId });
  return { ok: true };
});
