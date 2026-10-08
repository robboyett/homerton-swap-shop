/**
 * Invite only means signed in (ADR 0009). Two pages are open, so an invitee can read what they
 * are joining and then sign in; everything else sends you to the sign-in page and back.
 */
const OPEN = new Set(["/sign-in", "/how-it-works"]);

export default defineNuxtRouteMiddleware(async (to) => {
  const me = await loadViewer();
  if (me || OPEN.has(to.path)) return;
  return navigateTo({ path: "/sign-in", query: to.fullPath === "/" ? {} : { next: to.fullPath } });
});
