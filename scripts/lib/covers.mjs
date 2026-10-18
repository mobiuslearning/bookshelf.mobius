/**
 * Tiny SVG cover generator shared by `make-covers.mjs` and `add-book.mjs`.
 * Covers are deliberately typographic: no external images, no font files.
 */
const P = 600;
const H = 900;
const CREAM = "#f1e6cd";
const GOLD = "#c9a86a";
const PAPER = "#efe6d2";
const INK = "#2a2823";

const esc = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function mix(hex, target, amount) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const out = a.map((channel, i) =>
    Math.round(channel + (b[i] - channel) * amount),
  );
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const vertical = (text, x, y, size, fill, options = {}) => {
  const {
    step = Math.round(size * 1.08),
    weight = 600,
    family = "'Songti SC','Noto Serif SC','Source Han Serif SC',serif",
    opacity = 1,
    anchor = "middle",
    letter = 0,
  } = options;
  const chars = [...text];
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}" letter-spacing="${letter}">${chars
    .map((char, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : step}">${esc(char)}</tspan>`)
    .join("")}</text>`;
};

const motif = (name, color, opacity = 0.28) => {
  const common = `fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"`;
  const groups = {
    moon: `
      <g ${common}>
        <circle cx="165" cy="230" r="78"/>
        <path d="M60 268c42-22 84-22 126 0M80 300c32-16 64-16 96 0M48 334c44-20 88-20 132 0"/>
        <circle cx="238" cy="158" r="4" fill="${color}" stroke="none"/>
        <circle cx="272" cy="212" r="2.5" fill="${color}" stroke="none"/>
      </g>`,
    mountain: `
      <g ${common}>
        <path d="M40 360l88-132 58 78 54-108 96 162"/>
        <path d="M24 398l58-62 44 38 32-42 52 66"/>
        <path d="M210 296l34-40 42 52" opacity="0.6"/>
      </g>`,
    wave: `
      <g ${common}>
        <path d="M24 300c42-34 84-34 126 0s84 34 126 0 84-34 126 0 84 34 126 0"/>
        <path d="M24 346c42-34 84-34 126 0s84 34 126 0 84-34 126 0 84 34 126 0" opacity="0.65"/>
        <path d="M24 392c42-34 84-34 126 0s84 34 126 0 84-34 126 0 84 34 126 0" opacity="0.4"/>
      </g>`,
    bamboo: `
      <g ${common}>
        <path d="M150 420V170M218 420V226"/>
        <path d="M150 372h68M150 310h68M150 248h52M218 352h58M218 292h48"/>
        <path d="M150 226c-32-38-58-22-46 4 10 22 34 18 46 8M150 300c30-34 58-16 46 8-10 20-32 16-46 6"/>
        <path d="M218 276c34-30 58-8 42 12-12 16-30 12-42 4"/>
      </g>`,
    cloud: `
      <g ${common}>
        <path d="M54 282c8-36 40-58 76-52 16-42 78-54 106-18 36-12 78 10 80 50 32 4 44 30 36 56"/>
        <path d="M92 328c94 22 226 18 330-12M124 366c70 16 174 14 248-4"/>
        <path d="M298 226c-20-18-16-44 6-52M328 226c22-16 24-40 4-52"/>
      </g>`,
    plum: `
      <g ${common}>
        <path d="M92 420c46-66 84-132 90-206M126 348c40-10 72-26 92-52M172 258c-28-6-46-22-56-44M238 214c24-8 42-24 52-46"/>
        <g fill="${color}" stroke="none">
          <circle cx="126" cy="300" r="9"/><circle cx="152" cy="276" r="7"/>
          <circle cx="206" cy="228" r="8"/><circle cx="252" cy="196" r="7"/>
          <circle cx="96" cy="344" r="6"/><circle cx="180" cy="252" r="5"/>
        </g>
      </g>`,
    lantern: `
      <g ${common}>
        <path d="M282 76v46M236 122h92M244 142c-20 46-20 96 0 142h76c20-46 20-96 0-142zM250 284h84M266 300l-8 38M298 300l8 38"/>
        <path d="M262 166h40M262 194h40M262 222h40" opacity="0.55"/>
        <path d="M282 352v26"/>
      </g>`,
    window: `
      <g ${common}>
        <rect x="96" y="140" width="196" height="220"/>
        <path d="M194 140v220M96 250h196M146 140v220M242 140v220"/>
        <path d="M76 386h236M116 360v26M276 360v26"/>
        <circle cx="306" cy="188" r="3" fill="${color}" stroke="none"/>
      </g>`,
    boat: `
      <g ${common}>
        <path d="M84 346h240l-30 54H116zM190 346V180l104 166M190 210l-58 78h58"/>
        <path d="M44 420c40-20 80-20 120 0s80 20 120 0 80-20 120 0 80 20 120 0"/>
        <path d="M70 300c26-12 52-12 78 0M392 260c22-10 44-10 66 0" opacity="0.55"/>
      </g>`,
    leaf: `
      <g ${common}>
        <path d="M120 420c40-90 92-166 170-228"/>
        <path d="M174 324c-42 2-70-20-72-56 40-6 66 14 72 56zM216 254c-30 4-56-12-62-44 34-6 56 12 62 44zM154 382c36-4 62-28 64-62-36 0-58 22-64 62z"/>
        <path d="M274 146c36 10 56 38 52 74-34-8-52-36-52-74z"/>
      </g>`,
    stack: `
      <g ${common}>
        <rect x="86" y="320" width="222" height="34" rx="4"/>
        <rect x="110" y="278" width="186" height="30" rx="4"/>
        <rect x="72" y="236" width="206" height="30" rx="4"/>
        <path d="M94 354v40M288 354v40M118 308v12M256 308v12"/>
        <path d="M330 220v188" stroke-dasharray="4 10"/>
      </g>`,
    grid: `
      <g ${common}>
        <path d="M60 170h480M60 246h480M60 322h480M60 398h480M132 120v320M228 120v320M324 120v320M420 120v320"/>
        <path d="M60 170l72-50M420 170l72-50" opacity="0.5"/>
      </g>`,
  };
  return groups[name] ?? groups.moon;
};

function cornerOrnaments(color) {
  return `
    <g stroke="${color}" stroke-width="1.5" fill="none" opacity="0.8">
      <path d="M52 92V52h40M508 52h40v40M548 808v40h-40M92 848H52v-40"/>
      <path d="M64 104V64h40M496 64h40v40M536 796v40h-40M104 836H64v-40" opacity="0.45"/>
      <path d="M300 44l8 8-8 8-8-8zM300 840l8 8-8 8-8-8z" fill="${color}" stroke="none"/>
    </g>`;
}

function classicCover(book) {
  const accent = book.accent || "#7c2f35";
  const dark = mix(accent, "#120d0a", 0.55);
  const light = mix(accent, "#e8c79a", 0.18);
  const title = [...book.title];
  const size = title.length > 5 ? 70 : title.length > 3 ? 84 : 100;
  const step = Math.round(size * 1.12);
  const titleHeight = (title.length - 1) * step;
  const startY = 300 - titleHeight / 2 + 34;
  const cloth = Array.from({ length: 34 }, (_, i) => {
    const y = 28 + i * 25;
    return `<path d="M28 ${y}H572" stroke="${mix(accent, "#ffffff", 0.08)}" stroke-width="0.6" opacity="0.12"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${P}" height="${H}" viewBox="0 0 ${P} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${light}"/>
      <stop offset="0.45" stop-color="${accent}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.18" r="0.9">
      <stop offset="0" stop-color="#ffe9c0" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ffe9c0" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="${P}" height="${H}" fill="url(#bg)"/>
  <g>${cloth}</g>
  <rect width="${P}" height="${H}" fill="url(#glow)"/>
  ${cornerOrnaments(GOLD)}
  <rect x="28" y="28" width="${P - 56}" height="${H - 56}" fill="none" stroke="${GOLD}" stroke-width="1.4" opacity="0.55"/>
  <rect x="38" y="38" width="${P - 76}" height="${H - 76}" fill="none" stroke="${GOLD}" stroke-width="0.7" opacity="0.4"/>
  ${motif(book.motif, GOLD, 0.3)}
  <text x="300" y="96" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-size="17" letter-spacing="7" fill="${GOLD}" opacity="0.9">木間書齋 · 藏本</text>
  ${vertical(book.title, 378, startY, size, CREAM, { step, weight: 600 })}
  ${vertical(book.author, 468, startY + titleHeight, 20, CREAM, { step: 24, weight: 400, opacity: 0.78 })}
  <g transform="translate(300 686)">
    <rect x="-34" y="-34" width="68" height="68" rx="3" fill="#9e3c32" opacity="0.92"/>
    <text x="0" y="4" text-anchor="middle" font-family="'Songti SC','Noto Serif SC',serif" font-size="30" fill="${CREAM}">藏</text>
  </g>
  <path d="M105 726h120" stroke="${GOLD}" stroke-width="0.8" opacity="0.65"/>
  <text x="105" y="756" font-family="'Cormorant Garamond',Georgia,serif" font-size="13" letter-spacing="4" fill="${CREAM}" opacity="0.7">THE WOODEN SHELF</text>
  <text x="105" y="790" font-family="'Songti SC','Noto Serif SC',serif" font-size="13" fill="${CREAM}" opacity="0.62">${esc(book.year || "")}</text>
  <rect width="${P}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  <rect width="${P}" height="${H}" fill="none" stroke="#000" stroke-width="18" opacity="0.12"/>
</svg>`;
}

function ownCover(book) {
  const accent = book.accent || "#6b6a3c";
  const title = [...book.title];
  const size = title.length > 5 ? 64 : 76;
  const step = Math.round(size * 1.15);
  const startY = 260;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${P}" height="${H}" viewBox="0 0 ${P} ${H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#f4eddd"/>
      <stop offset="0.6" stop-color="${PAPER}"/>
      <stop offset="1" stop-color="#e3d6bd"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.1"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="${P}" height="${H}" fill="url(#paper)"/>
  <rect width="${P}" height="${H}" fill="#fff" opacity="0.14"/>
  <rect width="${P}" height="${H}" filter="url(#grain)" opacity="0.65"/>
  <rect x="34" y="34" width="${P - 68}" height="${H - 68}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.35"/>
  <text x="300" y="88" text-anchor="middle" font-family="'Cormorant Garamond',Georgia,serif" font-size="16" letter-spacing="6" fill="${accent}" opacity="0.85">MY SHELF · 手稿</text>
  <path d="M92 112h160" stroke="${accent}" stroke-width="1" opacity="0.45"/>
  <path d="M92 112v520" stroke="${accent}" stroke-width="0.8" opacity="0.25"/>
  ${motif(book.motif, accent, 0.32)}
  ${vertical(book.title, 330, startY, size, INK, { step, weight: 500 })}
  ${vertical(book.subtitle || "", 402, startY + 66, 15, mix(accent, "#2a2823", 0.25), { step: 19, weight: 400, opacity: 0.85 })}
  <g transform="translate(476 742)">
    <rect x="-42" y="-42" width="84" height="84" rx="2" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.8"/>
    <text x="0" y="8" text-anchor="middle" font-family="'Songti SC','Noto Serif SC',serif" font-size="${[...(book.author || '山窗')].slice(0,2).join('').length > 2 ? 18 : 24}" fill="${accent}">${esc([...(book.author || '山窗')].slice(0,2).join(''))}</text>
  </g>
  <text x="96" y="782" font-family="'Songti SC','Noto Serif SC',serif" font-size="15" fill="${INK}" opacity="0.7">${esc(book.author || "")} 著</text>
  <text x="96" y="816" font-family="'Cormorant Garamond',Georgia,serif" font-size="13" letter-spacing="4" fill="${accent}" opacity="0.7">木間書齋 · ${esc(book.year || "")}</text>
  <rect width="${P}" height="${H}" fill="none" stroke="#000" stroke-width="14" opacity="0.07"/>
</svg>`;
}

function trendingCover(book) {
  const blue = book.accent || "#2f4a6d";
  const red = "#b04a35";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${P}" height="${H}" viewBox="0 0 ${P} ${H}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7f1e2"/>
      <stop offset="1" stop-color="#e8ddc4"/>
    </linearGradient>
    <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${mix(blue, "#ffffff", 0.12)}"/>
      <stop offset="1" stop-color="${mix(blue, "#0b1420", 0.22)}"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.07"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="${P}" height="${H}" fill="url(#paper)"/>
  <rect width="${P}" height="${H}" filter="url(#grain)" opacity="0.6"/>
  <rect x="0" y="0" width="${P}" height="96" fill="${blue}"/>
  <text x="44" y="60" font-family="'Cormorant Garamond',Georgia,serif" font-size="17" letter-spacing="5" fill="#f2e8d4">NOW · 2026</text>
  <text x="556" y="60" text-anchor="end" font-family="'Songti SC','Noto Serif SC',serif" font-size="15" fill="#f2e8d4" opacity="0.8">新书上架</text>
  <g transform="translate(48 138)">
    <text font-family="'Songti SC','Noto Serif SC',serif" font-size="92" font-weight="700" fill="${blue}">
      <tspan x="0" y="0">高性价比</tspan>
      <tspan x="0" y="106">人生指南</tspan>
    </text>
  </g>
  <rect x="48" y="300" width="88" height="5" fill="${red}"/>
  <text x="48" y="352" font-family="'Songti SC','Noto Serif SC',serif" font-size="20" fill="${mix(blue, "#000000", 0.1)}">用最少的钱、时间和精力</text>
  <text x="48" y="386" font-family="'Songti SC','Noto Serif SC',serif" font-size="20" fill="${mix(blue, "#000000", 0.1)}">换回最多的寿命、金钱和自由</text>
  <g font-family="'IBM Plex Mono','Songti SC',monospace" font-size="13" fill="${blue}">
    <rect x="48" y="444" width="142" height="34" rx="17" fill="none" stroke="${blue}" stroke-width="1" opacity="0.45"/>
    <text x="119" y="466" text-anchor="middle">765 条建议</text>
    <rect x="204" y="444" width="150" height="34" rx="17" fill="none" stroke="${blue}" stroke-width="1" opacity="0.45"/>
    <text x="279" y="466" text-anchor="middle">31 节 · 全文</text>
    <rect x="368" y="444" width="132" height="34" rx="17" fill="none" stroke="${blue}" stroke-width="1" opacity="0.45"/>
    <text x="434" y="466" text-anchor="middle">CC BY 4.0</text>
  </g>
  <g transform="translate(48 560)">
    <rect width="504" height="150" fill="${blue}"/>
    <text x="26" y="46" font-family="'Songti SC','Noto Serif SC',serif" font-size="18" fill="#f2e8d4" opacity="0.75">一本可以随时翻查的</text>
    <text x="26" y="86" font-family="'Songti SC','Noto Serif SC',serif" font-size="34" font-weight="600" fill="#f2e8d4">日常决策手册</text>
    <text x="26" y="120" font-family="'Cormorant Garamond',Georgia,serif" font-size="13" letter-spacing="3" fill="#f2e8d4" opacity="0.7">A FIELD GUIDE TO A BETTER LIFE</text>
  </g>
  <text x="48" y="790" font-family="'Songti SC','Noto Serif SC',serif" font-size="17" fill="${blue}">eternity4719 著</text>
  <text x="48" y="824" font-family="'Cormorant Garamond',Georgia,serif" font-size="13" letter-spacing="4" fill="${blue}" opacity="0.65">THE WOODEN SHELF · 木間書齋</text>
  <g transform="translate(512 782)">
    <rect x="-30" y="-30" width="60" height="60" fill="${red}"/>
    <text x="0" y="8" text-anchor="middle" font-family="'Songti SC','Noto Serif SC',serif" font-size="26" fill="#f7f1e2">热</text>
  </g>
  <rect width="${P}" height="${H}" fill="none" stroke="#000" stroke-width="14" opacity="0.08"/>
</svg>`;
}

export function renderCover(book) {
  if (book.category === "trending") return trendingCover(book);
  if (book.category === "own") return ownCover(book);
  return classicCover(book);
}
