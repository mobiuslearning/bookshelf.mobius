import { chromium } from "playwright-core";
import path from "node:path";

const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const url = process.argv[2] ?? "http://127.0.0.1:4323/";
const out = process.argv[3] ?? "/tmp/shot.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 1000);
const fullPage = process.argv[6] !== "viewport";

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1700);
await page.screenshot({ path: out, fullPage });
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
console.log(`shot ${url} -> ${out} (${width}x${height}, fullPage=${fullPage})`);
await browser.close();
