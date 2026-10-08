/**
 * Open Library: the one place a book is looked up by ISBN (docs/plan.md, "Adding a book").
 *
 * Three small requests: the books API for title, author, cover and subjects; the edition for
 * its work; the work for a description to use as the blurb. Only the first has to succeed.
 * The genre and age band are a guess from the subjects and the page count, made so the pile
 * usually needs no correcting; the person reviewing the pile has the last word.
 *
 * No library. `fetch` is passed in so the parsing can be tested without the network.
 */
import type { AgeBand, Genre, NewBook } from "../../shared/schema";

const BASE = "https://openlibrary.org";
const HEADERS = { "user-agent": "homerton-swap-shop (github.com/robboyett/homerton-swap-shop)" };
const TIMEOUT_MS = 8000;

type Fetch = typeof fetch;

/** The parts of the books API answer we read. Everything is optional in practice. */
type BooksApiBook = {
  title?: string;
  authors?: { name?: string }[];
  cover?: { large?: string; medium?: string };
  subjects?: { name?: string }[];
  number_of_pages?: number;
};

export type Shelf = { genre: Genre; age_band: AgeBand };

/** Where a book probably goes. Subjects first, then size. The pile is where it gets corrected. */
export function guessShelf(subjects: string[], pages: number | null): Shelf {
  const s = subjects.join(" | ").toLowerCase();
  if (/young adult|teen/.test(s)) return { genre: "young adult", age_band: "10+" };
  if (/picture book|board book/.test(s)) return { genre: "picture books", age_band: "0-3" };
  if (/early reader|beginning reader|easy reader|first reader|phonics|readers\b|level \d/.test(s)) {
    return { genre: "early readers", age_band: "4-6" };
  }
  if (/fantasy|magic|wizard|dragon|adventure|quest|monsters/.test(s)) {
    return { genre: "fantasy and adventure", age_band: "7-9" };
  }
  if (
    /science|nature|space|dinosaur|facts|nonfiction|non-fiction|encyclopedia/.test(s) &&
    !/fiction/.test(s)
  ) {
    return { genre: "science and nature", age_band: "4-6" };
  }
  if (pages !== null && pages <= 48) return { genre: "picture books", age_band: "0-3" };
  if (pages !== null && pages <= 120) return { genre: "early readers", age_band: "4-6" };
  return { genre: "chapter books", age_band: "7-9" };
}

/** The first paragraph of a work description, trimmed to a blurb's length. */
export function blurbFrom(description: unknown): string | null {
  const text =
    typeof description === "string"
      ? description
      : typeof (description as { value?: unknown })?.value === "string"
        ? ((description as { value: string }).value ?? "")
        : "";
  const first =
    text
      .split(/\n\s*\n|\r\n\s*\r\n/)[0]
      ?.replace(/\s+/g, " ")
      .trim() ?? "";
  if (!first) return null;
  return first.length > 400 ? `${first.slice(0, 397).trimEnd()}…` : first;
}

/** The books API answer, as a book for the pile. Null when the title is missing, which is "not found". */
export function parseBook(
  isbn: string,
  book: BooksApiBook | undefined,
  blurb: string | null,
): NewBook | null {
  if (!book?.title) return null;
  const subjects = (book.subjects ?? []).map((s) => s.name ?? "").filter(Boolean);
  const authors = (book.authors ?? []).map((a) => a.name ?? "").filter(Boolean);
  return {
    isbn,
    title: book.title.trim(),
    author: authors.length ? authors.join(", ") : null,
    blurb,
    cover_url: book.cover?.large ?? book.cover?.medium ?? null,
    ...guessShelf(subjects, book.number_of_pages ?? null),
  };
}

async function getJson<T>(fetchImpl: Fetch, url: string): Promise<T | null> {
  const res = await fetchImpl(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`open library answered ${res.status} for ${url}`);
  return (await res.json()) as T;
}

/**
 * Look a normalised ISBN up. Null means Open Library has never heard of it; a thrown error
 * means it is not answering, which the route turns into "try again, or type it in".
 */
export async function lookupIsbn(isbn: string, fetchImpl: Fetch = fetch): Promise<NewBook | null> {
  const key = `ISBN:${isbn}`;
  const books = await getJson<Record<string, BooksApiBook>>(
    fetchImpl,
    `${BASE}/api/books?bibkeys=${key}&format=json&jscmd=data`,
  );
  const book = books?.[key];
  if (!book?.title) return null;

  // The blurb is a nicety: two more requests, and any failure just means no blurb.
  let blurb: string | null = null;
  try {
    const edition = await getJson<{ works?: { key?: string }[] }>(
      fetchImpl,
      `${BASE}/isbn/${isbn}.json`,
    );
    const workKey = edition?.works?.[0]?.key;
    if (workKey) {
      const work = await getJson<{ description?: unknown }>(fetchImpl, `${BASE}${workKey}.json`);
      blurb = blurbFrom(work?.description);
    }
  } catch {
    blurb = null;
  }
  return parseBook(isbn, book, blurb);
}
