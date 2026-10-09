<script setup lang="ts">
/**
 * Browse: every cover at once, sectioned by genre, filtered by age band and by section, with
 * your own books hideable (docs/ui.md, ADR 0017). The filters live in the address bar.
 */
import { AGE_BANDS, GENRES } from "~~/shared/schema";

const { data, error, refresh } = await useFetch("/api/items");
const hovered = useHovered();
const books = computed(() => data.value?.books ?? []);
// Other people's moves show here within half a minute, with the filter left alone (ADR 0016).
useLive({ data, error, refresh });

const AGES = ["all", ...AGE_BANDS] as const;
const SECTIONS = ["all", ...GENRES] as const;

const route = useRoute();
const router = useRouter();

/** One query key, read as one of a closed set, written back without the default. */
function queryChoice<T extends string>(key: string, choices: readonly T[], fallback: T) {
  return computed<T>({
    get: () => {
      const raw = route.query[key];
      return (choices as readonly string[]).includes(String(raw)) ? (raw as T) : fallback;
    },
    set: (value) =>
      router.replace({ query: { ...route.query, [key]: value === fallback ? undefined : value } }),
  });
}

const age = queryChoice("age", AGES, "all");
const section = queryChoice("section", SECTIONS, "all");
const hideMine = computed({
  get: () => route.query.mine === "hide",
  set: (hide) => router.replace({ query: { ...route.query, mine: hide ? "hide" : undefined } }),
});

const shown = computed(() =>
  books.value.filter(
    (i) =>
      (age.value === "all" || i.age_band === age.value) &&
      (section.value === "all" || i.genre === section.value) &&
      !(hideMine.value && i.mine),
  ),
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
      <div class="filters__rows">
        <div class="filters__ages">
          <span>age</span>
          <button
            v-for="band in AGES"
            :key="band"
            type="button"
            class="filter"
            :aria-pressed="age === band"
            @click="age = band"
          >
            {{ band }}
          </button>
        </div>
        <div class="filters__ages">
          <span>section</span>
          <button
            v-for="name in SECTIONS"
            :key="name"
            type="button"
            class="filter"
            :aria-pressed="section === name"
            @click="section = name"
          >
            {{ name }}
          </button>
        </div>
      </div>
      <div v-if="books.length > 0" class="filters__count">
        <span class="filters__total">{{ shown.length }} on the shelf. faded ones are reserved.</span>
        <button type="button" class="filter" @click="hideMine = !hideMine">
          {{ hideMine ? "show mine" : "hide mine" }}
        </button>
      </div>
    </div>

    <main v-if="books.length === 0" class="shelf">
      <p>nothing on the shelf yet. the first books arrive when adding does.</p>
    </main>

    <main v-else-if="shown.length === 0" class="shelf">
      <p>nothing on the shelf with those filters.</p>
    </main>

    <main v-else class="shelf">
      <section v-for="group in sections" :key="group.name" class="section">
        <div class="section__head">
          <h2>{{ group.name }}</h2>
          <span>{{ group.books.length }}</span>
        </div>
        <div class="grid">
          <NuxtLink
            v-for="bookItem in group.books"
            :key="bookItem.id"
            :to="`/books/${bookItem.id}`"
            :aria-label="`${bookItem.title}, ages ${bookItem.age_band}${bookItem.status === 'reserved' ? ', reserved' : ''}`"
            @mouseenter="hovered = bookItem"
            @mouseleave="hovered = null"
            @focus="hovered = bookItem"
            @blur="hovered = null"
          >
            <BookCover :book="bookItem" :reserved="bookItem.status === 'reserved'" />
          </NuxtLink>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
