<script setup lang="ts">
/** Browse: every cover at once, sectioned by genre, filtered by age band (docs/ui.md). */
import { AGE_BANDS, GENRES } from "~~/shared/schema";

const { data, error, refresh } = await useFetch("/api/items");
const books = computed(() => data.value?.books ?? []);
// Other people's moves show here within half a minute, with the filter left alone (ADR 0016).
useLive({ data, error, refresh });

const FILTERS = ["all", ...AGE_BANDS] as const;
type Filter = (typeof FILTERS)[number];

const age = ref<Filter>("all");

const shown = computed(() =>
  books.value.filter((i) => age.value === "all" || i.age_band === age.value),
);

/** Genre order comes from the schema, so a section can never appear in a surprising place. */
const sections = computed(() =>
  GENRES.map((name) => ({ name, books: shown.value.filter((i) => i.genre === name) })).filter(
    (s) => s.books.length > 0,
  ),
);

useHead({ title: "homerton swap shop" });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <div class="filters">
      <div class="filters__ages">
        <span>age</span>
        <button
          v-for="band in FILTERS"
          :key="band"
          type="button"
          class="filter"
          :aria-pressed="age === band"
          @click="age = band"
        >
          {{ band }}
        </button>
      </div>
      <span v-if="books.length > 0" class="filters__count">
        {{ shown.length }} on the shelf. faded ones are reserved.
      </span>
    </div>

    <main v-if="books.length === 0" class="shelf">
      <p>nothing on the shelf yet. the first books arrive when adding does.</p>
    </main>

    <main v-else class="shelf">
      <section v-for="section in sections" :key="section.name" class="section">
        <div class="section__head">
          <h2>{{ section.name }}</h2>
          <span>{{ section.books.length }}</span>
        </div>
        <div class="grid">
          <NuxtLink
            v-for="bookItem in section.books"
            :key="bookItem.id"
            :to="`/books/${bookItem.id}`"
            :aria-label="`${bookItem.title}, ages ${bookItem.age_band}${bookItem.status === 'reserved' ? ', reserved' : ''}`"
          >
            <BookCover :book="bookItem" :reserved="bookItem.status === 'reserved'" />
          </NuxtLink>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
