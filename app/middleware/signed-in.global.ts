/**
 * Invite only means signed in (ADR 0009). Two pages are open, so an invitee can read what they
 * are joining and then sign in; everything else sends you to the sign-in page and back.
 * A signed-in person who has not given their number yet is sent to the welcome page (ADR 0014).
 */
const OPEN = new Set(["/sign-in", "/how-it-works"]);
const BEFORE_NUMBER = new Set(["/welcome", "/how-it-works"]);

export default defineNuxtRouteMiddleware(async (to) => {
  const me = await loadViewer();
  if (!me) {
    if (OPEN.has(to.path)) return;
    return navigateTo({
      path: "/sign-in",
      query: to.fullPath === "/" ? {} : { next: to.fullPath },
    });
  }
  if (!me.has_number && !BEFORE_NUMBER.has(to.path)) return navigateTo("/welcome");
  if (me.has_number && to.path === "/welcome") return navigateTo("/");
});
