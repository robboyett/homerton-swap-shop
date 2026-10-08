/** Make an account. The admin who did it is recorded as the one who vouched (docs/data.md). */
import { newProfileSchema } from "../../shared/schema";
import { db } from "../services/db/client";
import { createProfile, EmailTakenError } from "../services/profiles";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  const profile = await readValidatedBody(event, newProfileSchema.parse);
  try {
    const member = await createProfile(db(), profile, { invitedBy: adminId });
    log.info("member made", { id: member.id, by: adminId });
    return { member };
  } catch (e) {
    if (e instanceof EmailTakenError)
      throw createError({ statusCode: 409, statusMessage: e.message });
    throw e;
  }
});
