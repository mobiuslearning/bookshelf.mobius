#!/usr/bin/env node
/** Make the 4-page "添书记" PDF sample used to demonstrate PDF shelving. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "library", "shu-fang-shou-ce", "tian-shu-ji.pdf");
const file = (p) => `file://${path.join(root, p)}`;
const exe = path.join(
  process.env.HOME,
  "Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Songti SC", "Noto Serif SC", serif; color: #2b251d; }
  .page { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; break-after: page; background: #f0e6d1; }
  .page:last-child { page-break-after: auto; }
  .paper { position: absolute; inset: 0; background-image: url("${file("public/textures/paper.jpg")}"); background-size: cover; opacity: .9; }
  .grain { position: absolute; inset: 0; background-image: url("${file("public/textures/noise.png")}"); opacity: .3; mix-blend-mode: multiply; }
  .rule { height: 1px; background: rgba(107, 84, 51, .35); }
  .eyebrow { font-family: "Cormorant Garamond", Georgia, serif; letter-spacing: 5px; font-size: 10px; color: #8b6932; text-transform: uppercase; }
  /* cover */
  .cover { background: #120b07; color: #f1e3c7; }
  .cover-wall { position: absolute; inset: 0; background-image: url("${file("public/textures/wood-wall.jpg")}"); background-size: cover; filter: brightness(.55); }
  .cover-wash { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(10,6,4,.8), rgba(10,6,4,.38)), linear-gradient(180deg, rgba(10,6,4,.5), transparent 30%, rgba(10,6,4,.8)); }
  .cover-inner { position: relative; z-index: 2; padding: 34mm 26mm; height: 100%; display: flex; flex-direction: column; }
  .cover h1 { margin: 22mm 0 0; font-size: 92px; font-weight: 500; letter-spacing: 14px; line-height: 1; }
  .cover .sub { margin-top: 8mm; font-size: 21px; letter-spacing: 7px; color: #d8c19a; }
  .cover .tag { margin-top: 30mm; width: 62mm; height: 1px; background: #c9a86a; opacity: .7; }
  .cover .desc { margin-top: 8mm; font-size: 12px; line-height: 2.2; color: rgba(235,220,193,.68); max-width: 105mm; }
  .cover .foot { margin-top: auto; display: flex; justify-content: space-between; align-items: end; font-family: "Cormorant Garamond", Georgia, serif; font-size: 10px; letter-spacing: 3px; color: rgba(213,180,124,.6); }
  .seal { display: grid; place-items: center; width: 15mm; height: 15mm; border: 1px solid rgba(201,97,75,.7); color: #d47a63; font-size: 10px; letter-spacing: 2px; transform: rotate(3deg); }
  /* content */
  .inner { position: relative; z-index: 2; padding: 22mm 24mm; height: 100%; display: flex; flex-direction: column; }
  .head { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 4mm; border-bottom: 1px solid rgba(107,84,51,.28); }
  .head h2 { margin: 3mm 0 0; font-size: 30px; font-weight: 500; letter-spacing: 6px; }
  .head .no { font-family: "Cormorant Garamond", Georgia, serif; font-size: 22px; color: #9b7a47; }
  .body { margin-top: 12mm; font-size: 12px; line-height: 2.2; color: #51432f; }
  .body p { margin: 0 0 5mm; }
  .lead { font-size: 16px; line-height: 2; color: #2f261b; letter-spacing: 1px; }
  .shelves { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5mm; margin-top: 8mm; }
  .shelf { border: 1px solid rgba(107,84,51,.22); padding: 6mm 5mm; background: rgba(255,255,255,.18); }
  .shelf .num { font-family: "Cormorant Garamond", Georgia, serif; font-size: 20px; color: #9b7a47; }
  .shelf h3 { margin: 2mm 0; font-size: 16px; letter-spacing: 3px; font-weight: 500; }
  .shelf p { margin: 0; font-size: 10px; line-height: 1.9; color: #6b5a42; }
  .steps { margin-top: 8mm; display: flex; flex-direction: column; gap: 6mm; }
  .step { display: grid; grid-template-columns: 16mm 1fr; gap: 5mm; border-top: 1px solid rgba(107,84,51,.2); padding-top: 5mm; }
  .step .n { font-family: "Cormorant Garamond", Georgia, serif; font-size: 26px; color: #a3814b; }
  .step h3 { margin: 0 0 2mm; font-size: 15px; font-weight: 600; letter-spacing: 2px; }
  .step p { margin: 0; font-size: 10.5px; line-height: 2; color: #5c4b35; }
  code, pre { font-family: "SFMono-Regular", Menlo, monospace; }
  pre { margin: 3mm 0 0; padding: 4mm; background: #211a14; color: #e5d3b2; font-size: 9px; line-height: 1.9; white-space: pre-wrap; }
  .quote { margin-top: 16mm; padding: 8mm 0 8mm 7mm; border-left: 2px solid rgba(155,122,71,.5); font-size: 15px; line-height: 2.1; color: #5a452c; }
  .footpage { margin-top: auto; display: flex; justify-content: space-between; padding-top: 5mm; border-top: 1px solid rgba(107,84,51,.25); font-family: "Cormorant Garamond", Georgia, serif; font-size: 9px; letter-spacing: 2px; color: #8c765b; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 10mm; }
  .two h3 { font-size: 14px; font-weight: 600; margin: 0 0 3mm; }
  .two p { font-size: 10px; line-height: 2; color: #5c4b35; margin: 0 0 4mm; }
  .back { position: relative; background: #120b07; color: #d8c19a; }
  .back .inner { align-items: center; justify-content: center; text-align: center; }
  .back h2 { font-size: 26px; letter-spacing: 10px; color: #f0e1c5; margin: 0 0 10mm; }
  .back p { font-size: 11px; line-height: 2.2; color: rgba(232,217,190,.62); }
  .back .seal { margin-top: 18mm; color: #f0e1c5; border-color: rgba(201,97,75,.8); background: #9d3c31; }
</style></head><body>
  <section class="page cover">
    <div class="cover-wall"></div><div class="cover-wash"></div><div class="grain"></div>
    <div class="cover-inner">
      <div class="eyebrow">A SMALL BOOK ABOUT PUTTING BOOKS ON SHELVES</div>
      <h1>添书记</h1>
      <div class="sub">木间书斋 · 藏书手册</div>
      <div class="tag"></div>
      <div class="desc">一本关于怎样把书放上书架的小册子。也关于木头、纸页和光，以及一个书架怎样慢慢长成自己的样子。</div>
      <div class="foot"><span>THE WOODEN SHELF · 2026</span><span class="seal">木间</span></div>
    </div>
  </section>

  <section class="page">
    <div class="paper"></div><div class="grain"></div>
    <div class="inner">
      <div class="head"><div><div class="eyebrow">CHAPTER ONE</div><h2>三层书架</h2></div><span class="no">01</span></div>
      <div class="body">
        <p class="lead">书架不是仓库。它更像一张摊开的地图，告诉你一个人曾经在哪里停留。</p>
        <p>这间书房分三层：经典名著是经过时间挑选的旧书；当下热门是此刻正在被谈论的一本；我的作品放自己写下的字。每一层都不追求满，只留一点空位给下一本。</p>
        <div class="shelves">
          <div class="shelf"><div class="num">壹</div><h3>经典名著</h3><p>公版作品，收录导读与短书摘，并附上可读全文的去处。</p></div>
          <div class="shelf"><div class="num">贰</div><h3>当下热门</h3><p>最近值得被认真翻开的新书。热度会过去，问题会留下。</p></div>
          <div class="shelf"><div class="num">叁</div><h3>我的作品</h3><p>自己写的字。篇幅不大，但每一页都还带着灯下的温度。</p></div>
        </div>
        <div class="quote">“书不是用来读完的。它们只是在你需要的时候，刚好在伸手就能碰到的地方。”</div>
      </div>
      <div class="footpage"><span>木间书斋</span><span>01 / 03</span></div>
    </div>
  </section>

  <section class="page">
    <div class="paper"></div><div class="grain"></div>
    <div class="inner">
      <div class="head"><div><div class="eyebrow">CHAPTER TWO</div><h2>把书放上来</h2></div><span class="no">02</span></div>
      <div class="body">
        <p class="lead">添书可以只是一条命令，也可以是一次慢慢整理的过程。</p>
        <div class="steps">
          <div class="step"><span class="n">01</span><div><h3>用命令上架</h3><p>在项目根目录运行 <code>pnpm book:new</code>，按提示填写书名、作者、分类和文件路径。封面会自动生成。</p><pre>pnpm book:new</pre></div></div>
          <div class="step"><span class="n">02</span><div><h3>自己的作品：加 Markdown</h3><p>每本书一个文件夹，<code>book.yaml</code> 存元数据，<code>chapters/</code> 下按顺序放 Markdown 文件。</p><pre>src/content/library/own/my-book/
├── book.yaml
└── chapters/01.md</pre></div></div>
          <div class="step"><span class="n">03</span><div><h3>其他作品：PDF / EPUB / TXT</h3><p>加上 <code>--file</code> 指向本地文件。PDF 会放进站内翻阅页，EPUB 提供下载，TXT 会自动拆成章节。</p><pre>pnpm book:new -- --title "一本书" --author "作者" \\
  --category classics --file ./book.pdf</pre></div></div>
        </div>
      </div>
      <div class="footpage"><span>木间书斋 · 添书记</span><span>02 / 03</span></div>
    </div>
  </section>

  <section class="page">
    <div class="paper"></div><div class="grain"></div>
    <div class="inner">
      <div class="head"><div><div class="eyebrow">COLOPHON</div><h2>书的来处</h2></div><span class="no">03</span></div>
      <div class="body">
        <p class="lead">书架上的每一本书都保留它的来处。这比“看起来整齐”重要。</p>
        <div class="two">
          <div>
            <h3>关于收录</h3>
            <p>经典名著为公版作品，本站收录原创导读与短书摘，全文链接到可免费阅读的站点。</p>
            <p>《高性价比人生指南》全文来自 eternity4719/HowToLiveBetter，依 CC BY 4.0 许可收录并署名。</p>
          </div>
          <div>
            <h3>关于这本小册子</h3>
            <p>它本身也是一本用 PDF 上架的书，用来演示“其他作品”的添书流程。你可以把它替换成自己的作品。</p>
            <p>书架由 Astro 与 Tailwind CSS 搭建，木纹和纸纹来自本地生成，没有远程图片依赖。</p>
          </div>
        </div>
        <div class="quote">“一室木香，半架闲书。剩下的，交给时间。”</div>
      </div>
      <div class="footpage"><span>木间书斋 · 2026</span><span>03 / 03</span></div>
    </div>
  </section>

  <section class="page back">
    <div class="paper"></div><div class="grain"></div>
    <div class="inner">
      <div class="eyebrow">THE WOODEN SHELF</div>
      <h2>木间书斋</h2>
      <p>把读过的书，放在伸手就能碰到的地方。<br>也把没写完的字，慢慢写完。</p>
      <div class="seal">藏书</div>
    </div>
  </section>
</body></html>`;

import fs from "node:fs";
fs.mkdirSync(path.dirname(out), { recursive: true });
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
await browser.close();
console.log(`wrote ${out}`);
