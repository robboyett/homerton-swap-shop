<script setup lang="ts">
/**
 * Add books: type the number under the barcode, look it up, review the pile, publish in one go
 * (docs/plan.md, "Adding a book"). The canvas board (docs/design/Scan.dc.html) draws a camera
 * where the number box is; the camera is the next slice (ADR 0010) and everything below it is
 * the same. Not found? Type the title and author, and it goes in the pile with a plain cover.
 */
import { AGE_BANDS, GENRES, isbnSchema, type NewBook } from "~~/shared/schema";

const isbn = ref("");
const pile = ref<NewBook[]>([]);
const selected = ref(0);
const busy = ref(false);
const note = ref("");

/** Shown when the library has never heard of the number: title and author, typed. */
const typing = ref(false);
const typedTitle = ref("");
const typedAuthor = ref("");

const current = computed(() => pile.value[selected.value]);

function add(book: NewBook) {
  if (book.isbn && pile.value.some((b) => b.isbn === book.isbn)) {
    note.value = `"${book.title}" is already in the pile.`;
    return;
  }
  pile.value.push(book);
  selected.value = pile.value.length - 1;
  isbn.value = "";
  typing.value = false;
  typedTitle.value = "";
  typedAuthor.value = "";
}

async function lookup() {
  const parsed = isbnSchema.safeParse(isbn.value);
  if (!parsed.success) {
    note.value = "an isbn is the 10 or 13 digits under the barcode.";
    return;
  }
  busy.value = true;
  note.value = "";
  try {
    const { found } = await $fetch(`/api/lookup/${parsed.data}`);
    add(found);
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404) {
      typing.value = true;
      note.value = "the library hasn't heard of that one. type the title and author instead.";
    } else {
      note.value = "the library isn't answering. try again in a moment, or type it in.";
      typing.value = true;
    }
  } finally {
    busy.value = false;
  }
}

function addTyped() {
  if (!typedTitle.value.trim()) return;
  const parsed = isbnSchema.safeParse(isbn.value);
  add({
    isbn: parsed.success ? parsed.data : null,
    title: typedTitle.value.trim(),
    author: typedAuthor.value.trim() || null,
    blurb: null,
    cover_url: null,
    genre: "picture books",
    age_band: "0-3",
  });
}

function remove(index: number) {
  pile.value.splice(index, 1);
  selected.value = Math.max(0, Math.min(selected.value, pile.value.length - 1));
}

async function publish() {
  if (pile.value.length === 0) return;
  busy.value = true;
  note.value = "";
  try {
    await $fetch("/api/items", { method: "POST", body: { books: pile.value } });
    pile.value = [];
    await navigateTo("/");
  } catch {
    note.value = "that didn't save. nothing was published; try again in a moment.";
  } finally {
    busy.value = false;
  }
}

/** A seed for the plain cover while the book has no id yet: the isbn, or failing that the title. */
function coverOf(book: NewBook) {
  return { id: book.isbn ?? book.title, cover_url: book.cover_url, photo_url: null };
}

useHead({ title: "add books · homerton swap shop" });
</script>

<template>
  <div class="page">
    <header class="site-header">
      <NuxtLink to="/">cancel</NuxtLink>
      <span>add books</span>
    </header>

    <main class="add">
      <form class="form" @submit.prevent="lookup">
        <label class="field">
          <span>the number under the barcode</span>
          <input
            v-model="isbn"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="978…"
            :disabled="busy"
          >
        </label>
        <button type="submit" class="button" :disabled="busy || !isbn">
          {{ busy ? "looking it up" : "look it up" }}
        </button>
        <p v-if="note" role="status">{{ note }}</p>
      </form>

      <form v-if="typing" class="form" @submit.prevent="addTyped">
        <label class="field">
          <span>title</span>
          <input v-model="typedTitle" type="text" required >
        </label>
        <label class="field">
          <span>author</span>
          <input v-model="typedAuthor" type="text" >
        </label>
        <button type="submit" class="button" :disabled="!typedTitle.trim()">add it to the pile</button>
      </form>

      <section v-if="pile.length > 0" class="stack stack--gap mt-40">
        <span>added {{ pile.length }}</span>

        <div class="pile">
          <button
            v-for="(book, i) in pile"
            :key="book.isbn ?? book.title + i"
            type="button"
            class="pile__slot"
            :aria-pressed="i === selected"
            :aria-label="book.title"
            @click="selected = i"
          >
            <BookCover :book="coverOf(book)" />
          </button>
        </div>

        <div v-if="current" class="stack stack--gap">
          <div class="stack">
            <span>{{ current.title }}</span>
            <span>{{ current.author ?? "author unknown" }}</span>
          </div>

          <div class="choices">
            <span>section</span>
            <button
              v-for="g in GENRES"
              :key="g"
              type="button"
              class="filter"
              :aria-pressed="current.genre === g"
              @click="current.genre = g"
            >
              {{ g }}
            </button>
          </div>

          <div class="choices">
            <span>ages</span>
            <button
              v-for="band in AGE_BANDS"
              :key="band"
              type="button"
              class="filter"
              :aria-pressed="current.age_band === band"
              @click="current.age_band = band"
            >
              {{ band }}
            </button>
          </div>

          <div>
            <button type="button" class="text-button" @click="remove(selected)">
              take it out of the pile
            </button>
          </div>
        </div>

        <button type="button" class="button" :disabled="busy" @click="publish">
          publish {{ pile.length }} {{ pile.length === 1 ? "book" : "books" }}
        </button>
        <span>
          they go on the shelf under your name. the section and ages above are a guess from the
          library; change them if they look wrong.
        </span>
      </section>

      <p class="mt-40">giving away a collection or series? posting it as one is coming.</p>
    </main>

    <SiteFooter />
  </div>
</template>
