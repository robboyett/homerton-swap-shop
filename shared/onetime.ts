/**
 * A one-time password Rob can read out or paste into WhatsApp: three short words and two digits,
 * like `fox-lamp-river-42`. Easy to type on a phone, long enough for the twelve-character rule,
 * and meant to be changed never: there is no change-password screen, only Rob setting a new one.
 */
const WORDS = [
  "apple",
  "badger",
  "bridge",
  "candle",
  "cloud",
  "dragon",
  "feather",
  "fox",
  "garden",
  "harbour",
  "island",
  "kettle",
  "lamp",
  "lemon",
  "marble",
  "meadow",
  "otter",
  "pebble",
  "pencil",
  "pirate",
  "puddle",
  "rabbit",
  "river",
  "rocket",
  "saddle",
  "shadow",
  "spoon",
  "teapot",
  "tiger",
  "tunnel",
  "turnip",
  "violet",
  "walrus",
  "window",
  "yellow",
  "zebra",
];

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error("nothing to pick from");
  return item;
}

/** `random` returns a number in [0, 1). Pass one from crypto in the browser; Math.random in a test. */
export function onetimePassword(random: () => number): string {
  const words = [pick(WORDS, random), pick(WORDS, random), pick(WORDS, random)];
  const digits = String(Math.floor(random() * 90) + 10);
  return `${words.join("-")}-${digits}`;
}

/** A source of randomness from the browser's crypto, in the shape onetimePassword wants. */
export function cryptoRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] ?? 0) / 2 ** 32;
}
