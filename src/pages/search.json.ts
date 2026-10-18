import type { APIRoute } from "astro";
import {
  getBooks,
  getChapters,
  readHref,
  chapterSlug,
  coverFor,
} from "../lib/library";
import { categoryMap } from "../data/site";

export const GET: APIRoute = async () => {
  const books = await getBooks();
  const chapters = await getChapters();
  const bookMap = new Map(books.map((book) => [book.data.slug, book]));

  const bookItems = books.map((book) => ({
    type: "book" as const,
    title: book.data.title,
    author: book.data.author,
    category: book.data.category,
    categoryLabel: categoryMap[book.data.category].label,
    description: book.data.description,
    tags: book.data.tags,
    href: `/book/${book.data.slug}`,
    cover: coverFor(book),
    order: book.data.order,
  }));

  const chapterItems = chapters
    .map((chapter) => {
      const book = bookMap.get(chapter.data.book);
      if (!book) return null;
      return {
        type: "chapter" as const,
        title: chapter.data.title,
        author: book.data.author,
        category: book.data.category,
        categoryLabel: categoryMap[book.data.category].label,
        summary: chapter.data.summary ?? "",
        bookTitle: book.data.title,
        href: readHref(book, chapter),
        order: chapter.data.order,
        chapter: chapterSlug(chapter),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return new Response(JSON.stringify([...bookItems, ...chapterItems]), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
