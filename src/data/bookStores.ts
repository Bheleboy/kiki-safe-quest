/**
 * Single switch for every outside store link (book page, family library, My Books, homepage copy).
 * While false, no store link, button, logo or "Prefer a store?" heading renders anywhere.
 * The store data below is kept so the links come back by flipping this to true.
 */
export const SHOW_BOOK_STORE_LINKS = false;

/** Printed and ebook store links for Kiki's Armour of God, as listed on the book page. */
export const BOOK_STORES = [
  { name: "Amazon", url: "https://www.amazon.com/dp/B0FBX2XS3H" },
  { name: "Apple Books", url: "https://books.apple.com/us/book/kikis-armour-of-god/id6745028928" },
  { name: "Kobo", url: "https://www.kobo.com/za/en/ebook/kiki-s-armour-of-god" },
  { name: "Barnes & Noble", url: "https://www.barnesandnoble.com/w/kikis-armour-of-god-nonala-tose-dagada/1147336266" },
];

/** Book cover: WebP for modern browsers, JPEG as the fallback and for social previews. */
export const BOOK_COVER = "/images/kiki-armour-of-god-cover.jpg";
export const BOOK_COVER_WEBP = "/images/kiki-armour-of-god-cover.webp";
export const BOOK_TITLE = "Kiki's Armour of God";
