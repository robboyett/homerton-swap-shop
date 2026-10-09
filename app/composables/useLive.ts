import type { Ref } from "vue";

/**
 * Keep a page current by asking again (ADR 0016): every thirty seconds while the tab is visible,
 * at once when it comes back into view, and once when the page opens by navigation (a server
 * render already has fresh data). Browser only; nothing happens on the server.
 *
 * A refresh never undoes what the person was doing: it is skipped while `paused` (one of the
 * page's own moves in flight), and if the fetch fails, which is exactly what a phone waking from
 * a pocket does, the data from before is put back rather than the page going blank.
 */
export function useLive<T>(live: {
  data: Ref<T>;
  error: Ref<unknown>;
  refresh: () => Promise<unknown>;
  paused?: () => boolean;
}) {
  const EVERY_MS = 30_000;
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = async () => {
    if (document.hidden || live.paused?.()) return;
    const before = live.data.value;
    await live.refresh();
    if (live.error.value) {
      live.data.value = before;
      live.error.value = undefined;
    }
  };
  const onVisible = () => {
    if (!document.hidden) void tick();
  };

  onMounted(() => {
    if (!useNuxtApp().isHydrating) void tick();
    timer = setInterval(() => void tick(), EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
  });
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
  });
}
