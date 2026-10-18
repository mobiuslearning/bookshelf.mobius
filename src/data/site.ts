export const site = {
  name: "木间书斋",
  nameEn: "THE WOODEN SHELF",
  tagline: "一室木香，半架闲书",
  description:
    "一间用木头、纸页和光搭起来的私人书房。收藏经典名著、当下热门，也放自己写的字。",
  url: "https://wooden-shelf.example.com",
  author: "木间主人",
  email: "hello@example.com",
  startYear: 2026,
  social: {
    github: "https://github.com/",
    rss: "/rss.xml",
  },
};

export const categories = [
  {
    key: "classics",
    label: "经典名著",
    labelEn: "CLASSICS",
    numeral: "壹",
    subtitle: "被时间读过的书，值得再读一遍。",
    description:
      "经过时间淘洗的旧书。它们不急，等你把日子过慢一点，再翻开。",
    accent: "#9f3f36",
  },
  {
    key: "trending",
    label: "当下热门",
    labelEn: "NOW",
    numeral: "贰",
    subtitle: "此刻被反复谈起的一本书。",
    description:
      "热度会过去，问题会留下。这里放最近值得被认真翻开的新书。",
    accent: "#36557a",
  },
  {
    key: "own",
    label: "我的作品",
    labelEn: "MY SHELF",
    numeral: "叁",
    subtitle: "自己写的字，还带着灯下的温度。",
    description:
      "自己写的字。篇幅不大，但每一页都还带着灯下的温度。",
    accent: "#6b6a3c",
  },
] as const;

export type CategoryKey = (typeof categories)[number]["key"];

export const categoryMap = Object.fromEntries(
  categories.map((category) => [category.key, category]),
) as Record<CategoryKey, (typeof categories)[number]>;

export const categoryOrder = categories.map((category) => category.key);

export const navLinks = [
  { label: "书架", href: "/#shelf" },
  { label: "关于", href: "/about" },
  { label: "添书", href: "/about#add-book" },
];
