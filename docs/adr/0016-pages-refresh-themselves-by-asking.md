# Pages keep themselves current by asking again, not by being pushed to

**Date:** 9 October 2026 · **Status:** accepted (Rob, 9 Oct)

**Context.** A shelf, a book page and the requests list know only what they fetched when they loaded. Rob asked (9 Oct) that the site notice what other people do: a book of his gets asked for, a book he is looking at gets reserved or taken off, without him reloading the page.

Three ways to do that:

- **Push.** Server-sent events or a websocket from the server to every open page. Instant, and the most machinery: a connection per open tab, something to fan changes out to, reconnection, and a Vercel function held open per viewer.
- **Notifications off the site.** Browser push needs a service worker, a permission prompt, signing keys and, on an iPhone, the site installed to the home screen. WhatsApp messages from the site are on the "out until an ADR" list.
- **Ask again.** Each open page re-fetches its own data every thirty seconds and whenever its tab comes back into view, and the parts that changed redraw. A hundred people asking once every thirty seconds is a few requests a second at the very busiest.

**Decision.**

1. **Pages ask again.** The shelf, a book page and requests refresh every thirty seconds while visible, and at once when the tab regains focus. Nothing is pushed. A change made by somebody else is on your screen within half a minute, or the moment you look back at it.
2. **A refresh never undoes what you were doing.** It is skipped while one of your own moves is in flight, the age filter stays, the pile is never refreshed at all, and on requests the books you ticked as collected this visit stay in view with their undo.
3. **The nav says how many are waiting for you.** "requests 2" is the number of your books other people currently hold. It is fetched with every page and refreshed on the same rhythm. Books you have asked for are not counted: those are yours to chase.
4. **Nothing reaches a closed site.** When your phone is in your pocket, the requester messages you on WhatsApp, which the plan has always said is where the conversation happens. Push notifications are a later decision, taken only if requests turn out to be missed.

**Consequences.** One composable, `useLive`, holds the rhythm; three pages call it. `GET /api/requests/count` and one count query. ADR 0013's "until the list next reloads" now means "until you leave the page", because collected rows are kept across refreshes.

What it costs: a request every thirty seconds per open tab, and a delay of up to thirty seconds before another person's move shows. A page left open all day asks about three thousand times, each one a small query; that is the price of no connections to keep alive.

What it does not change: the four moves and their guards. A refresh only reads. A refused move still answers with the current state, as it always did.
