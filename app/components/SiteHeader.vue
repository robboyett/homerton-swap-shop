<script setup lang="ts">
// The canvas nav carries five items. "requests" has no screen drawn (docs/plan.md, open
// questions) and is plain text until it goes somewhere, since in this design a link and a span
// look identical until you hover one. The fifth item is you (/account).
const viewer = useViewer();
</script>

<template>
  <header class="site-header">
    <NuxtLink to="/">homerton swap shop</NuxtLink>
    <nav v-if="viewer" class="site-nav">
      <NuxtLink class="site-nav__wide" to="/">browse</NuxtLink>
      <NuxtLink to="/add">add books</NuxtLink>
      <NuxtLink class="site-nav__wide" to="/how-it-works">how it works</NuxtLink>
      <span class="site-nav__wide">requests</span>
      <NuxtLink class="site-nav__wide" to="/account">{{ viewer.first_name }}</NuxtLink>
    </nav>
    <nav v-else class="site-nav">
      <NuxtLink to="/how-it-works">how it works</NuxtLink>
      <NuxtLink to="/sign-in">sign in</NuxtLink>
    </nav>
  </header>
</template>
