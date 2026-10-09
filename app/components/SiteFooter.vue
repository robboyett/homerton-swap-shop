<script setup lang="ts">
// On a phone the canvas moves "how it works" out of the nav and down here; your account comes too.
const viewer = useViewer();
</script>

<template>
  <footer class="site-footer">
    <NuxtLink class="site-nav__narrow" to="/how-it-works">how it works</NuxtLink>
    <NuxtLink v-if="viewer" class="site-nav__narrow" to="/requests">requests</NuxtLink>
    <NuxtLink v-if="viewer" class="site-nav__narrow" to="/account">{{ viewer.first_name }}</NuxtLink>
    <span>invite only</span>
    <span>homerton</span>
    <span>everything here is free</span>
  </footer>
</template>
