import type { Me } from "~~/shared/schema";

/**
 * The signed-in person. `null` is signed out; `undefined` is "not asked yet", which only the
 * global middleware should ever see, since it asks on every navigation before a page renders.
 */
export function useViewer() {
  return useState<Me | null | undefined>("viewer", () => undefined);
}

/** Ask /api/me once per page load. Forwards the cookie when rendering on the server. */
export async function loadViewer(): Promise<Me | null> {
  const viewer = useViewer();
  if (viewer.value !== undefined) return viewer.value;
  const { viewer: me } = await useRequestFetch()<{ viewer: Me | null }>("/api/me");
  viewer.value = me;
  return me;
}
