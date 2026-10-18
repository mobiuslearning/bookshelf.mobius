import { getCollection, type CollectionEntry } from "astro:content";
import { categoryMap, categoryOrder, type CategoryKey } from "../data/site";

export type Book = CollectionEntry<"books">;
export type Chapter = CollectionEntry<"chapters">;

export const bookSlug = (book: Book) => book.data.slug;

export const chapterSlug = (chapter: Chapter) =>
  chapter.id.split("/").pop() as string;

export async function getBooks(): Promise<Book[]> {
  const books = await getCollection("books");
  return books.sort((a, b) => {
    const cat =
      categoryOrder.indexOf(a.data.category) -
      categoryOrder.indexOf(b.data.category);
    if (cat !== 0) return cat;
    return a.data.order - b.data.order;
  });
}

export async function getBook(slug: string): Promise<Book | undefined> {
  const books = await getBooks();
  return books.find((book) => book.data.slug === slug);
}

export async function getChapters(): Promise<Chapter[]> {
  return getCollection("chapters");
}

export async function getBookChapters(book: Book): Promise<Chapter[]> {
  const chapters = await getChapters();
  return chapters
    .filter((chapter) => chapter.data.book === book.data.slug)
    .sort((a, b) => a.data.order - b.data.order);
}

export async function getBooksByCategory(
  category: CategoryKey,
): Promise<Book[]> {
  const books = await getBooks();
  return books.filter((book) => book.data.category === category);
}

export function categoryMeta(category: CategoryKey) {
  return categoryMap[category];
}

export function coverFor(book: Book) {
  return book.data.cover ?? `/covers/${book.data.slug}.svg`;
}

export function bookHref(book: Book) {
  return `/book/${book.data.slug}`;
}

export function readHref(book: Book, chapter?: Chapter) {
  if (book.data.format === "pdf") return `/read/${book.data.slug}/pdf`;
  if (!chapter) return `/book/${book.data.slug}`;
  return `/read/${book.data.slug}/${chapterSlug(chapter)}`;
}

export function firstReadHref(book: Book, chapters: Chapter[]) {
  return readHref(book, chapters[0]);
}

export function readingMinutes(body = "") {
  // Count CJK characters and Latin words, then round to a comfortable pace.
  const cjk = (body.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latin = (body.match(/[A-Za-z0-9]+/g) ?? []).length;
  const minutes = Math.ceil(cjk / 380 + latin / 220);
  return Math.max(1, minutes);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function statusLabel(status: Book["data"]["status"]) {
  return status === "reading" ? "在读" : status === "finished" ? "读过" : "藏本";
}

export function formatLabel(format: Book["data"]["format"]) {
  return {
    markdown: "可全文阅读",
    pdf: "PDF 藏本",
    epub: "EPUB 藏本",
    txt: "文本藏本",
    link: "外部藏书",
  }[format];
}

export function formatDuration(minutes: number) {
  if (!minutes) return "—";
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} 分钟`;
  const hours = minutes / 60;
  return `约 ${hours >= 10 ? Math.round(hours) : Number(hours.toFixed(1))} 小时`;
}
