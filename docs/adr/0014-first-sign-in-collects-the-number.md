# The first sign-in collects your mobile number, and giving it is the consent

**Date:** 9 October 2026 · **Status:** accepted (Rob, 9 Oct)

**Context.** Until now Rob typed each person's WhatsApp number on the invite screen. He did not notice that he had, which is the point: it is the kind of field that gets skipped, and it puts a neighbour's number in Rob's hands before the neighbour has said anything. `docs/plan.md` also still carried the oldest open question, consent to share numbers, "proposed at invite time, so reserving never surprises anyone. Not built."

Rob asked for two things at once (9 Oct): the person should give their own number, required before the site works for them; and a new member should be met by something short that explains the premise and where things are.

**Decision.**

1. **A new account has no number.** Rob makes it with a first name and an email. He may still type a number if he has it; the field is optional.
2. **The first sign-in is a welcome page, shown until the number is given.** Three short parts, one box, one button: what this is, how it works and where things are, and the mobile number, "the one you use on whatsapp". Every other page sends a person without a number back here. Not a pop-up: on this site a plain page shown once is the same thing with less machinery.
3. **Giving the number is the consent, and the sentence above the box is the promise:** shown only to the other side of a live reservation, never on the shelf, never to anyone else, never used by us for anything. No tick box. The open question closes.
4. **Without a number you can look but not ask or give.** Reserving a book and publishing a pile both need one, because each is the moment a number gets shown to somebody. The reserve guard is in the UPDATE's WHERE clause like every other rule; publish checks the signed-in person. Releasing, collecting and undoing need nothing, since they show nothing.
5. **Changing the number later is Rob's**, from the admin screen, the same as a password (ADR 0009, confirmed 9 Oct). The welcome box works once.

**Consequences.** Migration `0004` drops `NOT NULL` from `profiles.whatsapp_number`. `Me` and the admin's member list gain `has_number`, so the middleware can route and Rob can see who has not finished. `app/pages/welcome.vue` is drawn from `docs/ui.md` alone, like the other undrawn screens. `docs/plan.md` loses its last open question and gains a Decided row; `docs/data.md` says the number is null until the first sign-in.

What it costs: a nullable column where there was a promise of a value, and one more state a person can be in. A member who never finishes the welcome page is a member who can browse and nothing else, which is the right failure. Rob's existing account has a number and never sees the page.

What it does not change: rule 4. The number is still the one thing the site hands from one neighbour to another, still only inside a live reservation, still typed into no link. Still invite only; the email is still the username.

**Amended 9 October 2026 (Rob): the invite form takes no number at all.** Point 1 let Rob type a number if he had it. The fresh review of the invite screen pointed out that a person whose number Rob typed never sees the welcome page, and so never reads the promise this ADR calls the consent. Rob chose to remove the field. The only way a number arrives now is the person giving it on the welcome page; an admin can still correct one later from "edit", which is point 5 and happens after the consent, not instead of it.
