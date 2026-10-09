<script setup lang="ts">
/**
 * A slim bar pinned to the foot of the viewport, full width, naming the cover the pointer is
 * over: title, then author (Rob, 9 Oct). Exists only while something is hovered, and only on
 * devices that hover; a phone never sees it, the tap goes to the book.
 */
const hovered = useHovered();
</script>

<template>
  <div class="hover-bar" :class="{ 'hover-bar--shown': hovered }" aria-hidden="true">
    <span v-if="hovered" class="hover-bar__text">
      {{ hovered.title }}{{ hovered.author ? `, ${hovered.author}` : "" }}
    </span>
  </div>
</template>
