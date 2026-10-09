<script setup lang="ts">
/**
 * A text button that opens the phone's photo roll, or with `camera` the camera straight away
 * (right in the pile, book in hand; on a book page someone may already have the picture). The file input is the real control
 * and sits off-screen; the visible button is the label, drawn like every other text action.
 */
defineProps<{ disabled?: boolean; camera?: boolean }>();
const emit = defineEmits<{ picked: [file: File] }>();
const input = ref<HTMLInputElement | null>(null);

function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) emit("picked", file);
  if (input.value) input.value.value = "";
}
</script>

<template>
  <label class="picker">
    <input
      ref="input"
      class="picker__input"
      type="file"
      accept="image/*"
      :capture="camera ? 'environment' : undefined"
      :disabled="disabled"
      @change="onChange"
    >
    <span class="text-button picker__label"><slot /></span>
  </label>
</template>
