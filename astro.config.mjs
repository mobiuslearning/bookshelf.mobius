import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Keep the imported book content expressive but safe. The library imports
// third-party Markdown, so raw HTML is sanitised at build time.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "summary",
    "kbd",
    "mark",
    "figure",
    "figcaption",
    "picture",
    "source",
    "dl",
    "dt",
    "dd",
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
    details: ["open"],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
  },
};

export default defineConfig({
  site: "https://wooden-shelf.example.com",
  integrations: [sitemap()],
  devToolbar: { enabled: false },
  markdown: {
    rehypePlugins: [[rehypeSanitize, sanitizeSchema]],
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
