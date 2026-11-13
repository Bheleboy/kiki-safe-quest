import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOK_STORES } from "./bookStores";

describe("Family library store links", () => {
  it("uses the same store links as the book page", () => {
    const page = readFileSync(resolve(process.cwd(), "src/pages/BookArmourOfGod.tsx"), "utf8");
    for (const s of BOOK_STORES) expect(page).toContain(`url: "${s.url}"`);
  });
});
