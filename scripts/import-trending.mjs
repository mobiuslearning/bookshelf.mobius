#!/usr/bin/env node
/**
 * Import 《高性价比人生指南》 from eternity4719/HowToLiveBetter into the
 * Markdown library. The source book is licensed CC BY 4.0, so the full text
 * can be mirrored with attribution. Run with:
 *
 *   pnpm import:trending
 *
 * The script is idempotent and caches downloads under .cache/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(root, ".cache", "how-to-live-better");
const libraryDir = path.join(
  root,
  "src",
  "content",
  "library",
  "trending",
  "gao-xing-jia-bi-ren-sheng-zhi-nan",
);
const chaptersDir = path.join(libraryDir, "chapters");
const repo = "eternity4719/HowToLiveBetter";
const branch = "main";
const cdn = `https://cdn.jsdelivr.net/gh/${repo}@${branch}/`;
const api = `https://data.jsdelivr.com/v1/packages/gh/${repo}@${branch}?structure=flat`;

const slug = "gao-xing-jia-bi-ren-sheng-zhi-nan";

fs.mkdirSync(cacheDir, { recursive: true });
fs.mkdirSync(chaptersDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "wooden-shelf-importer/1.0" },
      });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      await sleep(800 * (i + 1));
    }
  }
  throw lastError;
}

async function download(remotePath) {
  const cached = path.join(cacheDir, path.basename(remotePath));
  if (fs.existsSync(cached) && fs.statSync(cached).size > 200) {
    return fs.readFileSync(cached, "utf8");
  }
  const encoded = remotePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const text = await fetchText(cdn + encoded);
  fs.writeFileSync(cached, text);
  return text;
}

function stripInline(value = "") {
  return value
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rewriteLinks(body, sourceFiles) {
  const chapterNumbers = new Map(
    sourceFiles.map((file) => [
      path.basename(file),
      path.basename(file).slice(0, 2),
    ]),
  );

  return body
    .replace(/^\[← 回总目录\]\([^)]+\)\s*$/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, target) => {
      if (/^(https?:|mailto:|#)/.test(target)) return match;
      const [filePart, anchor = ""] = target.split("#");
      const base = path.basename(filePart);
      const suffix = anchor ? `#${anchor}` : "";
      if (base === "README.md") return `[${label}](/book/${slug})`;
      if (chapterNumbers.has(base)) {
        return `[${label}](/read/${slug}/${chapterNumbers.get(base)}${suffix})`;
      }
      if (filePart.includes("/docs/") || filePart.startsWith("docs/")) {
        return `[${label}](https://github.com/${repo}/blob/${branch}/${filePart.replace(/^\.\.\//, "")}${suffix})`;
      }
      return `[${label}](https://github.com/${repo}/blob/${branch}/book/${base}${suffix})`;
    });
}

const tree = JSON.parse(await fetchText(api));
const sourceFiles = tree.files
  .map((file) => file.name.replace(/^\//, ""))
  .filter((name) => /^book\/\d{2}-.+\.md$/.test(name))
  .sort();

if (sourceFiles.length === 0) {
  throw new Error("No chapters found in the source repository.");
}

console.log(`Found ${sourceFiles.length} chapters. Importing…`);

const imported = [];
for (const [index, remotePath] of sourceFiles.entries()) {
  const fileName = path.basename(remotePath);
  const number = fileName.slice(0, 2);
  const raw = await download(remotePath);
  const body = rewriteLinks(raw, sourceFiles);

  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = stripInline(titleMatch?.[1] ?? fileName.replace(/\.md$/, "")).replace(/^\d+\.\s*/, "");
  const withoutTitle = titleMatch
    ? body.replace(titleMatch[0], "").trimStart()
    : body;
  const firstParagraph =
    withoutTitle
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .find(
        (part) =>
          part &&
          !part.startsWith("#") &&
          !part.startsWith("|") &&
          !part.startsWith("<!--"),
      ) ?? "";
  const summary = stripInline(firstParagraph).slice(0, 120);

  const output = [
    "---",
    yaml
      .dump(
        {
          title,
          book: slug,
          order: Number(number),
          summary,
          kind: "chapter",
        },
        { lineWidth: 120, noRefs: true },
      )
      .trim(),
    "---",
    "",
    withoutTitle.trim(),
    "",
  ].join("\n");

  fs.writeFileSync(path.join(chaptersDir, `${number}.md`), output);
  imported.push({ title, number, chars: body.length });
  process.stdout.write(`  ${number} ${title}\n`);
}

const totalChars = imported.reduce((sum, item) => sum + item.chars, 0);
const hours = Math.max(1, Math.round((totalChars / 380 / 60) * 10) / 10);

const book = {
  slug,
  title: "高性价比人生指南",
  subtitle: "用最少的钱、时间和精力，换回最多的寿命、金钱和自由",
  author: "eternity4719",
  category: "trending",
  format: "markdown",
  access: "full",
  year: "2026",
  description:
    "765 条关于健康、金钱、法律与生活选择的具体建议。每一条都尽量写明成本、收益与证据强弱，像一本可以随时翻查的日常决策手册。",
  cover: `/covers/${slug}.svg`,
  accent: "#2f4a6d",
  tags: ["生活", "健康", "法律", "决策", "省钱"],
  featured: true,
  order: 1,
  status: "shelved",
  readingTime: `约 ${hours} 小时`,
  note:
    "本书全文依 CC BY 4.0 许可收录，作者 eternity4719。书中内容为一般信息，不构成医疗、法律或财务建议；具体事项请以当地医生、律师和主管部门的说法为准。",
  source: {
    label: "GitHub · eternity4719/HowToLiveBetter",
    url: `https://github.com/${repo}`,
  },
  license: {
    name: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
  motif: "grid",
};

fs.writeFileSync(
  path.join(libraryDir, "book.yaml"),
  yaml.dump(book, { lineWidth: 100, noRefs: true }),
);

console.log(`\nDone: ${imported.length} chapters, ~${hours}h reading.`);
