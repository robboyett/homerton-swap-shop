<script setup lang="ts">
/**
 * The admin screen: invites and moderation, nothing else (ADR 0006, ADR 0012). Rob makes an
 * account by hand, the site shows the password once, and he hands it over privately in
 * WhatsApp (ADR 0009); the message is copied, never put in a link. Below that, everyone who is
 * in and every book that is up, each with the one or two things an admin may do to it.
 * No screen was drawn for this (docs/plan.md, open questions); it is drawn from docs/ui.md alone.
 */
import { cryptoRandom, onetimePassword } from "~~/shared/onetime";
import type { AdminBook, Member } from "~~/shared/schema";

const viewer = useViewer();
if (!viewer.value?.is_admin) {
  throw createError({ statusCode: 404, statusMessage: "no such page", fatal: true });
}

const { data, refresh } = await useFetch("/api/members");
const members = computed(() => data.value?.members ?? []);
const { data: bookData, refresh: refreshBooks } = await useFetch("/api/admin/items");
const books = computed(() => bookData.value?.books ?? []);
const onShelf = computed(() => books.value.filter((b) => b.status !== "removed"));
const offShelf = computed(() => books.value.filter((b) => b.status === "removed"));

const firstName = ref("");
const email = ref("");
const number = ref("");
const password = ref("");
const busy = ref(false);
const note = ref("");

/** The last account made or reset, shown once with its password. Gone on the next action. */
const handover = ref<{ first_name: string; email: string; password: string } | null>(null);
const copied = ref(false);

/** Which member is being edited, and the draft. One at a time. */
const editing = ref<{ id: string; first_name: string; whatsapp_number: string } | null>(null);
/** "sure?" state: the id of the thing whose remove button was pressed once. */
const armed = ref<string | null>(null);
/** The reason box for the book whose remove button was pressed once. */
const reason = ref("");

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

function failed(e: unknown): string {
  const err = e as { statusCode?: number; data?: { message?: string } };
  if (err.statusCode === 409) return err.data?.message ?? "that has just changed.";
  if (err.statusCode === 400)
    return "check the email, the number (+44 then ten digits) and the password (12 or more).";
  return "that didn't save. try again in a moment.";
}

/** Run one admin action with the shared busy flag and note. */
async function act(run: () => Promise<unknown>) {
  busy.value = true;
  note.value = "";
  handover.value = null;
  try {
    await run();
  } catch (e) {
    note.value = failed(e);
  } finally {
    busy.value = false;
    armed.value = null;
  }
}

function invite() {
  return act(async () => {
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
  });
}

function resetPassword(member: Member) {
  const fresh = onetimePassword(cryptoRandom);
  return act(async () => {
    await $fetch(`/api/members/${member.id}/password`, {
      method: "POST",
      body: { password: fresh },
    });
    handover.value = { first_name: member.first_name, email: member.email, password: fresh };
    copied.value = false;
  });
}

function startEdit(member: Member) {
  editing.value = { id: member.id, first_name: member.first_name, whatsapp_number: "" };
}

function saveEdit() {
  const draft = editing.value;
  if (!draft) return;
  return act(async () => {
    await $fetch(`/api/members/${draft.id}`, {
      method: "PATCH",
      body: {
        first_name: draft.first_name,
        ...(draft.whatsapp_number ? { whatsapp_number: draft.whatsapp_number } : {}),
      },
    });
    editing.value = null;
    await refresh();
  });
}

/** First press arms the button ("sure?"); second press does it. No dialogs. */
function removeMember(member: Member) {
  if (armed.value !== member.id) {
    armed.value = member.id;
    return;
  }
  return act(async () => {
    await $fetch(`/api/members/${member.id}/remove`, { method: "POST" });
    await Promise.all([refresh(), refreshBooks()]);
  });
}

function restoreMember(member: Member) {
  return act(async () => {
    await $fetch(`/api/members/${member.id}/restore`, { method: "POST" });
    await refresh();
  });
}

function removeBook(book: AdminBook) {
  if (armed.value !== book.id) {
    armed.value = book.id;
    reason.value = "";
    return;
  }
  return act(async () => {
    await $fetch(`/api/items/${book.id}/remove`, {
      method: "POST",
      body: { reason: reason.value },
    });
    await refreshBooks();
  });
}

function restoreBook(book: AdminBook) {
  return act(async () => {
    await $fetch(`/api/items/${book.id}/restore`, { method: "POST" });
    await refreshBooks();
  });
}

useHead({ title: "admin · homerton swap shop" });
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

        <button type="submit" class="button" :disabled="busy">make the account</button>
      </form>

      <p v-if="note" class="mt-28" role="alert">{{ note }}</p>

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
            <template v-if="editing?.id === m.id && editing">
              <form class="member__edit" @submit.prevent="saveEdit">
                <label class="field">
                  <span>first name</span>
                  <input v-model="editing.first_name" type="text" required >
                </label>
                <label class="field">
                  <span>new whatsapp number, +44 then ten digits. leave blank to keep theirs</span>
                  <input v-model="editing.whatsapp_number" type="tel" placeholder="+447…" >
                </label>
                <div class="choices">
                  <button type="submit" class="text-button" :disabled="busy">save</button>
                  <button type="button" class="text-button" @click="editing = null">leave it</button>
                </div>
              </form>
            </template>
            <template v-else>
              <span>{{ m.first_name }}</span>
              <span>{{ m.email }}</span>
              <span v-if="m.is_admin">admin</span>
              <span v-else-if="m.removed_at">out of the shop</span>
              <span v-else-if="m.invited_by_first_name">invited by {{ m.invited_by_first_name }}</span>
              <template v-if="m.removed_at">
                <button type="button" class="text-button" :disabled="busy" @click="restoreMember(m)">
                  let them back in
                </button>
              </template>
              <template v-else>
                <button type="button" class="text-button" :disabled="busy" @click="resetPassword(m)">
                  new password
                </button>
                <button type="button" class="text-button" :disabled="busy" @click="startEdit(m)">
                  edit
                </button>
                <button
                  v-if="m.id !== viewer?.id"
                  type="button"
                  class="text-button"
                  :disabled="busy"
                  @click="removeMember(m)"
                >
                  {{ armed === m.id ? "sure? this removes them and their books" : "remove" }}
                </button>
              </template>
            </template>
          </li>
        </ul>
      </section>

      <section class="form stack stack--gap">
        <h2>on the shelf</h2>
        <p v-if="onShelf.length === 0">nothing yet.</p>
        <ul class="members">
          <li v-for="b in onShelf" :key="b.id" class="member member--book">
            <NuxtLink :to="`/books/${b.id}`">{{ b.title }}</NuxtLink>
            <span>from {{ b.owner_first_name }}</span>
            <span v-if="b.status !== 'available'">{{ b.status }}</span>
            <button type="button" class="text-button" :disabled="busy" @click="removeBook(b)">
              {{ armed === b.id ? "sure? take it off the shelf" : "take it off the shelf" }}
            </button>
            <label v-if="armed === b.id" class="field member__reason">
              <span>why, for your own memory. optional</span>
              <input v-model="reason" type="text" >
            </label>
          </li>
        </ul>
      </section>

      <section v-if="offShelf.length > 0" class="form stack stack--gap">
        <h2>off the shelf</h2>
        <ul class="members">
          <li v-for="b in offShelf" :key="b.id" class="member member--book">
            <span>{{ b.title }}</span>
            <span>from {{ b.owner_first_name }}</span>
            <span v-if="b.removed_reason">{{ b.removed_reason }}</span>
            <button type="button" class="text-button" :disabled="busy" @click="restoreBook(b)">
              put it back on the shelf
            </button>
          </li>
        </ul>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
