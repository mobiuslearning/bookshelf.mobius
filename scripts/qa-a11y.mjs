import { chromium } from "playwright-core";
import axe from "axe-core";
import path from "node:path";

const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const base = process.argv[2] ?? "http://127.0.0.1:4323";
const pages = [
  ["home", "/"],
  ["book", "/book/gao-xing-jia-bi-ren-sheng-zhi-nan/"],
  ["reader", "/read/gao-xing-jia-bi-ren-sheng-zhi-nan/01/"],
  ["about", "/about"],
  ["pdf", "/read/shu-fang-shou-ce/pdf/"],
];
const browser = await chromium.launch({ executablePath: exe });
let total = 0;
for (const [name, url] of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => await axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  }));
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  total += serious.length;
  console.log(`\n${name}: ${results.violations.length} violations (${serious.length} serious+critical)`);
  for (const v of results.violations) {
    console.log(`- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length})`);
    for (const node of v.nodes.slice(0, 3)) console.log(`    ${node.target.join(" ")}`);
  }
  await page.close();
}
await browser.close();
console.log(`\nTOTAL serious/critical: ${total}`);
