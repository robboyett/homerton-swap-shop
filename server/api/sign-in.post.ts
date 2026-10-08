import { signInSchema } from "../../shared/schema";
import { db } from "../services/db/client";
import { signIn } from "../services/profiles";

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, signInSchema.parse);
  const me = await signIn(db(), email, password);
  if (!me) {
    log.warn("sign-in refused");
    throw createError({ statusCode: 401, statusMessage: "that email and password don't match" });
  }
  const session = await viewerSession(event);
  await session.update({ id: me.id });
  return { viewer: me };
});
