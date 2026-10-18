#!/usr/bin/env node
/** Render the 1200×630 social preview card with the local Chromium. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);
const fileUrl = (p) => `file://${path.join(root, p)}`;
const cover = (name) => fileUrl(`public/covers/${name}.svg`);

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; margin: 0; overflow: hidden; }
  body {
    font-family: "Songti SC", "Noto Serif SC", serif;
    color: #f2e7d0;
    background: #100a07;
    position: relative;
  }
  .wall {
    position: absolute; inset: -4%;
    background-image: url("${fileUrl("public/textures/wood-wall.jpg")}");
    background-size: cover; background-position: center;
    filter: brightness(.55) saturate(.85);
    transform: scale(1.05);
  }
  .wash {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(10,6,4,.93), rgba(10,6,4,.66) 50%, rgba(10,6,4,.3)),
      radial-gradient(60% 90% at 78% 20%, rgba(255,190,110,.25), transparent 70%),
      linear-gradient(180deg, rgba(10,6,4,.5), transparent 30%, rgba(10,6,4,.75));
  }
  .grain {
    position: absolute; inset: 0; opacity: .4;
    background-image: url("${fileUrl("public/textures/noise.png")}");
    mix-blend-mode: overlay;
  }
  .inner { position: relative; z-index: 2; display: flex; height: 100%; padding: 64px 72px; }
  .left { width: 620px; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { font-family: "Cormorant Garamond", Georgia, serif; font-size: 15px; letter-spacing: 6px; color: #d5b47c; }
  h1 { margin: 20px 0 0; font-size: 100px; line-height: 1.04; letter-spacing: 12px; font-weight: 500; color: #f4e8d2; }
  .tagline { margin: 24px 0 0; font-size: 23px; letter-spacing: 7px; color: #d8c19a; }
  .rule { width: 72px; height: 1px; background: #c9a86a; margin: 28px 0 22px; opacity: .7; }
  .desc { margin: 0; max-width: 480px; font-size: 17px; line-height: 2; color: rgba(235,220,193,.72); }
  .stats { display: flex; gap: 38px; margin-top: 30px; font-family: "Cormorant Garamond", Georgia, serif; }
  .stats b { display: block; font-size: 30px; font-weight: 500; color: #ead6b0; }
  .stats span { display: block; margin-top: 4px; font-family: "Songti SC", serif; font-size: 12px; letter-spacing: 2px; color: rgba(216,193,154,.6); }
  .right { position: relative; flex: 1; }
  .books { position: absolute; left: 80px; top: 70px; width: 420px; height: 490px; }
  .book { position: absolute; width: 190px; height: 285px; border-radius: 2px; box-shadow: 0 30px 50px -20px rgba(0,0,0,.8), 0 0 0 1px rgba(0,0,0,.3); }
  .book img { width: 100%; height: 100%; display: block; }
  .b1 { left: 150px; top: 32px; transform: rotate(8deg); z-index: 3; }
  .b2 { left: 40px; top: 110px; transform: rotate(-7deg); z-index: 2; }
  .b3 { left: 230px; top: 170px; transform: rotate(4deg); z-index: 1; opacity: .94; }
  .seal { position: absolute; right: 16px; bottom: 4px; width: 52px; height: 52px; display: grid; place-items: center; color: #f0e2c8; background: #9d3c31; font-size: 25px; transform: rotate(4deg); }
  .url { position: absolute; left: 72px; bottom: 32px; font-family: "Cormorant Garamond", Georgia, serif; font-size: 13px; letter-spacing: 4px; color: rgba(213,180,124,.55); }
</style></head>
<body>
  <div class="wall"></div><div class="wash"></div><div class="grain"></div>
  <div class="inner">
    <div class="left">
      <div class="eyebrow">THE WOODEN SHELF · EST. 2026</div>
      <h1>木间书斋</h1>
      <div class="tagline">一室木香，半架闲书。</div>
      <div class="rule"></div>
      <p class="desc">经典名著、当下热门，和自己写下的字。<br>把读过的书，放在伸手就能碰到的地方。</p>
      <div class="stats">
        <div><b>13</b><span>册藏书</span></div>
        <div><b>49</b><span>篇可读</span></div>
        <div><b>03</b><span>类书架</span></div>
      </div>
    </div>
    <div class="right">
      <div class="books">
        <div class="book b2"><img src="${cover("hongloumeng")}"></div>
        <div class="book b3"><img src="${cover("man-du-ji")}"></div>
        <div class="book b1"><img src="${cover("gao-xing-jia-bi-ren-sheng-zhi-nan")}"></div>
      </div>
      <div class="seal">木</div>
    </div>
  </div>
  <div class="url">WOODEN-SHELF.EXAMPLE.COM</div>
</body></html>`;

fs.mkdirSync(path.join(root, ".cache"), { recursive: true });
const htmlPath = path.join(root, ".cache", "og.html");
fs.writeFileSync(htmlPath, html);

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(root, "public", "og.png") });
await browser.close();
console.log("public/og.png");
