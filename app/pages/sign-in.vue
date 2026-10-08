<script setup lang="ts">
/**
 * Sign in: two boxes and a button (ADR 0009). Not on the canvas; drawn from docs/ui.md alone,
 * which Rob asked for (8 Oct). Copy says what will happen, not what the button is called.
 */
const viewer = useViewer();
const route = useRoute();

if (viewer.value) await navigateTo("/", { replace: true });

const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

/** Only a path on this site. Anything else, including `//evil`, goes to the shelf. */
function nextPath(): string {
  const next = typeof route.query.next === "string" ? route.query.next : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

async function submit() {
  busy.value = true;
  error.value = "";
  try {
    const { viewer: me } = await $fetch("/api/sign-in", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    viewer.value = me;
    await navigateTo(nextPath(), { replace: true });
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    error.value =
      status === 401 || status === 400
        ? "that email and password don't match. check for a typo, or ask rob in the group."
        : "something went wrong at our end. try again in a moment.";
  } finally {
    busy.value = false;
  }
}

useHead({ title: "sign in · homerton swap shop" });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <main>
      <form class="form" @submit.prevent="submit">
        <div class="stack">
          <h1>sign in</h1>
          <span>invite only. rob makes the accounts; ask in the whatsapp group.</span>
        </div>

        <label class="field">
          <span>email</span>
          <input v-model="email" type="email" name="email" autocomplete="username" required >
        </label>

        <label class="field">
          <span>password</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          >
        </label>

        <p v-if="error" role="alert">{{ error }}</p>

        <button type="submit" class="button" :disabled="busy">
          {{ busy ? "signing in" : "sign in" }}
        </button>
      </form>
    </main>

    <SiteFooter />
  </div>
</template>
