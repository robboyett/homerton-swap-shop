<script setup lang="ts">
/**
 * The first sign-in (ADR 0014): what this is, how it works and where things are, and the one box
 * for the mobile number. Shown until the number is given; the sentence above the box is the
 * promise, and giving the number is the consent. Drawn from docs/ui.md alone; no board exists.
 */
const viewer = useViewer();
const number = ref("");
const busy = ref(false);
const note = ref("");

/**
 * People type numbers the way they say them: "07700 900123", "(0)7700-900123", "+44 7700 900123".
 * Tidy the typing; what is stored is always +44 and ten digits, which the server insists on.
 */
function tidy(typed: string): string {
  const bare = typed.replace(/[\s\-()]/g, "");
  if (bare.startsWith("+440")) return `+44${bare.slice(4)}`; // "+44 (0)7700 …"
  if (bare.startsWith("+")) return bare;
  if (bare.startsWith("0044")) return `+44${bare.slice(4)}`;
  if (bare.startsWith("0")) return `+44${bare.slice(1)}`;
  if (bare.startsWith("44")) return `+${bare}`;
  return bare;
}

async function give() {
  busy.value = true;
  note.value = "";
  try {
    const { viewer: me } = await $fetch("/api/me/number", {
      method: "POST",
      body: { whatsapp_number: tidy(number.value) },
    });
    viewer.value = me;
    await navigateTo("/", { replace: true });
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    note.value =
      status === 400
        ? "that doesn't look like a uk mobile. 07 and ten more digits, or +44 and ten digits."
        : status === 409
          ? "your number is already set. ask rob if it needs changing."
          : "something went wrong at our end. try again in a moment.";
  } finally {
    busy.value = false;
  }
}

async function signOut() {
  await $fetch("/api/sign-out", { method: "POST" });
  viewer.value = null;
  await navigateTo("/sign-in", { replace: true });
}

useHead({ title: "welcome · homerton swap shop" });
</script>

<template>
  <div class="page">
    <header class="site-header">
      <span>homerton swap shop</span>
      <nav class="site-nav">
        <NuxtLink to="/how-it-works">how it works</NuxtLink>
      </nav>
    </header>

    <main class="welcome">
      <div class="stack">
        <h1>welcome{{ viewer ? `, ${viewer.first_name}` : "" }}</h1>
        <span>neighbours giving away kids' books, for free. nobody pays, nobody sells.</span>
      </div>

      <div class="stack mt-36">
        <h2>how it works</h2>
        <span>
          browse the shelf and tap "I'd like this" to reserve a book. message the owner on whatsapp
          to arrange a time. tick "we've collected it" when you have it.
        </span>
        <span>add your own books by scanning the barcode under "add books".</span>
        <span>"requests" is everything you've asked for and everything asked of you, in one place.</span>
      </div>

      <form class="form" @submit.prevent="give">
        <div class="stack">
          <h2>your mobile number</h2>
          <span>
            the one you use on whatsapp. it's shown only to the other side of a live reservation,
            never on the shelf, never to anyone else, and never used by us for anything. you can
            change it later by asking rob.
          </span>
        </div>
        <label class="field">
          <span>your mobile, with or without the +44</span>
          <input v-model="number" type="tel" autocomplete="tel" placeholder="+447…" required >
        </label>
        <p v-if="note" role="alert">{{ note }}</p>
        <button type="submit" class="button" :disabled="busy || !number">ok, I'm in</button>
      </form>

      <div class="mt-40">
        <button type="button" class="text-button" @click="signOut">not you? sign out</button>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>
