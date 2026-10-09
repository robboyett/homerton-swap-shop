<script setup lang="ts">
// The canvas nav carries five items, and every one now goes somewhere. The fifth is you (/account).
const viewer = useViewer();

// How many of your books other people hold, on every page, refreshed on the same rhythm as the
// pages themselves (ADR 0016). Nothing is fetched when signed out.
const { data: live, refresh } = await useFetch("/api/requests/count", {
  immediate: !!viewer.value,
  default: () => ({ waiting: 0 }),
});
useLive(async () => {
  if (viewer.value) await refresh();
});
const waiting = computed(() => (viewer.value ? (live.value?.waiting ?? 0) : 0));
</script>

<template>
  <header class="site-header">
    <NuxtLink to="/">homerton swap shop</NuxtLink>
    <nav v-if="viewer" class="site-nav">
      <NuxtLink class="site-nav__wide" to="/">browse</NuxtLink>
      <NuxtLink to="/add">add books</NuxtLink>
      <NuxtLink class="site-nav__wide" to="/how-it-works">how it works</NuxtLink>
      <NuxtLink class="site-nav__wide" to="/requests">
        requests{{ waiting > 0 ? ` ${waiting}` : "" }}
      </NuxtLink>
      <NuxtLink class="site-nav__wide" to="/account">{{ viewer.first_name }}</NuxtLink>
    </nav>
    <nav v-else class="site-nav">
      <NuxtLink to="/how-it-works">how it works</NuxtLink>
      <NuxtLink to="/sign-in">sign in</NuxtLink>
    </nav>
  </header>
</template>
