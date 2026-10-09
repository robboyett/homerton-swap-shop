/** Every book with whose it is, including the removed ones. Admins only. */
import { db } from "../../services/db/client";
import { listForAdmin } from "../../services/items";

export default defineEventHandler(async (event) => {
  const adminId = await requireAdminId(event);
  return { books: await listForAdmin(db(), adminId) };
});
