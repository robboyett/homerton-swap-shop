# The shelf filters by section as well as age, and can hide your own books, in two lines of text

**Date:** 9 October 2026 · **Status:** accepted (Rob, 9 Oct) · **Amends:** the "Browsing" row of `docs/plan.md`

**Context.** The Decided table said age is the only filter, on the argument that age is the only thing that matters when a parent chooses. With a few dozen books up and more coming, Rob asked (9 Oct) for two more ways to cut the shelf: by type, and hiding the books he posted himself, with the warning not to flood the screen with controls.

**Decision.**

1. **A second filter row, "section", in the same shape as the age row.** Plain text, the active one underlined, "all" first. Choosing a section shows that section alone. The sections are the genres the grid already uses; "type" is not a new field.
2. **One text toggle, "hide mine", which flips to "show mine".** It needs the shelf to know which books are yours, so each book on the shelf carries a boolean `yours`, computed on the server from the signed-in person. That is a fact about yourself, not about anyone else; rule 4 is untouched and the shelf still carries nobody's name or number.
3. **The filters live in the address bar** as `?age=`, `?section=` and `?mine=hide`, so a reload keeps them and a link can carry them. Nothing is stored.
4. **No more controls than those.** Two rows of text and one toggle, each the same size as everything else, with the count line underneath. When the filters leave nothing, one line says so.

**Consequences.** `shelfBookSchema` gains `yours` (not `mine`, which a book page already uses for "you have reserved it"); `listShelf` and `moreInGenre` take the viewer id to compute it. The browse page reads and writes the query. `docs/plan.md`'s "Browsing" row is amended; `docs/ui.md` gains a divergence row, since the canvas draws the age row only.

What it costs: a second row of text at the top of the shelf, always there, and one more boolean on every shelf item. What it does not change: the grid, the sections, the fading of reserved covers, and that a book page is the only place a person's name appears.
