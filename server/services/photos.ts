/**
 * Cover photos, in Vercel Blob (ADR 0015). The only file that imports the package.
 * The store is public: covers, never people. Every photo gets a random suffix, so no URL can be
 * guessed, and `BLOB_READ_WRITE_TOKEN` is read by the SDK from the environment.
 */
import { del, put } from "@vercel/blob";
import { log } from "../utils/logger";

/** Keep uploads small: the phone shrinks first, and this is the ceiling behind it. */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function storeCoverPhoto(
  itemId: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const blob = await put(`covers/${itemId}.${ext}`, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}

/** Best effort: a photo that is no longer referenced should not sit in the store. */
export async function deleteCoverPhoto(url: string): Promise<void> {
  try {
    await del(url);
  } catch (e) {
    // Nothing references it any more; a leftover object is a cost, not a correctness problem.
    // Said out loud, so a store that quietly fills up has a trail.
    log.warn("cover photo not deleted from the store", { message: (e as Error).message });
  }
}
