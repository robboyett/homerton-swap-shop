/** Open Library parsing, with no network: the answers below are shaped like the real ones. */
import { describe, expect, it } from "vitest";
import { blurbFrom, guessShelf, lookupIsbn, parseBook } from "../openlibrary";

const gruffalo = {
  title: "The Gruffalo",
  authors: [{ name: "Julia Donaldson" }],
  cover: { large: "https://covers.openlibrary.org/b/id/10549185-L.jpg" },
  subjects: [{ name: "Animals" }, { name: "Children’s Picture Books" }],
  number_of_pages: 30,
};

function fakeFetch(routes: Record<string, unknown>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const hit = Object.entries(routes).find(([k]) => url.includes(k));
    if (!hit) return new Response("not found", { status: 404 });
    if (hit[1] instanceof Error) return new Response("boom", { status: 503 });
    return new Response(JSON.stringify(hit[1]), { status: 200 });
  }) as typeof fetch;
}

describe("guessShelf", () => {
  it("reads the subjects first", () => {
    expect(guessShelf(["Children's Picture Books"], 30)).toEqual({
      genre: "picture books",
      age_band: "0-3",
    });
    expect(guessShelf(["Wizards", "Magic"], 223)).toEqual({
      genre: "fantasy and adventure",
      age_band: "7-9",
    });
    expect(guessShelf(["Young adult fiction"], 300)).toEqual({
      genre: "young adult",
      age_band: "10+",
    });
    expect(guessShelf(["Dinosaurs", "Science"], 64)).toEqual({
      genre: "science and nature",
      age_band: "4-6",
    });
    expect(guessShelf(["Science fiction"], 300)).toEqual({
      genre: "chapter books",
      age_band: "7-9",
    });
  });

  it("falls back to the size of the book", () => {
    expect(guessShelf(["Juvenile fiction"], 40)).toEqual({
      genre: "picture books",
      age_band: "0-3",
    });
    expect(guessShelf(["Juvenile fiction"], 96)).toEqual({
      genre: "early readers",
      age_band: "4-6",
    });
    expect(guessShelf([], null)).toEqual({ genre: "chapter books", age_band: "7-9" });
  });
});

describe("blurbFrom", () => {
  it("takes the first paragraph, as a string or a value object, and trims long ones", () => {
    expect(blurbFrom("A mouse.\n\nMore about the mouse.")).toBe("A mouse.");
    expect(blurbFrom({ value: "  Spaced   out\ntext " })).toBe("Spaced out text");
    expect(blurbFrom(undefined)).toBeNull();
    expect(blurbFrom("")).toBeNull();
    const long = blurbFrom("x".repeat(500));
    expect(long?.length).toBe(398);
    expect(long?.endsWith("…")).toBe(true);
  });
});

describe("lookupIsbn", () => {
  const isbn = "9780333710937";

  it("builds a book for the pile from the three answers", async () => {
    const f = fakeFetch({
      "api/books": { [`ISBN:${isbn}`]: gruffalo },
      [`/isbn/${isbn}.json`]: { works: [{ key: "/works/OL1938178W" }] },
      "/works/OL1938178W.json": { description: "The Gruffalo is a picture book.\n\nMore." },
    });
    expect(await lookupIsbn(isbn, f)).toEqual({
      isbn,
      title: "The Gruffalo",
      author: "Julia Donaldson",
      blurb: "The Gruffalo is a picture book.",
      cover_url: "https://covers.openlibrary.org/b/id/10549185-L.jpg",
      genre: "picture books",
      age_band: "0-3",
    });
  });

  it("is null when the library has never heard of it", async () => {
    expect(await lookupIsbn(isbn, fakeFetch({ "api/books": {} }))).toBeNull();
  });

  it("still returns the book when only the blurb lookups fail", async () => {
    const f = fakeFetch({
      "api/books": { [`ISBN:${isbn}`]: gruffalo },
      [`/isbn/${isbn}.json`]: new Error(),
    });
    const book = await lookupIsbn(isbn, f);
    expect(book?.title).toBe("The Gruffalo");
    expect(book?.blurb).toBeNull();
  });

  it("throws when the library is not answering at all", async () => {
    await expect(lookupIsbn(isbn, fakeFetch({ "api/books": new Error() }))).rejects.toThrow();
  });

  it("copes with a book that has no author, cover or subjects", () => {
    const book = parseBook(isbn, { title: "Untitled Activity Book", number_of_pages: 16 }, null);
    expect(book).toEqual({
      isbn,
      title: "Untitled Activity Book",
      author: null,
      blurb: null,
      cover_url: null,
      genre: "picture books",
      age_band: "0-3",
    });
  });
});
