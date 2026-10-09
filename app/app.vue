<script setup lang="ts">
// The hovered-book bar lives once, here, and forgets its book whenever the route changes.
const hovered = useHovered();
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    hovered.value = null;
  },
);
</script>

<template>
  <NuxtPage />
  <HoverBar />
</template>
