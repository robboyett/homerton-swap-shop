<script setup lang="ts">
/**
 * Add books: scan the barcode (or type the number under it), look it up, review the pile,
 * publish in one go (docs/plan.md, "Adding a book"; the board is docs/design/Scan.dc.html).
 * Not found? Type the title and author, and it goes in the pile with a plain cover.
 */
import { AGE_BANDS, GENRES, isbnSchema, type NewBook, newBookSchema } from "~~/shared/schema";

const isbn = ref("");
/** Set once if there is no camera or no permission; the typed box is then the only way in. */
const cameraOff = ref(false);
const pile = ref<NewBook[]>([]);

/**
 * The pile survives a reload. Phones reload background tabs without asking, and twenty scanned
 * books are twenty minutes; so the books are kept in this browser until published or taken out.
 * Photos picked for the pile are not: they live in memory and are picked again if the tab came back.
 */
const PILE_KEY = "swapshop-pile";
const restored = ref(false);

onMounted(() => {
  try {
    const saved = window.localStorage.getItem(PILE_KEY);
    if (!saved) return;
    const parsed = newBookSchema.array().safeParse(JSON.parse(saved));
    if (parsed.success && parsed.data.length > 0 && pile.value.length === 0) {
      pile.value = parsed.data;
      selected.value = parsed.data.length - 1;
      restored.value = true;
    }
  } catch {
    // Storage can be missing or refused; the pile then simply starts empty.
  }
});

watch(
  pile,
  (books) => {
    try {
      if (books.length === 0) window.localStorage.removeItem(PILE_KEY);
      else window.localStorage.setItem(PILE_KEY, JSON.stringify(books));
    } catch {
      // Same: a browser that refuses storage still gets a working pile for this visit.
    }
  },
  { deep: true },
);
const selected = ref(0);
const busy = ref(false);
const note = ref("");

/** Shown when the library has never heard of the number: title and author, typed. */
const typing = ref(false);
const typedTitle = ref("");
const typedAuthor = ref("");

const current = computed(() => pile.value[selected.value]);
/** Photos picked for books in the pile, by pile index, already shrunk. Sent after publish. */
const photos = ref(new Map<number, Blob>());

async function pickPhoto(file: File) {
  const index = selected.value;
  try {
    const small = await shrinkPhoto(file);
    photos.value.set(index, small);
    note.value = "";
  } catch {
    note.value =
      "that photo can't be read on this phone. try another, or add one from the book's page later.";
  }
}

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

/**
 * The camera read a book barcode: look it up as if the number had been typed. A book already in
 * the pile is ignored, so a phone still pointed at it does not look it up again every few seconds.
 */
async function scanned(code: string) {
  if (busy.value || pile.value.some((b) => b.isbn === code)) return;
  isbn.value = code;
  await lookup();
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
  const kept = new Map<number, Blob>();
  for (const [i, blob] of photos.value) {
    if (i < index) kept.set(i, blob);
    else if (i > index) kept.set(i - 1, blob);
  }
  photos.value = kept;
  selected.value = Math.max(0, Math.min(selected.value, pile.value.length - 1));
}

async function publish() {
  if (pile.value.length === 0) return;
  busy.value = true;
  note.value = "";
  try {
    const { ids } = await $fetch("/api/items", { method: "POST", body: { books: pile.value } });
    // Photos ride after the books, one request each; a photo that fails leaves a plain cover.
    const failed: string[] = [];
    for (const [i, blob] of photos.value) {
      const id = ids[i];
      if (!id) continue;
      const body = new FormData();
      body.append("photo", blob, "cover.jpg");
      try {
        await $fetch(`/api/items/${id}/photo`, { method: "POST", body });
      } catch {
        failed.push(pile.value[i]?.title ?? "a book");
      }
    }
    pile.value = [];
    photos.value = new Map();
    if (failed.length > 0) {
      note.value = `published, but the photo for ${failed.join(", ")} didn't save. you can add it from the book's page.`;
      busy.value = false;
      return;
    }
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
      <ClientOnly v-if="!cameraOff">
        <BarcodeScanner :paused="busy" @found="scanned" @unavailable="cameraOff = true" />
        <template #fallback>
          <div class="scan">
            <span class="scan__corner scan__corner--tl" />
            <span class="scan__corner scan__corner--tr" />
            <span class="scan__corner scan__corner--bl" />
            <span class="scan__corner scan__corner--br" />
            <span class="scan__caption">starting the camera</span>
          </div>
        </template>
      </ClientOnly>

      <form class="form" @submit.prevent="lookup">
        <label class="field">
          <span>{{ cameraOff ? "the number under the barcode" : "or type the number under the barcode" }}</span>
          <input
            v-model="isbn"
            type="text"
            inputmode="text"
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
        <span v-if="restored">
          your pile from before is back. if you had picked photos for any of these, pick them again.
        </span>

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

          <div v-if="!current.cover_url" class="stack">
            <span v-if="photos.has(selected)">photo ready. it goes up with the book.</span>
            <PhotoPicker camera :disabled="busy" @picked="pickPhoto">
              {{ photos.has(selected) ? "use a different photo" : "add a photo of the cover" }}
            </PhotoPicker>
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
          they go on the shelf under your name.
          {{
            current?.cover_url || current?.blurb
              ? "the section and ages above are a guess from the library; change them if they look wrong."
              : "check the section and ages above before you publish."
          }}
        </span>
      </section>

      <p class="mt-40">giving away a collection or series? posting it as one is coming.</p>
    </main>

    <SiteFooter />
  </div>
</template>
