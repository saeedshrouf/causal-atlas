// Lucide icons, ISC license. See licenses/Lucide-ISC.txt.
const paths = {
  "arrow-right": [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "m12 5 7 7-7 7" }],
  ],
  search: [
    ["path", { d: "m21 21-4.34-4.34" }],
    ["circle", { cx: "11", cy: "11", r: "8" }],
  ],
  "sliders-horizontal": [
    ["path", { d: "M10 5H3" }],
    ["path", { d: "M12 19H3" }],
    ["path", { d: "M14 3v4" }],
    ["path", { d: "M16 17v4" }],
    ["path", { d: "M21 12h-9" }],
    ["path", { d: "M21 19h-5" }],
    ["path", { d: "M21 5h-7" }],
    ["path", { d: "M8 10v4" }],
    ["path", { d: "M8 12H3" }],
  ],
  "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
  plus: [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M12 5v14" }],
  ],
};

export function renderIcons(root) {
  const ns = "http://www.w3.org/2000/svg";
  for (const placeholder of root.querySelectorAll("[data-lucide]")) {
    const icon = paths[placeholder.dataset.lucide];
    if (!icon) continue;
    const svg = document.createElementNS(ns, "svg");
    for (const [key, value] of Object.entries({
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    }))
      svg.setAttribute(key, value);
    for (const [tag, attrs] of icon) {
      const element = document.createElementNS(ns, tag);
      for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
      svg.append(element);
    }
    placeholder.replaceWith(svg);
  }
}
