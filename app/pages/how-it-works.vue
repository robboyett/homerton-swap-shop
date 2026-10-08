<script setup lang="ts">
useHead({ title: "how it works · homerton swap shop" });

const getting = [
  'find a book and tap "I\'d like this". that reserves it for you, so nobody else can ask.',
  "message the owner on whatsapp to agree a time. it's up to you to get in touch.",
  "pick it up. say if plans change.",
  'tick "we\'ve collected it" so it comes off the shelf.',
];

const giving = [
  "add books. scan the barcode and publish. a collection or series can go up as one post, with a photo and a rough count.",
  "someone reserves it and messages you on whatsapp.",
  "hand it over. if they go quiet, put it back on the shelf.",
];

const good = [
  "everything is free, always. no selling.",
  "your address is never on the site. you share it in whatsapp when you choose to.",
  "a reservation can be undone by you or by the owner at any time, and the book goes back on the shelf.",
  "invite only, for homerton.",
];
</script>

<template>
  <div class="page">
    <SiteHeader />

    <main>
      <div class="explain">
        <h1 class="explain__head">how it works</h1>
        <p class="explain__body">
          a free swap for homerton. books, toys and clothes the kids have grown out of, passed on to
          neighbours. nobody pays and nobody sells.
        </p>
      </div>

      <div class="explain">
        <h2 class="explain__head">getting something</h2>
        <ol class="explain__body">
          <li v-for="(step, n) in getting" :key="step" class="explain__step">
            <span class="explain__n">{{ n + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </div>

      <div class="explain">
        <h2 class="explain__head">giving something</h2>
        <ol class="explain__body">
          <li v-for="(step, n) in giving" :key="step" class="explain__step">
            <span class="explain__n">{{ n + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </div>

      <div class="explain">
        <h2 class="explain__head">good to know</h2>
        <div class="explain__body">
          <span v-for="line in good" :key="line">{{ line }}</span>
        </div>
      </div>

      <div class="explain">
        <h2 class="explain__head">stuck?</h2>
        <p class="explain__body">
          ask in the whatsapp group. rob looks after the site and will help.
        </p>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>
