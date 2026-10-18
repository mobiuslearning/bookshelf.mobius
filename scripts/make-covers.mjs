#!/usr/bin/env node
/**
 * Generate typographic SVG covers for every book in the library.
 *
 *   pnpm covers           # only missing covers
 *   pnpm covers --force   # regenerate all covers
 *
 * Each book's `cover` path is respected; covers live in public/covers by
 * default. New books get a cover automatically through `pnpm book:new`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { renderCover } from "./lib/covers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libraryDir = path.join(root, "src", "content", "library");
const force = process.argv.includes("--force");

function findBookFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findBookFiles(full);
    return entry.name === "book.yaml" ? [full] : [];
  });
}

let made = 0;
let skipped = 0;

for (const file of findBookFiles(libraryDir)) {
  const book = yaml.load(fs.readFileSync(file, "utf8"));
  if (!book?.slug) {
    console.warn(`skip (no slug): ${path.relative(root, file)}`);
    continue;
  }
  const coverPath = book.cover || `/covers/${book.slug}.svg`;
  const output = path.join(root, "public", coverPath.replace(/^\//, ""));
  if (!force && fs.existsSync(output)) {
    skipped += 1;
    continue;
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderCover(book));
  made += 1;
  console.log(`cover  ${book.title}  →  public${coverPath}`);
}

console.log(`\nGenerated ${made} cover(s), skipped ${skipped}.`);
