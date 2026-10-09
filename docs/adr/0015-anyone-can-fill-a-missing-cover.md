# Anyone can add a cover photo to a book that has none, and photos live in Vercel Blob

**Date:** 9 October 2026 · **Status:** accepted (Rob, 9 Oct)

**Context.** Open Library has no cover for a fair share of British children's books, and a typed-in book has none at all. Those books get one of the fifty coloured covers from the canvas, which is cheerful but tells a parent nothing. Rob asked (9 Oct) that *"if the book listing is missing a photo, anyone should be able to add one to it from the listing page or when it's added, to fill the gaps."*

Two things in that are decisions. Who may add a photo: the owner only, or anyone signed in. And where photos live: the phase table has said Vercel Blob since Phase 0, and `docs/allowed-deps.txt` has carried `@vercel/blob` at Phase 3 with the reason beside it.

**Decision.**

1. **Any signed-in member may add a cover photo to a book that has no art**, from its page or in the pile before publishing. It is a gap-filling act, not an edit of someone's listing: once a book has a cover, from Open Library or from a photo, nobody can replace it except an admin, who can only remove it.
2. **Photos are shrunk on the phone before they are sent.** The longest side becomes 1200 pixels and the file a JPEG, so a six-megabyte snap is a couple of hundred kilobytes, under the function body limit and quick on a hallway signal. The server refuses anything over three megabytes or not an image.
3. **Photos live in a public Vercel Blob store**, served by URL, with a random suffix so nothing is guessable. Public because the site shows them as plain images to every member and a signed-URL scheme would be more machinery than a shelf of book covers needs. They are covers, never people; a photo with a person in it is one for an admin to remove.
4. **The one vendor call is behind the seam.** `server/services/photos.ts` is the only file that imports `@vercel/blob`; routes call it and never the package.
5. **Setting the photo is a guarded UPDATE** like every other rule: `photo_url` is written only where both `cover_url` and `photo_url` are null and the book is not removed. If two people add a photo to the same book at the same moment, one wins and the other's upload is deleted again, and told so.

**Consequences.** `@vercel/blob` joins `package.json` (already on the allow-list). A Blob store named for the project was created and linked (public access, region iad1), which put `BLOB_READ_WRITE_TOKEN` in all three Vercel environments and in `.env.local`. Routes: `POST /api/items/:id/photo` for anyone signed in, `DELETE /api/items/:id/photo` for admins. A book page without art gains "add a photo"; the pile gains the same per book, uploaded after publish. `docs/plan.md` gains a Decided row; `docs/data.md`'s `photo_url` row says who sets it.

What it costs: a second vendor beside Neon, a store that bills by size and bandwidth (a few hundred kilobytes per book is nothing at this scale), and an upload path, which is the first place a member sends the site a file. Shrinking on the phone and a hard size limit on the server are what keep that path small.

What it does not change: covers from Open Library are still preferred and still first. Collections with a photo and a rough count are still Phase 4; this is a cover on a single book. Rule 4 is untouched: a photo is of a book.
