import { chromium } from "playwright-core";
import path from "node:path";

const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const base = process.argv[2] ?? "http://127.0.0.1:4323";
const browser = await chromium.launch({ executablePath: exe });
const failures = [];
const check = (ok, label, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${extra ? ` :: ${extra}` : ""}`);
  if (!ok) failures.push(label);
};

async function makePage(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("requestfailed", (req) => errors.push(`requestfailed ${req.url()} ${req.failure()?.errorText}`));
  return { page, errors };
}

// Desktop home
let { page, errors } = await makePage({ width: 1440, height: 1000 });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
check(await page.locator("h1").first().isVisible(), "home h1 visible");
check((await page.locator("#classics .book-obj").count()) === 8, "8 classics on shelf", String(await page.locator("#classics .book-obj").count()));
check((await page.locator("#own .book-obj").count()) === 4, "4 own books on shelf");
check(errors.length === 0, "home has no console/network errors", errors.join(" | "));

// theme toggle persists
const before = await page.getAttribute("html", "data-theme");
await page.click("[data-theme-toggle]");
await page.waitForTimeout(250);
const after = await page.getAttribute("html", "data-theme");
check(before !== after, "theme toggle changes theme", `${before} -> ${after}`);
await page.reload({ waitUntil: "networkidle" });
check((await page.getAttribute("html", "data-theme")) === after, "theme persists after reload");

// search
await page.keyboard.press("Meta+k");
await page.waitForTimeout(500);
check(await page.locator("[data-search-dialog]").evaluate((el) => el.open), "search dialog opens");
await page.fill("[data-search-input]", "高性价比");
await page.waitForTimeout(300);
const results = await page.locator(".search-result").count();
check(results >= 2, "search finds book + chapter", String(results));
await page.keyboard.press("Escape");
await page.waitForTimeout(250);
check(!(await page.locator("[data-search-dialog]").evaluate((el) => el.open)), "escape closes search");

// navigate to book
await page.goto(base + "/book/gao-xing-jia-bi-ren-sheng-zhi-nan/", { waitUntil: "networkidle" });
check(await page.locator("h1").first().isVisible(), "book detail h1 visible");
const firstChapter = await page.locator(".contents-list a").first().getAttribute("href");
check(Boolean(firstChapter), "table of contents links present");
check((await page.locator(".book-facts").innerText()).includes("31 篇"), "book facts show 31 chapters");
check(!(await page.locator(".book-facts").innerText()).includes("待补充"), "book facts no placeholder reading label");

// reader
await page.goto(base + firstChapter, { waitUntil: "networkidle" });
check(await page.locator(".prose-book").isVisible(), "reader content visible");
const sizeBefore = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--reader-size"));
await page.click('[data-font-size="1"]');
await page.waitForTimeout(200);
const sizeAfter = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--reader-size"));
check(sizeBefore !== sizeAfter, "reader font size changes", `${sizeBefore.trim()} -> ${sizeAfter.trim()}`);
await page.click("[data-reader-theme-toggle]");
await page.waitForTimeout(200);
check((await page.getAttribute("html", "data-reader-theme")) === "night", "reader night mode toggles");
await page.click("[data-reader-theme-toggle]");
await page.waitForTimeout(200);

// mobile home + menu
await page.close();
({ page, errors } = await makePage({ width: 390, height: 844 }));
await page.goto(base + "/", { waitUntil: "networkidle" });
check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "mobile home has no horizontal overflow");
await page.click("[data-menu-toggle]");
await page.waitForTimeout(800);
check(await page.locator(".mobile-primary").isVisible(), "mobile menu opens");
check((await page.evaluate(() => getComputedStyle(document.querySelector(".mobile-panel")).visibility)) === "visible", "mobile menu panel visible");
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
check((await page.evaluate(() => getComputedStyle(document.querySelector(".mobile-panel")).visibility)) === "hidden", "escape hides mobile menu");
check(errors.length === 0, "mobile home has no console/network errors", errors.join(" | "));

// mobile reader
await page.goto(base + "/read/man-du-ji/01/", { waitUntil: "networkidle" });
check((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "mobile reader has no horizontal overflow");
check(await page.locator(".mobile-toc").isVisible(), "mobile reader toc visible");
await page.close();

// PDF viewer
({ page, errors } = await makePage({ width: 1440, height: 1000 }));
await page.goto(base + "/read/shu-fang-shou-ce/pdf/", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const pdfState = await page.evaluate(() => {
  const canvas = document.querySelector("[data-pdf-canvas]");
  return {
    width: canvas?.width ?? 0,
    height: canvas?.height ?? 0,
    current: document.querySelector("[data-pdf-current]")?.textContent,
    total: document.querySelector("[data-pdf-total]")?.textContent,
    error: !document.querySelector("[data-pdf-error]")?.hasAttribute("hidden"),
  };
});
check(pdfState.width > 300 && pdfState.height > 300, "PDF canvas rendered", `${pdfState.width}x${pdfState.height}`);
check(pdfState.total === "5", "PDF page count", String(pdfState.total));
check(!pdfState.error, "PDF viewer reports no error");
await page.click("[data-pdf-next]");
await page.waitForTimeout(700);
check((await page.locator("[data-pdf-current]").innerText()) === "2", "PDF next page works");
check(errors.length === 0, "PDF page has no console/network errors", errors.join(" | "));
await page.close();

// mobile PDF
({ page, errors } = await makePage({ width: 390, height: 844 }));
await page.goto(base + "/read/shu-fang-shou-ce/pdf/", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const mobilePdf = await page.evaluate(() => {
  const canvas = document.querySelector("[data-pdf-canvas]");
  return { width: canvas?.width ?? 0, scrollWidth: document.documentElement.scrollWidth };
});
check(mobilePdf.width > 200, "mobile PDF renders", `${mobilePdf.width}`);
check(mobilePdf.scrollWidth <= 390, "mobile PDF no horizontal overflow", String(mobilePdf.scrollWidth));
await page.close();

console.log(`\n${failures.length ? "FAILURES: " + failures.join(", ") : "ALL CHECKS PASSED"}`);
await browser.close();
process.exit(failures.length ? 1 : 0);
