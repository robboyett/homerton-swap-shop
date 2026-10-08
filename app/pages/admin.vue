<script setup lang="ts">
/**
 * The admin screen: invites, and nothing else (ADR 0006). Rob makes an account by hand, the
 * site shows the password once, and he hands it over privately in WhatsApp (ADR 0009). The
 * message is copied, never put in a link: a password has no business in a URL.
 * No screen was drawn for this (docs/plan.md, open questions); it is drawn from docs/ui.md alone.
 */
import { cryptoRandom, onetimePassword } from "~~/shared/onetime";
import type { Member } from "~~/shared/schema";

const viewer = useViewer();
if (!viewer.value?.is_admin) {
  throw createError({ statusCode: 404, statusMessage: "no such page", fatal: true });
}

const { data, refresh } = await useFetch("/api/members");
const members = computed(() => data.value?.members ?? []);

const firstName = ref("");
const email = ref("");
const number = ref("");
const password = ref("");
const busy = ref(false);
const note = ref("");

/** The last account made or reset, shown once with its password. Gone on the next action. */
const handover = ref<{ first_name: string; email: string; password: string } | null>(null);
const copied = ref(false);

onMounted(() => {
  password.value = onetimePassword(cryptoRandom);
});

function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/** The message Rob sends. It travels in WhatsApp, as decided, and in no link or URL. */
function handoverText(h: NonNullable<typeof handover.value>) {
  return `hello ${h.first_name}, you're in the homerton swap shop. sign in at ${origin()}/sign-in with ${h.email} and the password ${h.password}`;
}

async function copyHandover() {
  if (!handover.value) return;
  try {
    await navigator.clipboard.writeText(handoverText(handover.value));
    copied.value = true;
  } catch {
    note.value = "couldn't copy. select the message and copy it yourself.";
  }
}

async function invite() {
  busy.value = true;
  note.value = "";
  handover.value = null;
  try {
    const { member } = await $fetch("/api/members", {
      method: "POST",
      body: {
        first_name: firstName.value,
        email: email.value,
        whatsapp_number: number.value,
        password: password.value,
      },
    });
    handover.value = {
      first_name: member.first_name,
      email: member.email,
      password: password.value,
    };
    copied.value = false;
    firstName.value = "";
    email.value = "";
    number.value = "";
    password.value = onetimePassword(cryptoRandom);
    await refresh();
  } catch (e) {
    const err = e as { statusCode?: number; data?: { message?: string } };
    note.value =
      err.statusCode === 409
        ? "that email already has an account. find them in the list below."
        : err.statusCode === 400
          ? "check the email, the number (+44 then ten digits) and the password (12 or more)."
          : "that didn't save. try again in a moment.";
  } finally {
    busy.value = false;
  }
}

async function resetPassword(member: Member) {
  busy.value = true;
  note.value = "";
  handover.value = null;
  const fresh = onetimePassword(cryptoRandom);
  try {
    await $fetch(`/api/members/${member.id}/password`, {
      method: "POST",
      body: { password: fresh },
    });
    handover.value = { first_name: member.first_name, email: member.email, password: fresh };
    copied.value = false;
  } catch {
    note.value = "that didn't save. try again in a moment.";
  } finally {
    busy.value = false;
  }
}

useHead({ title: "invite someone · homerton swap shop" });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <main class="admin">
      <form class="form" @submit.prevent="invite">
        <div class="stack">
          <h1>invite someone</h1>
          <span>this makes their account. you then send them the password yourself, in whatsapp.</span>
        </div>

        <label class="field">
          <span>first name</span>
          <input v-model="firstName" type="text" autocomplete="off" required >
        </label>
        <label class="field">
          <span>email (their username)</span>
          <input v-model="email" type="email" autocomplete="off" required >
        </label>
        <label class="field">
          <span>whatsapp number, +44 then ten digits</span>
          <input v-model="number" type="tel" autocomplete="off" placeholder="+447…" required >
        </label>
        <label class="field">
          <span>their password. keep this one or type your own</span>
          <input v-model="password" type="text" autocomplete="off" required >
        </label>

        <p v-if="note" role="alert">{{ note }}</p>

        <button type="submit" class="button" :disabled="busy">make the account</button>
      </form>

      <section v-if="handover" class="form stack stack--gap" aria-live="polite">
        <div class="stack">
          <span>{{ handover.first_name }}'s account is ready.</span>
          <span>
            send them this in whatsapp, privately. it is shown here once, and it stays their
            password until you set another.
          </span>
        </div>
        <p class="handover">{{ handoverText(handover) }}</p>
        <button type="button" class="button" @click="copyHandover">
          {{ copied ? "copied. paste it into their whatsapp" : "copy the message" }}
        </button>
      </section>

      <section class="form stack stack--gap">
        <h2>everyone</h2>
        <ul class="members">
          <li v-for="m in members" :key="m.id" class="member">
            <span>{{ m.first_name }}</span>
            <span>{{ m.email }}</span>
            <span v-if="m.is_admin">admin</span>
            <span v-else-if="m.invited_by_first_name">invited by {{ m.invited_by_first_name }}</span>
            <button type="button" class="text-button" :disabled="busy" @click="resetPassword(m)">
              new password
            </button>
          </li>
        </ul>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
