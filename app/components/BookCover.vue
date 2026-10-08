<script setup lang="ts">
/**
 * A cover: 2:3, two coloured shapes, and a 5% spine strip down the left (docs/ui.md).
 *
 * The six shape designs are ported from the design canvas (docs/design/Main.dc.html) and are
 * Phase 1 stand-ins for real cover art. In Phase 3 a real cover_url replaces all of this and
 * `variant` goes away with it.
 */
import type { CoverVariant, MockCover } from "~~/shared/fixtures";

const props = defineProps<{
  mock: MockCover;
  reserved?: boolean;
}>();

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

const shapes = computed(() => DESIGNS[props.mock.variant](props.mock.fg));
</script>

<template>
  <span class="cover" :class="{ 'cover--reserved': reserved }" :style="{ background: mock.bg }">
    <span class="cover__shape" :style="shapes[0]" />
    <span class="cover__shape" :style="shapes[1]" />
    <span class="cover__spine" />
  </span>
</template>
