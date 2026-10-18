import { chromium } from "playwright-core";
import path from "node:path";

const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const base = process.argv[2] ?? "http://127.0.0.1:4323";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 1000);
const prefix = process.argv[5] ?? "/tmp/home";
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// Scroll slowly through the page once to trigger reveal observers.
await page.evaluate(async () => {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.7) {
    window.scrollTo(0, y);
    await delay(120);
  }
  window.scrollTo(0, 0);
  await delay(500);
});

await page.screenshot({ path: `${prefix}-hero.png` });
await page.evaluate(() => document.querySelector("#classics")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
await page.screenshot({ path: `${prefix}-classics.png` });
await page.evaluate(() => document.querySelector("#trending")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
await page.screenshot({ path: `${prefix}-trending.png` });
await page.evaluate(() => document.querySelector("#own")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
await page.screenshot({ path: `${prefix}-own.png` });
await page.evaluate(() => document.querySelector(".closing")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(600);
await page.screenshot({ path: `${prefix}-closing.png` });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.screenshot({ path: `${prefix}-full.png`, fullPage: true });
console.log(`shots -> ${prefix}-*.png`);
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
await browser.close();
