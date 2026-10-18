import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const category = z.enum(["classics", "trending", "own"]);
const format = z.enum(["markdown", "pdf", "epub", "txt", "link"]);

/**
 * One folder per book:
 *
 *   src/content/library/<category>/<slug>/book.yaml
 *   src/content/library/<category>/<slug>/chapters/01-title.md
 *
 * `slug` is used in URLs and must be unique. Chapter files are optional for
 * PDF / EPUB / link books, which point at `file` or `source` instead.
 */
const books = defineCollection({
  loader: glob({ pattern: "**/book.yaml", base: "./src/content/library" }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母、数字和连字符"),
    title: z.string(),
    subtitle: z.string().optional(),
    author: z.string(),
    category,
    format: format.default("markdown"),
    access: z.enum(["full", "excerpt", "external"]).default("full"),
    year: z.string().optional(),
    description: z.string(),
    cover: z.string().optional(),
    accent: z.string().default("#9c6b45"),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    status: z.enum(["shelved", "reading", "finished"]).default("shelved"),
    progress: z.number().min(0).max(100).optional(),
    readingTime: z.string().optional(),
    file: z.string().optional(),
    fileLabel: z.string().optional(),
    source: z
      .object({
        label: z.string(),
        url: z.string().url(),
      })
      .optional(),
    license: z
      .object({
        name: z.string(),
        url: z.string().url(),
      })
      .optional(),
    note: z.string().optional(),
    motif: z
      .enum([
        "moon",
        "mountain",
        "wave",
        "bamboo",
        "cloud",
        "plum",
        "lantern",
        "window",
        "boat",
        "leaf",
        "stack",
        "grid",
      ])
      .default("moon"),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: "**/chapters/*.md", base: "./src/content/library" }),
  schema: z.object({
    title: z.string(),
    book: z.string(),
    order: z.number(),
    summary: z.string().optional(),
    kind: z.enum(["chapter", "excerpt", "guide"]).default("chapter"),
  }),
});

export const collections = { books, chapters };
