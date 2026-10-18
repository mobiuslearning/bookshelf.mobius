import { chromium } from "playwright-core";
import path from "node:path";

const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const base = "http://127.0.0.1:4323";
const browser = await chromium.launch({ executablePath: exe });
const errors = [];

async function pageAt(url, viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  page.on("console", (msg) => msg.type() === "error" && errors.push(`${url} :: ${msg.text()}`));
  page.on("pageerror", (error) => errors.push(`${url} :: ${error}`));
  page.on("requestfailed", (req) => errors.push(`${url} :: requestfailed ${req.url()} ${req.failure()?.errorText}`));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  return page;
}

// Search modal
let page = await pageAt(base + "/");
await page.keyboard.press("Meta+k");
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/search-open.png" });
await page.fill("[data-search-input]", "红楼");
await page.waitForTimeout(350);
await page.screenshot({ path: "/tmp/search-results.png" });
const searchCount = await page.textContent("[data-search-count]");
console.log("search count:", searchCount);
const firstHref = await page.getAttribute(".search-result", "href");
console.log("first search href:", firstHref);
await page.keyboard.press("Escape");
await page.waitForTimeout(250);

// Day theme + shelf
await page.click("[data-theme-toggle]");
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector("#classics")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/day-classics.png" });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/day-hero.png" });
await page.close();

// About
page = await pageAt(base + "/about");
await page.screenshot({ path: "/tmp/about.png" });
await page.evaluate(() => document.querySelector("#add-book")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/about-addbook.png" });
await page.close();

// Mobile home + menu
page = await pageAt(base + "/", { width: 390, height: 844 });
await page.screenshot({ path: "/tmp/mobile-hero.png" });
await page.evaluate(() => document.querySelector("#classics")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/mobile-classics.png" });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.click("[data-menu-toggle]");
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/mobile-menu.png" });
await page.close();

// Mobile reader
page = await pageAt(base + "/read/man-du-ji/01/", { width: 390, height: 844 });
await page.screenshot({ path: "/tmp/mobile-reader.png" });
await page.close();

// Reader night mode
page = await pageAt(base + "/read/gao-xing-jia-bi-ren-sheng-zhi-nan/01/", { width: 1440, height: 1000 });
await page.click("[data-reader-theme-toggle]");
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/reader-night.png" });
await page.close();

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
