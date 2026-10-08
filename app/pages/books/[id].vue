<script setup lang="ts">
/**
 * Book detail, in the five states a book can be in (docs/plan.md).
 *
 * Phase 1 has no sign-in, so the state is driven by the demo row at the foot of the page, the
 * way the canvas drives it. Both the row and the `state` ref go in Phase 2, when the state comes
 * from the item and the signed-in person (ADR 0004). The copy here is final; the plumbing is not.
 */
import { ITEMS, itemById, profileById, VIEWER_ID } from "~~/shared/fixtures";
import { type BookState, bookState } from "~~/shared/schema";

const route = useRoute();
const item = computed(() => itemById(String(route.params.id)));

if (!item.value) {
  throw createError({ statusCode: 404, statusMessage: "no such book", fatal: true });
}

const book = computed(() => item.value as NonNullable<typeof item.value>);
const owner = computed(() => profileById(book.value.owner_id));

/** Who the other person is: the owner when you are the requester, the requester when you own it. */
const requester = computed(() => profileById(book.value.reserved_by ?? "p-sam"));

const state = ref<BookState>(bookState(book.value, VIEWER_ID));

const DEMO = computed<{ value: BookState; label: string }[]>(() => [
  { value: "available", label: "available" },
  { value: "mine", label: "reserved by you" },
  { value: "other", label: "reserved by someone else" },
  { value: "owner", label: `${owner.value?.first_name}'s view` },
  { value: "collected", label: "collected" },
]);

/** wa.me wants the number without the plus. The message is prefilled; the chat is theirs. */
function whatsapp(number: string | undefined, title: string) {
  const digits = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(`hello, about "${title}" on the swap shop`)}`;
}

const postedAgo = computed(() => {
  const days = Math.floor((Date.now() - Date.parse(book.value.created_at)) / 86_400_000);
  if (days <= 0) return "posted today";
  if (days === 1) return "posted yesterday";
  return `posted ${days} days ago`;
});

const more = computed(() =>
  ITEMS.filter((i) => i.genre === book.value.genre && i.id !== book.value.id).slice(0, 10),
);

useHead({ title: () => `${book.value.title} · homerton swap shop` });
</script>

<template>
  <div class="page">
    <SiteHeader />

    <div class="mt-56">
      <NuxtLink to="/">back to the shelf</NuxtLink>
    </div>

    <div class="book">
      <div class="book__cover">
        <BookCover :mock="book.mock" />
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

        <p class="mt-28">{{ book.blurb }}</p>

        <div class="stack mt-28">
          <span>from {{ owner?.first_name }}</span>
          <span>{{ postedAgo }}</span>
        </div>

        <div class="mt-36">
          <div v-if="state === 'available'" class="stack stack--gap">
            <button type="button" class="button" @click="state = 'mine'">I'd like this</button>
            <span>
              this reserves it for you, so nobody else can ask. {{ owner?.first_name }}'s whatsapp
              number then shows here and it's up to you to get in touch.
            </span>
          </div>

          <div v-else-if="state === 'mine'" class="stack stack--gap">
            <div class="stack">
              <span>reserved for you</span>
              <span>message {{ owner?.first_name }} to arrange a time to collect.</span>
            </div>
            <a class="button" :href="whatsapp(owner?.whatsapp_number, book.title)">
              message {{ owner?.first_name }} on whatsapp
            </a>
            <label class="tick">
              <input type="checkbox" @change="state = 'collected'" >
              <span>we've collected it</span>
            </label>
            <div>
              <button type="button" class="text-button" @click="state = 'available'">
                put it back on the shelf
              </button>
            </div>
          </div>

          <div v-else-if="state === 'other'" class="stack">
            <span>reserved</span>
            <span>someone else has asked for this. it may come back on the shelf.</span>
          </div>

          <div v-else-if="state === 'owner'" class="stack stack--gap">
            <div class="stack">
              <span>reserved by {{ requester?.first_name }}</span>
              <span>{{ requester?.first_name }} will message you to collect it.</span>
            </div>
            <a class="button" :href="whatsapp(requester?.whatsapp_number, book.title)">
              message {{ requester?.first_name }} on whatsapp
            </a>
            <div>
              <button type="button" class="text-button" @click="state = 'available'">
                put it back on the shelf
              </button>
            </div>
          </div>

          <div v-else class="stack stack--gap">
            <div class="stack">
              <span>collected</span>
              <span>off the shelf. thank you.</span>
            </div>
            <div>
              <button type="button" class="text-button" @click="state = 'mine'">
                not collected after all
              </button>
            </div>
          </div>
        </div>

        <!-- Phase 1 only. Removed in Phase 2 (ADR 0004): it is a mock-up affordance, not a feature. -->
        <div class="demo">
          <span>[demo]</span>
          <button
            v-for="option in DEMO"
            :key="option.value"
            type="button"
            class="text-button"
            :aria-pressed="state === option.value"
            @click="state = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <section class="section mt-72">
      <h2>more in {{ book.genre }}</h2>
      <div class="grid">
        <NuxtLink
          v-for="other in more"
          :key="other.id"
          :to="`/books/${other.id}`"
          :aria-label="`${other.title}, ages ${other.age_band}${other.status === 'reserved' ? ', reserved' : ''}`"
        >
          <BookCover :mock="other.mock" :reserved="other.status === 'reserved'" />
        </NuxtLink>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>
