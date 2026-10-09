/** The welcome page's one move (ADR 0014): give your own number, once. */
import { numberSchema } from "../../../shared/schema";
import { db } from "../../services/db/client";
import { setNumber } from "../../services/profiles";

export default defineEventHandler(async (event) => {
  const me = await requireViewer(event);
  const { whatsapp_number } = await readValidatedBody(event, numberSchema.parse);
  if (!(await setNumber(db(), me.id, whatsapp_number))) {
    throw createError({
      statusCode: 409,
      statusMessage: "your number is already set; ask rob to change it",
    });
  }
  log.info("number given", { id: me.id });
  return { viewer: { ...me, has_number: true } };
});
