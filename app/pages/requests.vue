<script setup lang="ts">
/**
 * Requests: everything live between you and each other person, grouped by them and dated
 * (ADR 0013). The same four moves as a book page, from the list. No canvas board exists; this
 * is drawn from docs/ui.md alone, the way Rob asked for the undrawn screens.
 */
import type { RequestBook, RequestGroup } from "~~/shared/schema";

const { data, refresh } = await useFetch("/api/requests");
const askedFor = computed(() => data.value?.asked_for ?? []);
const askedOfYou = computed(() => data.value?.asked_of_you ?? []);
const nothing = computed(() => askedFor.value.length === 0 && askedOfYou.value.length === 0);

const busy = ref(false);
const note = ref("");
/** Books ticked as collected on this visit. They stay in the list, marked, until you leave. */
const collected = ref(new Set<string>());

/** wa.me wants the number without the plus. One message per person, about all their books. */
function whatsapp(group: RequestGroup) {
  const digits = group.person.whatsapp_number.replace(/\D/g, "");
  const titles = group.books.map((b) => `"${b.title}"`).join(", ");
  return `https://wa.me/${digits}?text=${encodeURIComponent(`hello, about ${titles} on the swap shop`)}`;
}

async function move(book: RequestBook, which: "collect" | "uncollect" | "release") {
  busy.value = true;
  note.value = "";
  try {
    await $fetch(`/api/items/${book.id}/${which}`, { method: "POST" });
    if (which === "collect") collected.value.add(book.id);
    if (which === "uncollect") collected.value.delete(book.id);
    if (which === "release") await refresh();
  } catch (e) {
    const err = e as { statusCode?: number; data?: { message?: string } };
    note.value =
      err.statusCode === 409
        ? (err.data?.message ?? "that has just changed")
        : "something went wrong at our end. try again in a moment.";
    await refresh();
  } finally {
    busy.value = false;
  }
}

useHead({ title: "requests · homerton swap shop" });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <main class="requests">
      <p v-if="nothing" class="mt-56">
        nothing live. when you ask for a book, or someone asks for one of yours, it shows here.
      </p>

      <section v-if="askedFor.length > 0" class="mt-56 stack stack--gap">
        <h1>you've asked for</h1>
        <div v-for="group in askedFor" :key="group.person.whatsapp_number" class="group">
          <div class="stack">
            <span>from {{ group.person.first_name }}</span>
            <span>message them once to arrange a time; collect the lot in one go.</span>
          </div>
          <a class="button" :href="whatsapp(group)">message {{ group.person.first_name }} on whatsapp</a>
          <ul class="requests__books">
            <li v-for="book in group.books" :key="book.id" class="request">
              <NuxtLink :to="`/books/${book.id}`" class="request__cover">
                <BookCover :book="book" />
              </NuxtLink>
              <div class="stack request__body">
                <NuxtLink :to="`/books/${book.id}`">{{ book.title }}</NuxtLink>
                <span>asked for {{ ago(book.reserved_at) }}</span>
                <template v-if="collected.has(book.id)">
                  <span>collected. thank you.</span>
                  <div>
                    <button type="button" class="text-button" :disabled="busy" @click="move(book, 'uncollect')">
                      not collected after all
                    </button>
                  </div>
                </template>
                <template v-else>
                  <label class="tick">
                    <input type="checkbox" :disabled="busy" @change="move(book, 'collect')" >
                    <span>we've collected it</span>
                  </label>
                  <div>
                    <button type="button" class="text-button" :disabled="busy" @click="move(book, 'release')">
                      put it back on the shelf
                    </button>
                  </div>
                </template>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section v-if="askedOfYou.length > 0" class="mt-56 stack stack--gap">
        <h1>asked of you</h1>
        <div v-for="group in askedOfYou" :key="group.person.whatsapp_number" class="group">
          <div class="stack">
            <span>{{ group.person.first_name }} has asked for</span>
            <span>they will message you to collect; if they go quiet, put the books back.</span>
          </div>
          <a class="button" :href="whatsapp(group)">message {{ group.person.first_name }} on whatsapp</a>
          <ul class="requests__books">
            <li v-for="book in group.books" :key="book.id" class="request">
              <NuxtLink :to="`/books/${book.id}`" class="request__cover">
                <BookCover :book="book" />
              </NuxtLink>
              <div class="stack request__body">
                <NuxtLink :to="`/books/${book.id}`">{{ book.title }}</NuxtLink>
                <span>asked for {{ ago(book.reserved_at) }}</span>
                <div>
                  <button type="button" class="text-button" :disabled="busy" @click="move(book, 'release')">
                    put it back on the shelf
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <p v-if="note" class="mt-28" role="status">{{ note }}</p>
    </main>

    <SiteFooter />
  </div>
</template>
