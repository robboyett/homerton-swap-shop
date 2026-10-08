/** Everyone, for the admin screen. Admins only: this is the one list that carries emails. */
import { db } from "../services/db/client";
import { listMembers } from "../services/profiles";

export default defineEventHandler(async (event) => {
  await requireAdminId(event);
  return { members: await listMembers(db()) };
});
