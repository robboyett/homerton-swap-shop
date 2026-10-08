<script setup lang="ts">
/**
 * Book detail, in the five states a book can be in (docs/plan.md).
 *
 * The state, and whose number may be shown, are decided on the server (server/services/items.ts,
 * rule 4 of docs/data.md). This page only draws what it is given, and asks for one of the four
 * moves when a button is pressed.
 */
const route = useRoute();
const id = String(route.params.id);
const viewer = useViewer();

const { data, error, refresh } = await useFetch(`/api/items/${id}`);

if (error.value || !data.value) {
  const status = error.value?.statusCode ?? 404;
  throw createError({
    statusCode: status,
    statusMessage: status === 404 ? "no such book" : "something went wrong at our end",
    fatal: true,
  });
}

const book = computed(() => data.value?.book);
const more = computed(() => data.value?.more ?? []);

const busy = ref(false);
const note = ref("");
/** Bumped after every attempt, so the collect tick is remounted unticked if the move failed. */
const attempts = ref(0);

type Move = "reserve" | "release" | "collect" | "uncollect";

type BookPage = NonNullable<typeof book.value>;

/**
 * Ask for a move. If it was refused, say why and redraw the book as it now stands: a 409
 * carries the current book for this viewer, so no second request is needed.
 */
async function move(which: Move) {
  busy.value = true;
  note.value = "";
  try {
    const result = await $fetch(`/api/items/${id}/${which}`, { method: "POST" });
    if (data.value) data.value = { ...data.value, book: result.book };
  } catch (e) {
    const err = e as {
      statusCode?: number;
      data?: { message?: string; data?: { book?: BookPage } };
    };
    const current = err.data?.data?.book;
    if (err.statusCode === 409 && current) {
      note.value = err.data?.message ?? "that has just changed";
      if (data.value) data.value = { ...data.value, book: current };
    } else {
      note.value = "something went wrong at our end. try again in a moment.";
      await refresh();
    }
  } finally {
    attempts.value++;
    busy.value = false;
  }
}

/** Admins only (ADR 0012): off the shelf for everyone, record kept, back to the shelf. */
async function takeOff() {
  busy.value = true;
  try {
    await $fetch(`/api/items/${id}/remove`, { method: "POST", body: {} });
    await navigateTo("/");
  } catch {
    note.value = "that didn't save. try again in a moment.";
  } finally {
    busy.value = false;
  }
}

/** wa.me wants the number without the plus. The message is prefilled; the chat is theirs. */
function whatsapp(number: string | undefined, title: string) {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(`hello, about "${title}" on the swap shop`)}`;
}

const postedAgo = computed(() => {
  if (!book.value) return "";
  const days = Math.floor((Date.now() - Date.parse(book.value.created_at)) / 86_400_000);
  if (days <= 0) return "posted today";
  if (days === 1) return "posted yesterday";
  return `posted ${days} days ago`;
});

useHead({ title: () => `${book.value?.title ?? "book"} · homerton swap shop` });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <div class="mt-56">
      <NuxtLink to="/">back to the shelf</NuxtLink>
    </div>

    <div v-if="book" class="book">
      <div class="book__cover">
        <BookCover :book="book" />
      </div>

      <div class="book__body">
        <div class="stack">
          <h1>{{ book.title }}</h1>
          <span>{{ book.author }}</span>
        </div>

        <div class="stack mt-28">
          <span>{{ book.genre }}</span>
          <span>ages {{ book.age_band }}</span>
        </div>

        <p v-if="book.blurb" class="mt-28">{{ book.blurb }}</p>

        <div class="stack mt-28">
          <span>from {{ book.owner_first_name }}</span>
          <span>{{ postedAgo }}</span>
        </div>

        <div class="mt-36">
          <div v-if="book.state === 'available'" class="stack stack--gap">
            <button type="button" class="button" :disabled="busy" @click="move('reserve')">
              I'd like this
            </button>
            <span>
              this reserves it for you, so nobody else can ask. {{ book.owner_first_name }}'s
              whatsapp number then shows here and it's up to you to get in touch.
            </span>
          </div>

          <div v-else-if="book.state === 'mine'" class="stack stack--gap">
            <div class="stack">
              <span>reserved for you</span>
              <span>message {{ book.contact?.first_name }} to arrange a time to collect.</span>
            </div>
            <a class="button" :href="whatsapp(book.contact?.whatsapp_number, book.title)">
              message {{ book.contact?.first_name }} on whatsapp
            </a>
            <label class="tick">
              <input :key="attempts" type="checkbox" :disabled="busy" @change="move('collect')" >
              <span>we've collected it</span>
            </label>
            <div>
              <button type="button" class="text-button" :disabled="busy" @click="move('release')">
                put it back on the shelf
              </button>
            </div>
          </div>

          <div v-else-if="book.state === 'other'" class="stack">
            <span>reserved</span>
            <span>someone else has asked for this. it may come back on the shelf.</span>
          </div>

          <div v-else-if="book.state === 'owner'" class="stack stack--gap">
            <div class="stack">
              <span>reserved by {{ book.contact?.first_name }}</span>
              <span>{{ book.contact?.first_name }} will message you to collect it.</span>
            </div>
            <a class="button" :href="whatsapp(book.contact?.whatsapp_number, book.title)">
              message {{ book.contact?.first_name }} on whatsapp
            </a>
            <div>
              <button type="button" class="text-button" :disabled="busy" @click="move('release')">
                put it back on the shelf
              </button>
            </div>
          </div>

          <div v-else class="stack stack--gap">
            <div class="stack">
              <span>collected</span>
              <span>off the shelf. thank you.</span>
            </div>
            <div v-if="book.can_undo">
              <button type="button" class="text-button" :disabled="busy" @click="move('uncollect')">
                not collected after all
              </button>
            </div>
          </div>

          <p v-if="note" class="mt-28" role="status">{{ note }}</p>
        </div>

        <div v-if="viewer?.is_admin" class="mt-36">
          <button type="button" class="text-button" :disabled="busy" @click="takeOff">
            take it off the shelf
          </button>
        </div>
      </div>
    </div>

    <section v-if="more.length > 0 && book" class="section mt-72">
      <h2>more in {{ book.genre }}</h2>
      <div class="grid">
        <NuxtLink
          v-for="other in more"
          :key="other.id"
          :to="`/books/${other.id}`"
          :aria-label="`${other.title}, ages ${other.age_band}${other.status === 'reserved' ? ', reserved' : ''}`"
        >
          <BookCover :book="other" :reserved="other.status === 'reserved'" />
        </NuxtLink>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>
