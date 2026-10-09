/**
 * Keep a page current by asking again (ADR 0016): every thirty seconds while the tab is visible,
 * and at once when it comes back into view. Browser only; nothing happens on the server.
 * `refresh` is the page's own refetch; `paused` lets a page hold off while one of its own moves
 * is in flight, so a refresh never undoes what the person was doing.
 */
export function useLive(refresh: () => Promise<unknown>, paused?: () => boolean) {
  const EVERY_MS = 30_000;
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (document.hidden || paused?.()) return;
    refresh().catch(() => undefined);
  };
  const onVisible = () => {
    if (!document.hidden) tick();
  };

  onMounted(() => {
    timer = setInterval(tick, EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
  });
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
  });
}
