<script setup lang="ts">
/**
 * The signed-in profile: who you are, and the way out. The nav item in the canvas had no screen
 * behind it (docs/plan.md, open questions); this is it, drawn plainly from docs/ui.md (Rob, 8 Oct).
 */
const viewer = useViewer();

async function signOut() {
  await $fetch("/api/sign-out", { method: "POST" });
  viewer.value = null;
  await navigateTo("/sign-in", { replace: true });
}

useHead({ title: "your account · homerton swap shop" });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <main v-if="viewer" class="form">
      <div class="stack">
        <h1>{{ viewer.first_name }}</h1>
        <span>signed in as {{ viewer.email }}</span>
      </div>

      <div class="stack">
        <span>your whatsapp number is shown only to the other side of a live reservation.</span>
        <span>to change your password or your number, ask rob.</span>
      </div>

      <div v-if="viewer.is_admin">
        <NuxtLink to="/admin">invite someone</NuxtLink>
      </div>

      <div>
        <button type="button" class="text-button" @click="signOut">sign out</button>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>
