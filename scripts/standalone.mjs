import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { config } from "../site.config.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
let page = await read("index.html");
let css = await read("assets/styles.css");
const fonts = [...css.matchAll(/url\(["']?(fonts\/[^)"']+)["']?\)/g)];
for (const [url, path] of fonts) {
  assert(path.endsWith(".woff2"), `Unexpected font format: ${path}`);
  const bytes = await readFile(new URL(`assets/${path}`, root));
  css = css.replace(url, `url("data:font/woff2;base64,${bytes.toString("base64")}")`);
}
assert(!/url\((?!["']?data:)/.test(css), "Preview has an external CSS asset");

const bundle = await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ["assets/js/app.js"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: "es2022",
  define: { "import.meta.url": "document.baseURI" },
});
const script = bundle.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const catalog = JSON.stringify(JSON.parse(await read("data/catalog.json"))).replace(/</g, "\\u003c");
const theme = await read("assets/js/theme.js");
const notices = await Promise.all((await readdir(new URL("licenses/", root))).sort()
  .filter((name) => name.endsWith(".txt")).map((name) => read(`licenses/${name}`)));

function replaceOnce(from, to) {
  assert.equal(page.split(from).length, 2, `Expected one ${from}`);
  page = page.replace(from, () => to);
}

replaceOnce('<link rel="stylesheet" href="assets/styles.css" />', `<style>${css}</style>`);
replaceOnce('<script src="assets/js/theme.js"></script>', `<script>${theme}</script>`);
replaceOnce('<script type="module" src="assets/js/app.js"></script>', "");
replaceOnce("</body>", `<script type="application/json" id="catalog-data">${catalog}</script>
<script>${script}</script>
<!-- Third-party asset licenses
${notices.join("\n\n")}
-->
</body>`);
const output = new URL(`dist/Causal_Atlas_v${config.version}_Preview.html`, root);
await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(output, page);
console.log(fileURLToPath(output));
