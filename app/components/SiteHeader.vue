<script setup lang="ts">
// The canvas nav carries five items. "add books" is Phase 3, and "requests" and the signed-in
// profile have no screens drawn at all (docs/plan.md, open questions). They are plain text until
// they go somewhere: in this design a link and a span look identical until you hover one.
</script>

<template>
  <header class="site-header">
    <NuxtLink to="/">homerton swap shop</NuxtLink>
    <nav class="site-nav">
      <NuxtLink class="site-nav__wide" to="/">browse</NuxtLink>
      <span>add books</span>
      <NuxtLink class="site-nav__wide" to="/how-it-works">how it works</NuxtLink>
      <span class="site-nav__wide">requests</span>
      <span class="site-nav__wide">priya</span>
    </nav>
  </header>
</template>
