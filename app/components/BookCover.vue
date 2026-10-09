<script setup lang="ts">
/**
 * A cover: 2:3 with a 5% spine strip down the left (docs/ui.md). With `labelled`, a slim ink bar
 * with the title over the author rises along the foot while a pointer is over it, and only then:
 * the grid stays clean until you ask (Rob, 9 Oct). Covers in the grid are about a hundred pixels
 * wide, too narrow for a title, so the bar may overhang the cover sideways, up to twice its
 * width, like a label resting on the shelf; that is why it sits outside the cover's clipping.
 * Touch screens never hover; the tap goes to the page. Real art when the book has
 * any; otherwise one of the canvas's fifty coloured designs, chosen by the book's id
 * (shared/covers.ts). The link around it carries the accessible name, so the image has none.
 */
import { type CoverVariant, coverFor } from "~~/shared/covers";
import type { ShelfBook } from "~~/shared/schema";

const props = defineProps<{
  book: Pick<ShelfBook, "id" | "cover_url" | "photo_url"> &
    Partial<Pick<ShelfBook, "title" | "author">>;
  reserved?: boolean;
  /** Show the title and author in a slim bar along the foot of the cover while the pointer is over it. */
  labelled?: boolean;
}>();

const art = computed(() => props.book.photo_url ?? props.book.cover_url);
const cover = computed(() => coverFor(props.book.id));

/** Each design returns two absolutely-positioned shapes, the second usually a highlight. */
const DESIGNS: Record<CoverVariant, (fg: string) => [string, string]> = {
  0: (fg) => [
    `left:20%;top:28%;width:60%;height:40%;border-radius:50%;background:${fg}`,
    "left:0;top:80%;width:100%;height:20%;background:rgba(0,0,0,0.16)",
  ],
  1: (fg) => [
    `left:0;top:38%;width:100%;height:24%;background:${fg}`,
    "left:62%;top:12%;width:22%;height:14.67%;border-radius:50%;background:rgba(255,255,255,0.55)",
  ],
  2: (fg) => [
    `left:14%;top:46%;width:72%;height:48%;border-radius:50% 50% 0 0;background:${fg}`,
    "left:14%;top:10%;width:30%;height:20%;border-radius:50%;background:rgba(255,255,255,0.5)",
  ],
  3: (fg) => [
    `left:18%;top:20%;width:30%;height:62%;background:${fg}`,
    "left:52%;top:42%;width:30%;height:40%;background:rgba(255,255,255,0.45)",
  ],
  4: (fg) => [
    `left:30%;top:10%;width:40%;height:26.67%;border-radius:50%;background:${fg}`,
    "left:-20%;top:62%;width:140%;height:60%;border-radius:50% 50% 0 0;background:rgba(0,0,0,0.2)",
  ],
  5: (fg) => [
    `left:0;top:0;width:100%;height:100%;background:${fg};clip-path:polygon(0 100%,100% 45%,100% 100%)`,
    "left:60%;top:10%;width:26%;height:17.33%;border-radius:50%;background:rgba(255,255,255,0.6)",
  ],
};

const shapes = computed(() => DESIGNS[cover.value.variant](cover.value.fg));
</script>

<template>
  <span class="cover-wrap" :class="{ 'cover-wrap--reserved': reserved }">
    <span class="cover" :style="{ background: cover.bg }">
    <img v-if="art" class="cover__art" :src="art" alt="" loading="lazy" >
    <template v-else>
      <span class="cover__shape" :style="shapes[0]" />
      <span class="cover__shape" :style="shapes[1]" />
    </template>
    <span class="cover__spine" />
    </span>
    <span v-if="labelled && book.title" class="cover__label" aria-hidden="true">
      <span class="cover__label-line">{{ book.title }}</span>
      <span v-if="book.author" class="cover__label-line">{{ book.author }}</span>
    </span>
  </span>
</template>
