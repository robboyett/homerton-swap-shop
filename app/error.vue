<script setup lang="ts">
/**
 * The error page, in the house look rather than the framework's. Two cases matter: a page that
 * is not here, and something going wrong at our end. Nothing technical is shown; the detail is in
 * the server log, and the runbook says where to look.
 */
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error.statusCode === 404);

function home() {
  clearError({ redirect: "/" });
}

useHead({
  title: () => `${notFound.value ? "not here" : "something went wrong"} · homerton swap shop`,
});
</script>

<template>
  <div class="page">
    <header class="site-header">
      <a href="/">homerton swap shop</a>
    </header>

    <main class="form">
      <div class="stack">
        <h1>{{ notFound ? "that page isn't here" : "something went wrong at our end" }}</h1>
        <span>
          {{
            notFound
              ? "the link may be old, or the book may have come off the shelf."
              : "it has been noted. try again in a moment, or ask in the whatsapp group."
          }}
        </span>
      </div>
      <button type="button" class="button" @click="home">back to the shelf</button>
    </main>

    <SiteFooter />
  </div>
</template>
