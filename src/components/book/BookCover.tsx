import { BOOK_COVER, BOOK_COVER_WEBP, BOOK_TITLE } from "@/data/bookStores";

/** The book cover with a WebP source and JPEG fallback. Width and height keep the layout steady while it loads. */
export function BookCover({ className, alt = `${BOOK_TITLE} book cover`, lazy = true }: { className?: string; alt?: string; lazy?: boolean }) {
  return (
    <picture>
      <source srcSet={BOOK_COVER_WEBP} type="image/webp" />
      <img src={BOOK_COVER} alt={alt} width={640} height={906} loading={lazy ? "lazy" : undefined} className={className} />
    </picture>
  );
}
