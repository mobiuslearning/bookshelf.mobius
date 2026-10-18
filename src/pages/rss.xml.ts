import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getBooks } from "../lib/library";
import { site } from "../data/site";

export const GET: APIRoute = async (context) => {
  const books = await getBooks();
  const now = new Date();
  return rss({
    title: `${site.name} · 新书上架`,
    description: site.description,
    site: context.site ?? site.url,
    items: books.map((book) => ({
      title: `${book.data.title} · ${book.data.author}`,
      description: book.data.description,
      link: `/book/${book.data.slug}`,
      pubDate: now,
      categories: [book.data.category, ...book.data.tags],
    })),
    customData: `<language>zh-CN</language>`,
  });
};
