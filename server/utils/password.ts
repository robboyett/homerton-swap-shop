/**
 * Passwords are scrypt from node:crypto, no library (docs/plan.md, "Auth"; ADR 0009).
 *
 * Stored as `scrypt$<N>$<salt hex>$<hash hex>`, so the cost can rise later without re-hashing
 * everyone at once: verify reads N from the string it is checking.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

/** node:crypto's callback form, as a promise. `promisify` picks the overload without options. */
function scrypt(password: string, salt: Buffer, keyLength: number, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, { N: cost }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** 2^14. About 16 MB and a few tens of milliseconds, which is slow enough for a hundred neighbours. */
const COST = 16384;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, COST);
  return `scrypt$${COST}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/** False for a wrong password and for a stored string that is not one of ours. Never throws. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, cost, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !cost || !saltHex || !keyHex) return false;
  const n = Number(cost);
  if (!Number.isInteger(n) || n < 2) return false;
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  try {
    const key = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LENGTH, n);
    return timingSafeEqual(key, expected);
  } catch {
    // A cost that is not a power of two, or too large for memory: not one of ours.
    return false;
  }
}
