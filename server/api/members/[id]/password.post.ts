/** A new one-time password for someone, set by an admin and handed over in WhatsApp (ADR 0009). */
import { z } from "zod";
import { newPasswordSchema } from "../../../../shared/schema";
import { db } from "../../../services/db/client";
import { setPassword } from "../../../services/profiles";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such member" });
  const { password } = await readValidatedBody(event, newPasswordSchema.parse);
  if (!(await setPassword(db(), id.data, password))) {
    throw createError({ statusCode: 404, statusMessage: "no such member" });
  }
  log.info("password set", { id: id.data, by: adminId });
  return { ok: true };
});
