# Barcodes are read in the browser with zxing-wasm, served from this site

**Date:** 8 October 2026 · **Status:** accepted

**Context.** The second slice of adding (ADR 0010) is the camera: hold the barcode inside the frame and the ISBN comes out, then the same lookup, pile and publish as typing it. The question was where the reading happens and with what.

- **The browser's own `BarcodeDetector`.** No dependency at all. But Safari on iPhone does not have it, and that is half the neighbourhood. A feature that works on Android and not on iPhone is a feature that does not work.
- **Send frames to the server** and decode there. Works everywhere, but it streams the camera off the phone, which is more data and more to explain than a swap shop should ask, and it needs a server-side decoder anyway.
- **Decode in the browser with a library.** `zxing-wasm` is the ZXing decoder compiled to WebAssembly. About a megabyte, downloaded once and cached. Frames never leave the phone.

The third was always the intended answer: `docs/allowed-deps.txt` has carried `zxing-wasm` at Phase 3 since Phase 0, with the reason written beside it.

**Decision.**

1. **Reading happens in the browser, with `zxing-wasm`.** The component (`app/components/BarcodeScanner.vue`) draws camera frames to a canvas four times a second and asks the decoder for one EAN-13. A code that is not a book barcode (not 978 or 979) is ignored, not looked up.
2. **The WebAssembly is served from this site.** The library's default fetches its `.wasm` from a public CDN at scan time. We import the file through the bundler instead, so the only hosts a scan ever touches are ours and, for the lookup, Open Library's.
3. **The library lives in `app/`, not behind the seam.** `scripts/seams.mjs` has said since Phase 0 that `zxing-wasm` is deliberately absent from the vendor list: it runs on the camera stream in the browser, the way a browser PDF reader would. There is no server side to put it behind.
4. **The typed box stays underneath the camera.** Not as a fallback for failure only: a bent paperback in a dim hallway is in `docs/plan.md`'s list of things we will find out the hard way, and typing thirteen digits is always available.

**Consequences.** `package.json` gains `zxing-wasm`; the allow-list already had it. Three runbook rows: the camera needing permission (and HTTPS, which Vercel gives), the frame that is still waiting, and a barcode that will not read. A decoder that fails to load takes the frame away and leaves the typed box, rather than a frame that looks alive and never reads. `docs/ui.md` loses the divergence that said the frame was a text box.

What it costs: one megabyte on first use, and a slice that cannot be exercised by the gate or a screenshot, only by a phone pointed at a book. The first real test is Rob's.

What it does not change: the lookup is still Open Library and still happens on the server; nothing is sent anywhere until the number is known. Reading a cover with no barcode is still Phase 4.
