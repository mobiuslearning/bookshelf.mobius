#!/usr/bin/env node
/**
 * Add a book to the library.
 *
 *   pnpm book:new
 *   pnpm book:new -- --title "..." --author "..." --category own --slug my-book
 *   pnpm book:new -- --title "..." --author "..." --category classics --file ./book.pdf
 *
 * The script creates the metadata, copies PDF/EPUB assets into public/library,
 * converts TXT/Markdown into chapter files, and draws a matching SVG cover.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { renderCover } from "./lib/covers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libraryDir = path.join(root, "src", "content", "library");
const coversDir = path.join(root, "public", "covers");
const libraryPublicDir = path.join(root, "public", "library");

const categories = {
  classics: { label: "经典名著", accent: "#7c2f35", motif: "moon" },
  trending: { label: "当下热门", accent: "#2f4a6d", motif: "grid" },
  own: { label: "我的作品", accent: "#6b6a3c", motif: "leaf" },
};

const args = process.argv.slice(2).reduce((acc, arg, index, list) => {
  if (arg === "--") return acc;
  if (arg.startsWith("--")) {
    const key = arg.slice(2);
    const next = list[index + 1];
    acc[key] = next && !next.startsWith("--") ? next : true;
  }
  return acc;
}, {});

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function escapeYamlText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function stripMarkdown(value = "") {
  return value
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chapterSummary(body) {
  const paragraph =
    body
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .find((part) => part && !part.startsWith("#") && !part.startsWith("---")) ?? "";
  return stripMarkdown(paragraph).slice(0, 110);
}

function splitMarkdown(text) {
  const clean = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").trim();
  const lines = clean.split("\n");
  const h2Count = lines.filter((line) => /^##\s+/.test(line)).length;
  const h1Count = lines.filter((line) => /^#\s+/.test(line)).length;

  const splitAt = (hashes) => {
    const regex = new RegExp(`^${hashes}\\s+`);
    const sections = [];
    const preamble = [];
    let current = null;
    for (const line of lines) {
      if (regex.test(line)) {
        if (current) sections.push(current);
        current = {
          title: stripMarkdown(line.replace(regex, "")).slice(0, 80),
          lines: [],
        };
      } else if (current) {
        current.lines.push(line);
      } else {
        preamble.push(line);
      }
    }
    if (current) sections.push(current);
    const intro = preamble
      .join("\n")
      .replace(/^#\s+.*$/gm, "")
      .trim();
    const result = sections.map((section) => ({
      title: section.title,
      body: section.lines.join("\n").trim(),
    }));
    if (intro) result.unshift({ title: "序", body: intro });
    return result.filter((section) => section.body.length > 0 || section.title !== "序");
  };

  if (h2Count >= 2) return splitAt("##");
  if (h1Count >= 2) return splitAt("#");
  const body = clean.replace(/^#\s+.*$/gm, "").trim();
  return [{ title: "正文", body: body || clean }];
}

function splitText(text) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const chapterPattern = /^第[一二三四五六七八九十百千零两\d]+[章节回篇].*$/gm;
  if (chapterPattern.test(clean)) {
    const parts = clean.split(chapterPattern);
    const headings = clean.match(chapterPattern) ?? [];
    return headings.map((heading, index) => {
      const body = (parts[index + 1] ?? "").trim();
      return {
        title: stripMarkdown(heading).slice(0, 80),
        body,
      };
    });
  }
  const paragraphs = clean.split(/\n\s*\n/);
  const chunks = [];
  let buffer = "";
  for (const paragraph of paragraphs) {
    if ((buffer + "\n\n" + paragraph).length > 3800 && buffer) {
      chunks.push(buffer);
      buffer = paragraph;
    } else {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.map((body, index) => ({
    title: index === 0 ? "正文" : `第 ${index + 1} 部分`,
    body,
  }));
}

function findBooks() {
  if (!fs.existsSync(libraryDir)) return [];
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "book.yaml") {
        try {
          found.push(yaml.load(fs.readFileSync(full, "utf8")));
        } catch {
          // Ignore malformed files; the build will report them.
        }
      }
    }
  };
  walk(libraryDir);
  return found;
}

const existing = findBooks();

async function main() {
  if (!stdin.isTTY && !args.slug) {
    fail("非交互环境请至少提供 --slug、--title、--author 与 --category。");
  }
  const rl = stdin.isTTY
    ? readline.createInterface({ input: stdin, output: stdout })
    : null;
  const ask = async (question, fallback = "") => {
    if (!rl) return fallback;
    const answer = (await rl.question(question)).trim();
    return answer || fallback;
  };
  const choose = async (question, options, fallback) => {
    if (!rl) return fallback;
    console.log(`\n${question}`);
    options.forEach((option, index) => console.log(`  ${index + 1}. ${option.label}`));
    const answer = (await rl.question(`选择 [1-${options.length}]（默认 ${fallback + 1}）：`)).trim();
    const index = Number(answer || fallback + 1) - 1;
    return options[index]?.value ?? options[fallback].value;
  };

  try {
    console.log("\n木间书斋 · 添书");
    console.log("────────────────");

    const title = String(args.title ?? (await ask("书名："))).trim() || fail("书名不能为空。");
    const author = String(args.author ?? (await ask("作者：", "佚名"))).trim() || "佚名";

    const category = String(
      args.category ??
        (await choose(
          "放在哪一层书架？",
          Object.entries(categories).map(([value, item]) => ({
            value,
            label: `${item.label}（${value}）`,
          })),
          2,
        )),
    ).trim();

    if (!categories[category]) fail(`未知分类：${category}，可选 classics / trending / own。`);

    const fileInput = args.file ? path.resolve(String(args.file)) : null;
    if (fileInput && !fs.existsSync(fileInput)) fail(`找不到文件：${fileInput}`);

    const extension = fileInput ? path.extname(fileInput).toLowerCase() : "";
    let format = String(
      args.format ??
        (fileInput
          ? { ".pdf": "pdf", ".epub": "epub", ".txt": "txt", ".md": "markdown", ".markdown": "markdown" }[
              extension
            ] ?? "markdown"
          : await choose(
              "书的格式？",
              [
                { value: "markdown", label: "Markdown · 站内全文阅读" },
                { value: "pdf", label: "PDF · 站内翻阅 + 下载" },
                { value: "epub", label: "EPUB · 下载到阅读器" },
                { value: "link", label: "外部链接 · 只放入口" },
              ],
              0,
            )),
    ).trim();
    if (format === "md") format = "markdown";
    if (!["markdown", "pdf", "epub", "txt", "link"].includes(format)) {
      fail(`未知格式：${format}。`);
    }

    const defaultSlug = slugify(args.slug ?? path.basename(fileInput ?? "", extension) ?? "");
    let slug = String(args.slug ?? (await ask("英文 slug（小写字母、数字、连字符）：", defaultSlug))).trim();
    if (!slug) slug = defaultSlug;
    if (!/^[a-z0-9-]+$/.test(slug)) fail("slug 只能包含小写字母、数字和连字符。");
    if (existing.some((book) => book?.slug === slug)) fail(`书架里已经有 slug 为 ${slug} 的书了。`);

    let description = String(args.description ?? "").trim();
    if (!description) {
      description = await ask("一句话介绍（可留空）：", "一本刚刚放上书架的书。");
    }

    let access = String(args.access ?? "").trim();
    if (!access) {
      access = await choose(
        "收录方式？",
        [
          { value: "full", label: "全文收录" },
          { value: "excerpt", label: "导读 / 书摘" },
          { value: "external", label: "只放外部链接" },
        ],
        0,
      );
    }

    const tags = String(args.tags ?? (await ask("标签（用逗号分隔，可留空）：")))
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    const motif =
      String(args.motif ?? "") ||
      (await choose(
        "封面图案？",
        ["moon", "mountain", "wave", "bamboo", "cloud", "plum", "lantern", "window", "boat", "leaf", "stack", "grid"].map(
          (value) => ({ value, label: value }),
        ),
        categories[category].motif === "leaf" ? 9 : categories[category].motif === "grid" ? 11 : 0,
      ));

    let source = null;
    if (format === "link") {
      const url = String(args.url ?? args.source ?? (await ask("外部链接："))).trim();
      if (!/^https?:\/\//.test(url)) fail("外部链接需要以 http:// 或 https:// 开头。");
      source = { label: "原文链接", url };
      access = "external";
    }

    const year = String(args.year ?? new Date().getFullYear());
    const order = Number(
      args.order ??
        Math.max(
          0,
          ...existing
            .filter((book) => book?.category === category)
            .map((book) => Number(book?.order) || 0),
        ) + 1,
    );

    const folder = path.join(libraryDir, category, slug);
    const chaptersDir = path.join(folder, "chapters");
    const publicBookDir = path.join(libraryPublicDir, slug);
    fs.mkdirSync(chaptersDir, { recursive: true });
    if (format === "pdf" || format === "epub") fs.mkdirSync(publicBookDir, { recursive: true });

    let filePath;
    let fileLabel;
    if (fileInput && (format === "pdf" || format === "epub")) {
      const target = path.join(publicBookDir, path.basename(fileInput));
      fs.copyFileSync(fileInput, target);
      filePath = `/library/${slug}/${path.basename(fileInput)}`;
      fileLabel = format === "pdf" ? "下载 PDF" : "下载 EPUB";
    }

    const book = {
      slug,
      title,
      author,
      category,
      format: format === "txt" ? "markdown" : format,
      access,
      year,
      description,
      cover: `/covers/${slug}.svg`,
      accent: categories[category].accent,
      tags,
      featured: false,
      order,
      status: "shelved",
      motif,
      ...(filePath ? { file: filePath, fileLabel } : {}),
      ...(source ? { source } : {}),
      ...(args.note ? { note: String(args.note) } : {}),
    };

    fs.writeFileSync(path.join(folder, "book.yaml"), yaml.dump(book, { lineWidth: 100, noRefs: true }));
    fs.mkdirSync(coversDir, { recursive: true });
    fs.writeFileSync(path.join(coversDir, `${slug}.svg`), renderCover(book));

    // Build chapters from Markdown / TXT, or create a starter chapter.
    let sections = [];
    if (fileInput && [".md", ".markdown"].includes(extension)) {
      sections = splitMarkdown(fs.readFileSync(fileInput, "utf8"));
    } else if (fileInput && extension === ".txt") {
      sections = splitText(fs.readFileSync(fileInput, "utf8"));
    } else if (format === "markdown" && !fileInput) {
      sections = [
        {
          title: "第一篇",
          body: "从这一行开始写你的正文。\n\n可以把这篇 Markdown 文件复制成 02.md、03.md，按顺序放在 chapters/ 目录里。",
        },
      ];
    }

    sections.forEach((section, index) => {
      const number = String(index + 1).padStart(2, "0");
      const frontmatter = yaml
        .dump(
          {
            title: section.title || `第 ${index + 1} 篇`,
            book: slug,
            order: index + 1,
            summary: chapterSummary(section.body),
            kind: "chapter",
          },
          { lineWidth: 120, noRefs: true },
        )
        .trim();
      fs.writeFileSync(
        path.join(chaptersDir, `${number}.md`),
        `---\n${frontmatter}\n---\n\n${section.body}\n`,
      );
    });

    if (format === "link") {
      // A link-only book still gets a small note file so the folder is never empty.
      fs.writeFileSync(
        path.join(folder, "README.md"),
        `# ${title}\n\n外部链接：${source.url}\n`,
      );
    }

    console.log("\n✓ 已放上书架");
    console.log(`  书名   ${title}`);
    console.log(`  作者   ${author}`);
    console.log(`  分类   ${categories[category].label}（${category}）`);
    console.log(`  格式   ${book.format}`);
    console.log(`  目录   src/content/library/${category}/${slug}/`);
    console.log(`  封面   public/covers/${slug}.svg`);
    if (sections.length) console.log(`  章节   ${sections.length} 篇`);
    if (filePath) console.log(`  文件   public${filePath}`);
    console.log("\n下一步：");
    console.log("  pnpm dev       # 预览");
    console.log("  pnpm build     # 构建静态站点");
    if (sections.length && format === "markdown") {
      console.log(`\n直接编辑 src/content/library/${category}/${slug}/chapters/*.md 即可改正文。`);
    }
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
