import type { ShelfBook } from "~~/shared/schema";

/**
 * The book the pointer is over, if any, for the bar along the foot of the viewport (docs/ui.md).
 * One value for the whole page: moving from cover to cover replaces it, leaving clears it.
 */
export function useHovered() {
  return useState<Pick<ShelfBook, "title" | "author"> | null>("hovered-book", () => null);
}
