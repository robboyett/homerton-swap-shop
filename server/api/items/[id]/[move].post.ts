/**
 * The four moves a reservation can make, one URL each: reserve, release, collect, uncollect.
 * The service says whether it changed a row; when it did not, the reason is plain and the page
 * gets the book as it now stands, so it can redraw rather than guess.
 */
import { z } from "zod";
import { db } from "../../../services/db/client";
import { bookPage, collect, release, reserve, uncollect } from "../../../services/items";

const MOVES = {
  reserve: { run: reserve, refused: "someone else got there first" },
  release: { run: release, refused: "that is not yours to put back" },
  collect: { run: collect, refused: "only the person who reserved it can tick this" },
  uncollect: { run: uncollect, refused: "nothing to undo" },
};

const moveSchema = z.enum(["reserve", "release", "collect", "uncollect"]);

export default defineEventHandler(async (event) => {
  const viewerId = await requireViewerId(event);
  const id = getRouterParam(event, "id") ?? "";
  const parsed = moveSchema.safeParse(getRouterParam(event, "move"));
  if (!parsed.success) throw createError({ statusCode: 404, statusMessage: "no such move" });
  const move = MOVES[parsed.data];

  const changed = await move.run(db(), id, viewerId);
  const book = await bookPage(db(), id, viewerId);
  if (!book) throw createError({ statusCode: 404, statusMessage: "no such book" });
  if (!changed) throw createError({ statusCode: 409, statusMessage: move.refused, data: { book } });
  return { book };
});
