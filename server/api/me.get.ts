/** Who is signed in. `{ viewer: null }` when nobody is; never a 401, so pages can ask freely. */
import { db } from "../services/db/client";
import { meById } from "../services/profiles";

export default defineEventHandler(async (event) => {
  const id = await viewerId(event);
  if (!id) return { viewer: null };
  const me = await meById(db(), id);
  if (!me) {
    // The profile behind this cookie is gone. Sign the cookie out rather than keep asking.
    const session = await viewerSession(event);
    await session.clear();
    return { viewer: null };
  }
  return { viewer: me };
});
