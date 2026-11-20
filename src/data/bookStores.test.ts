import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOK_STORES, SHOW_BOOK_STORE_LINKS } from "./bookStores";

describe("Family library store links", () => {
  it("uses the same store links as the book page", () => {
    const page = readFileSync(resolve(process.cwd(), "src/pages/BookArmourOfGod.tsx"), "utf8");
    for (const s of BOOK_STORES) expect(page).toContain(`url: "${s.url}"`);
  });

  it("keeps outside store links switched off for launch, with the store data kept for later", () => {
    expect(SHOW_BOOK_STORE_LINKS).toBe(false);
    expect(BOOK_STORES.length).toBeGreaterThan(0);
  });
});
