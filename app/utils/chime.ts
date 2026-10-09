/**
 * Three small sounds for the pile, synthesised on the spot so there are no files: a soft two-note
 * plink when a book lands, a low nope when one is refused, and three rising notes on publish.
 * Browser only; quiet; never throws. iPhones honour the silent switch, and browsers only let a page
 * make sound after it has been touched once, so the first scan on a fresh page may be silent.
 */
type Chime = "added" | "refused" | "published";

const NOTES: Record<Chime, { hz: number; at: number; for: number }[]> = {
  added: [
    { hz: 880, at: 0, for: 0.09 },
    { hz: 1320, at: 0.07, for: 0.12 },
  ],
  refused: [{ hz: 196, at: 0, for: 0.16 }],
  published: [
    { hz: 660, at: 0, for: 0.1 },
    { hz: 880, at: 0.1, for: 0.1 },
    { hz: 1320, at: 0.2, for: 0.22 },
  ],
};

let context: AudioContext | null = null;

export function chime(kind: Chime): void {
  try {
    if (typeof window === "undefined") return;
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    for (const note of NOTES[kind]) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = note.hz;
      gain.gain.setValueAtTime(0.0001, now + note.at);
      gain.gain.exponentialRampToValueAtTime(0.08, now + note.at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.for);
      osc.connect(gain).connect(context.destination);
      osc.start(now + note.at);
      osc.stop(now + note.at + note.for + 0.02);
    }
  } catch {
    // No audio here. The pile works in silence.
  }
}
