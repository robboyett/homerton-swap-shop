<script setup lang="ts">
/**
 * The camera frame from the Scan board: hold the barcode inside it and the ISBN comes out.
 *
 * Frames go from the camera to a canvas to zxing-wasm, in the browser; nothing leaves the phone
 * until the page looks the number up (ADR 0011). The WebAssembly is served from this site, not
 * a CDN. If there is no camera, or no permission, the component says so once and renders nothing,
 * and the page falls back to the typed box underneath.
 */
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";
import { bookIsbnFromBarcode } from "~~/shared/schema";

const props = defineProps<{ paused?: boolean }>();
const emit = defineEmits<{ found: [isbn: string]; unavailable: [reason: string] }>();

const video = ref<HTMLVideoElement | null>(null);
const running = ref(false);

/** How often a frame is read. Four a second is plenty for a hand holding a book still. */
const INTERVAL_MS = 250;
/** The same code within this window is one scan, not several. */
const REPEAT_MS = 4000;

let stream: MediaStream | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastText = "";
let lastAt = 0;

onMounted(async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    emit("unavailable", "no camera here");
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      audio: false,
    });
  } catch {
    emit("unavailable", "camera not allowed");
    return;
  }
  const el = video.value;
  if (!el) return;
  el.srcObject = stream;
  await el.play().catch(() => undefined);

  const { prepareZXingModule, readBarcodes } = await import("zxing-wasm/reader");
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith(".wasm") ? wasmUrl : prefix + path,
    },
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    emit("unavailable", "no canvas");
    return;
  }
  running.value = true;

  const tick = async () => {
    if (!running.value) return;
    if (!props.paused && el.readyState >= 2 && el.videoWidth > 0) {
      // Downscale to about 800px wide: faster to decode, and barcodes do not need more.
      const scale = Math.min(1, 800 / el.videoWidth);
      canvas.width = Math.round(el.videoWidth * scale);
      canvas.height = Math.round(el.videoHeight * scale);
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      try {
        const results = await readBarcodes(ctx.getImageData(0, 0, canvas.width, canvas.height), {
          formats: ["EAN-13"],
          tryHarder: true,
          maxNumberOfSymbols: 1,
        });
        const hit = results.find((r) => r.isValid);
        const isbn = hit ? bookIsbnFromBarcode(hit.text) : null;
        const now = Date.now();
        if (isbn && !(isbn === lastText && now - lastAt < REPEAT_MS)) {
          lastText = isbn;
          lastAt = now;
          emit("found", isbn);
        }
      } catch {
        // One bad frame is not worth stopping for.
      }
    }
    timer = setTimeout(tick, INTERVAL_MS);
  };
  timer = setTimeout(tick, INTERVAL_MS);
});

onBeforeUnmount(() => {
  running.value = false;
  if (timer) clearTimeout(timer);
  for (const track of stream?.getTracks() ?? []) track.stop();
});
</script>

<template>
  <div class="scan">
    <video ref="video" class="scan__video" playsinline muted autoplay />
    <span class="scan__corner scan__corner--tl" />
    <span class="scan__corner scan__corner--tr" />
    <span class="scan__corner scan__corner--bl" />
    <span class="scan__corner scan__corner--br" />
    <span class="scan__caption">
      {{ running ? "hold the barcode inside the frame" : "starting the camera" }}
    </span>
  </div>
</template>
