<script setup lang="ts">
/**
 * A cover in a 2:3 slot (docs/ui.md).
 *
 * Real art is drawn at its own proportions, full width, standing on the foot of the slot like a
 * book on a shelf: a square picture book is shorter and the space above it is shelf, a tall
 * paperback fits the height. Nothing is cropped (Rob, 9 Oct).
 *
 * A book with no art gets one of the canvas's fifty coloured designs, chosen by its id
 * (shared/covers.ts), with its title printed at the top in the design's second colour, the way a
 * real cover carries its title. Only covers with no art carry text (Rob, 9 Oct).
 *
 * The link around a cover carries the accessible name, so nothing here has one.
 */
import { type CoverVariant, coverFor } from "~~/shared/covers";
import type { ShelfBook } from "~~/shared/schema";

const props = defineProps<{
  book: Pick<ShelfBook, "id" | "cover_url" | "photo_url"> & Partial<Pick<ShelfBook, "title">>;
  reserved?: boolean;
}>();

const art = computed(() => props.book.photo_url ?? props.book.cover_url);
const cover = computed(() => coverFor(props.book.id));

/**
 * Each design returns two absolutely-positioned shapes, the second usually a highlight. They sit
 * in the lower part of the cover, leaving the top for the title.
 */
const DESIGNS: Record<CoverVariant, (fg: string) => [string, string]> = {
  0: (fg) => [
    `left:20%;top:38%;width:60%;height:40%;border-radius:50%;background:${fg}`,
    "left:0;top:82%;width:100%;height:18%;background:rgba(0,0,0,0.16)",
  ],
  1: (fg) => [
    `left:0;top:48%;width:100%;height:22%;background:${fg}`,
    "left:62%;top:78%;width:22%;height:14.67%;border-radius:50%;background:rgba(255,255,255,0.55)",
  ],
  2: (fg) => [
    `left:14%;top:50%;width:72%;height:48%;border-radius:50% 50% 0 0;background:${fg}`,
    "left:60%;top:36%;width:24%;height:16%;border-radius:50%;background:rgba(255,255,255,0.5)",
  ],
  3: (fg) => [
    `left:18%;top:40%;width:30%;height:50%;background:${fg}`,
    "left:52%;top:56%;width:30%;height:34%;background:rgba(255,255,255,0.45)",
  ],
  4: (fg) => [
    `left:30%;top:66%;width:40%;height:26.67%;border-radius:50%;background:${fg}`,
    "left:-20%;top:76%;width:140%;height:60%;border-radius:50% 50% 0 0;background:rgba(0,0,0,0.2)",
  ],
  5: (fg) => [
    `left:0;top:0;width:100%;height:100%;background:${fg};clip-path:polygon(0 100%,100% 58%,100% 100%)`,
    "left:60%;top:70%;width:26%;height:17.33%;border-radius:50%;background:rgba(255,255,255,0.6)",
  ],
};

const shapes = computed(() => DESIGNS[cover.value.variant](cover.value.fg));
</script>

<template>
  <span class="cover" :class="{ 'cover--reserved': reserved, 'cover--plain': !art }" :style="art ? undefined : { background: cover.bg }">
    <img v-if="art" class="cover__art" :src="art" alt="" loading="lazy" >
    <template v-else>
      <span class="cover__shape" :style="shapes[0]" />
      <span class="cover__shape" :style="shapes[1]" />
      <span v-if="book.title" class="cover__title" :style="{ color: cover.fg }">{{ book.title }}</span>
      <span class="cover__spine" />
    </template>
  </span>
</template>
