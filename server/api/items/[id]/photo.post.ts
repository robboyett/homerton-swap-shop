/**
 * Add a cover photo to a book that has none (ADR 0015). Anyone signed in. The item is checked
 * before the upload so a hopeless one costs nothing; the UPDATE's WHERE is the real guard, and an
 * upload that loses the race is deleted again.
 */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { artOf, bookPage, setPhoto } from "../../../services/items";
import {
  deleteCoverPhoto,
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  storeCoverPhoto,
} from "../../../services/photos";

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  const id = z.uuid().safeParse(getRouterParam(event, "id"));
  if (!id.success) throw createError({ statusCode: 404, statusMessage: "no such book" });

  const art = await artOf(db(), id.data);
  if (!art || art.removed) throw createError({ statusCode: 404, statusMessage: "no such book" });
  if (art.has_art)
    throw createError({ statusCode: 409, statusMessage: "this book already has a cover" });

  const parts = await readMultipartFormData(event);
  const photo = parts?.find((p) => p.name === "photo");
  if (!photo?.type || !PHOTO_TYPES.has(photo.type)) {
    throw createError({ statusCode: 400, statusMessage: "that is not a photo" });
  }
  if (photo.data.length > MAX_PHOTO_BYTES) {
    throw createError({ statusCode: 413, statusMessage: "that photo is too big" });
  }

  const url = await storeCoverPhoto(id.data, photo.data, photo.type);
  if (!(await setPhoto(db(), id.data, url))) {
    await deleteCoverPhoto(url);
    throw createError({ statusCode: 409, statusMessage: "this book already has a cover" });
  }
  log.info("cover photo added", { id: id.data, by: viewerId });
  const book = await bookPage(db(), id.data, viewerId);
  if (!book) throw createError({ statusCode: 404, statusMessage: "no such book" });
  return { book };
});
