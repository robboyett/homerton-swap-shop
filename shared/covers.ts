/**
 * A cover for a book that has no cover art: one of the fifty designs the canvas draws
 * (docs/design/Main.dc.html), chosen by a hash of the item id so the same book always gets the
 * same cover and a shelf of them stays mixed. Rob asked that blank covers stay colourful like
 * the mocks (8 Oct). Real art, when there is a cover_url or photo_url, replaces all of this.
 */

/** The canvas draws six shape designs. There are exactly six, so the type says so. */
export type CoverVariant = 0 | 1 | 2 | 3 | 4 | 5;

export type Cover = { bg: string; fg: string; variant: CoverVariant };

/** Background, foreground, shape design: the fifty covers on the canvas, in its order. */
export const COVERS: readonly Cover[] = (
  [
    ["#e9c46a", "#264653", 0],
    ["#f4a261", "#2a9d8f", 1],
    ["#a8dadc", "#1d3557", 2],
    ["#ffb703", "#fb8500", 4],
    ["#cdb4db", "#4a3b6b", 0],
    ["#b7e4c7", "#1b4332", 5],
    ["#ffafcc", "#7b2d4f", 2],
    ["#8ecae6", "#023047", 3],
    ["#f28482", "#f6bd60", 1],
    ["#84a59d", "#f5cac3", 4],
    ["#fefae0", "#bc6c25", 5],
    ["#dda15e", "#283618", 0],
    ["#606c38", "#fefae0", 1],
    ["#e76f51", "#f6e7c8", 3],
    ["#bde0fe", "#2a4d8f", 4],
    ["#ffd166", "#073b4c", 2],
    ["#06d6a0", "#073b4c", 5],
    ["#ef476f", "#ffd166", 0],
    ["#118ab2", "#ffd166", 1],
    ["#f4a261", "#264653", 4],
    ["#0b132b", "#f4d35e", 5],
    ["#22223b", "#f2e9e4", 2],
    ["#9a8c98", "#f2e9e4", 0],
    ["#e9c46a", "#264653", 3],
    ["#2a9d8f", "#e9f5db", 4],
    ["#bc4749", "#f2e8cf", 1],
    ["#386641", "#f2e8cf", 5],
    ["#ffb4a2", "#6d6875", 2],
    ["#6d597a", "#eaac8b", 0],
    ["#3a5a40", "#dad7cd", 3],
    ["#1d3557", "#ffd166", 5],
    ["#3c096c", "#ff9e00", 2],
    ["#14213d", "#fca311", 0],
    ["#5f0f40", "#fb8b24", 4],
    ["#0f4c5c", "#e36414", 1],
    ["#2b2d42", "#edf2f4", 3],
    ["#540b0e", "#e09f3e", 5],
    ["#335c67", "#fff3b0", 2],
    ["#7209b7", "#f72585", 0],
    ["#a7c957", "#386641", 3],
    ["#219ebc", "#023047", 0],
    ["#ffb703", "#023047", 4],
    ["#8ecae6", "#219ebc", 1],
    ["#ccd5ae", "#606c38", 5],
    ["#e9edc9", "#bc6c25", 2],
    ["#212529", "#e9ecef", 2],
    ["#6a040f", "#faa307", 0],
    ["#03071e", "#ffba08", 5],
    ["#370617", "#f48c06", 3],
    ["#cdb4db", "#22223b", 1],
  ] as const
).map(([bg, fg, variant]) => ({ bg, fg, variant }));

/** FNV-1a, 32-bit. Not cryptographic; it only has to spread ids across fifty covers. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function coverFor(seed: string): Cover {
  const cover = COVERS[hash(seed) % COVERS.length];
  if (!cover) throw new Error("no covers");
  return cover;
}
