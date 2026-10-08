# People sign in with an email address and a password, so email joins profiles

**Date:** 8 October 2026 · **Status:** accepted (Rob, 8 Oct)

**Context.** Phase 2 needs sign-in, and the `profiles` table had nothing to sign in *with*. It held a first name, a WhatsApp number and a password hash, and `docs/data.md` said in so many words: no email. The first review of the Phase 2 database (#6) asked Rob what a person should type into the first box.

Three options were on the table:

- **The WhatsApp number.** Already stored, and unique in practice. But it makes the one sensitive field in the product do a second job: typed into a login box on a shared tablet, autofilled by a browser, shown back on a sign-in error. The number exists to be handed to the other side of a live reservation and for nothing else (`docs/data.md`, rule 4). Giving it a second use is how a field ends up somewhere it should not be.
- **A chosen username.** One more thing Rob has to invent per household, relay in WhatsApp, and remember when someone forgets it. First names collide; `priya2` is nobody's idea of a neighbourly site.
- **An email address.** Everyone has one, password managers key on it, and Rob already has it from arranging the invite. It is unique by construction and nobody has to invent anything.

Rob chose email as the username (8 Oct).

**Decision.**

1. **The username is an email address.** `profiles.email`, stored lower-cased and trimmed, unique. The sign-in form is two boxes and a button.
2. **The email is an identifier and nothing else.** It is never shown to another member, never used to send anything, and there is no "forgot password" flow: Rob resets a password by hand, the same way he made the account. The site sends no mail at all, so it needs no mail provider.
3. **The password is set by Rob at invite time**, at least twelve characters, and handed over privately in WhatsApp. It is stored as an scrypt hash from `node:crypto`, no library. Rob's own account is made once, by a route that works only while the table is empty.
4. **A session is a sealed cookie,** h3's `useSession`, thirty days, `HttpOnly`, `SameSite=Lax`, holding the profile id and nothing else. The key is `NUXT_SESSION_SECRET`. No sessions table; signing out clears the cookie.
5. **Being signed in is what "invite only" means for the site.** The shelf and the book pages require it. "How it works" and the sign-in page do not, so an invitee can read what they are joining.

**Consequences.** `docs/data.md`'s profile table gains `email` and loses the line that said it would never hold one; `docs/plan.md`'s Auth row names email. Migration `0002` adds the column. `shared/schema.ts`'s `profileSchema`, which is the shape that reaches the browser, does *not* gain it, for the same reason it does not carry `password_hash`: a bystander on a book page has no business receiving anyone's email. The only routes that return an email return your own, to you: `/api/me`, and the two that sign you in.

What it costs: one more piece of personal data held about a neighbour, in a public repo's database. The rule for the tree is the same as for phone numbers: seeds, fixtures, tests and docs use `@example.com` addresses (RFC 2606) and nothing else. There is no gate for it yet; `REVIEW.md`'s third pass reads for it, and the gate arrives if the rule fails twice, which is how the phone-number gate earned its place (ADR 0005). Also: no rate limiting on the sign-in route. A hundred neighbours do not need one and the hash is slow by design; revisit if anyone ever sees a login attempt that is not theirs.

What it does not change: still invite only, with accounts made by hand. Still two tables. Still no surname, address or postcode. The WhatsApp number is still shown only to the other side of a live reservation, and is now typed into nothing.

**Amended 8 October 2026 (the invite screen): the admin sees emails.** Decision 2 said the email is never shown to another member. The admin screen (`/admin`) lists every member with their email, because Rob typed it in and it is the only way to tell two Priyas apart when resetting a password. It is shown to admins and to nobody else; `/api/members` answers 403 to everyone else. Still never shown on a book page, in a reservation, or to a neighbour. Still used to send nothing: the password travels in a WhatsApp message Rob composes on the admin screen, copies, and sends himself. It is never put in a link, because a `wa.me` URL carrying a password would pass through a third party's web server and sit in a browser history. One more thing said plainly: with no change-password screen, the password Rob hands over is the person's password until he sets another, so "one-time" describes how it is shown, not how long it lasts.
