import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, resolve } from "node:path";
import { config } from "../site.config.js";
import { matchRecord } from "../assets/js/search.js";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(new URL("../data/catalog.json", import.meta.url)));
const coreCount = catalog.records.filter((record) => record.role === "core").length;
const resultCount = (filters = {}, adjacent = false) => {
  const count = catalog.records.filter((record) => (adjacent || record.role === "core") && matchRecord(record, filters)).length;
  return `${count} dataset${count === 1 ? "" : "s"}`;
};
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  ).replace(/^\/catalog/, "");
  const file = resolve(
    root,
    "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
  );
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "text/plain" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/catalog/`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: process.env.CHROMIUM_EXECUTABLE_PATH
    ? ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    : [],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.locator("[data-record]").first().waitFor();
  assert.equal(await page.locator("[data-result-count]").innerText(), resultCount());
  assert((await page.locator(".ca-footer").innerText()).includes("Saeed Shrouf"));
  assert((await page.locator("[data-catalog-summary]").textContent()).includes(
    `${catalog.records.length} records, of which ${coreCount}`));
  assert.equal(await page.locator("[data-property-count]").textContent(), String(Object.keys(catalog.vocabulary.fields).length));
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.equal(await page.locator(".ca-filter-hint").count(), 0);
  await page.locator("[data-theme-toggle]").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload();
  await page.locator("[data-record]").first().waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.evaluate(() => window.scrollTo(0, 500));
  assert(Math.abs((await page.locator(".ca-header").boundingBox()).y) < 1);
  await page.locator('[data-popover="origin"]').click();
  assert((await page.locator(".ca-popover").boundingBox()).y >= 92);
  await page.keyboard.press("Escape");
  await page.locator("[data-theme-toggle]").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  const filter = async (key, value) => {
    await page.locator(`[data-popover="${key}"]`).click();
    await page.locator(`[data-key="${key}"][data-value="${value}"]`).click();
  };
  await filter("tasks", "discovery");
  await filter("origin", "measured");
  await filter("reference_query", "empirical_graph");
  assert.equal(await page.locator("[data-result-count]").innerText(), resultCount({ tasks: "discovery", origin: "measured", reference_query: "empirical_graph" }));
  await page.locator("[data-clear-tags]").click();
  await page.locator("#ca-name-search").fill("ACTG");
  const toggle = page.locator(".ca-title [data-expand]");
  await page.locator(".ca-reference").click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert(!(await page.locator(".ca-details").innerText()).includes("·"));
  await page.locator(".atlas-provenance summary").click();
  await page.locator("[data-source-property]").selectOption("tasks");
  assert(
    (await page.locator("[data-source-content] a").getAttribute("href")).includes(
      "8813038",
    ),
  );
  await page.locator("[data-source-property]").selectOption("origin");
  assert(
    (await page.locator("[data-source-content] a").getAttribute("href")).includes(
      "archive.ics.uci.edu",
    ),
  );
  await page.locator(".ca-property-tag").first().click();
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.locator("#ca-name-search").fill("causaLens");
  assert.equal(await page.locator("[data-result-count]").innerText(), "1 dataset");
  await filter("reference_query", "model_graph");
  await page.locator(".ca-row-open").click();
  assert.equal(await page.locator("[data-scope]").inputValue(), "author_example_full_time");
  assert((await page.locator(".ca-details").innerText()).includes("generator was not run"));
  await page.locator("[data-scope]").selectOption("author_example_summary");
  assert(await page.locator(".atlas-scope-note").isVisible());
  await page.locator("[data-clear-tags]").click();
  await page.locator("#ca-name-search").fill("Coat MNAR");
  assert((await page.locator(".ca-provider-links a").first().getAttribute("href")).endsWith("coat.zip"));
  await page.locator(".ca-row-open").click();
  await page.locator("[data-scope]").selectOption("randomized_test");
  assert((await page.locator(".atlas-properties").first().innerText()).includes("Evaluation"));
  await page.locator("#ca-name-search").fill("Learning Mindsets");
  await page.locator(".ca-row-open").click();
  assert(await page.getByText("Use is limited to evaluating treatment-effect methods.", { exact: false }).isVisible());
  await page.locator("#ca-name-search").fill("LUCAS2");
  assert.equal(await page.locator("[data-result-count]").innerText(), "1 dataset");
  await page.locator(".ca-row-open").click();
  await page.locator("[data-scope]").selectOption("lucas2");
  assert((await page.locator(".ca-details").innerText()).includes("test labels are absent"));
  await page.locator("#ca-name-search").fill("NetSim");
  await page.locator(".ca-row-open").click();
  assert((await page.locator(".ca-details").innerText()).includes("underlying neuronal network"));
  await page.locator("#ca-name-search").fill("Feedback-Discovery");
  const feedback = page.locator('[data-record="feedback_simple_networks"]');
  await feedback.locator(".ca-row-open").click();
  await feedback.locator("[data-scope]").selectOption("concatenated");
  assert((await feedback.locator(".ca-details").innerText()).includes("simulated BOLD signals"));
  await page.locator("#ca-name-search").fill("lt_crl_benchmark_v1");
  await filter("reference_query", "model_graph");
  await page.locator(".ca-row-open").click();
  assert.equal(await page.locator("[data-scope]").inputValue(), "buchholz_1");
  await page.locator("[data-scope]").selectOption("");
  assert(await page.locator(".atlas-scope-note").isVisible());
  await page.locator(".ca-guide-button").click();
  await page.locator("#ca-definition-select").selectOption("pairing");
  assert(
    (await page.locator(".ca-definition-copy").innerText()).includes(
      "Same-unit simulated worlds",
    ),
  );
  await page.locator("#ca-definition-select").selectOption("treatment_support");
  assert((await page.locator(".ca-definition-copy").innerText()).includes("Ordered discrete"));
  await page.locator("#ca-state-tab").click();
  await page.keyboard.press("ArrowLeft");
  assert(await page.locator("#ca-def-panel").isVisible());
  await page.keyboard.press("Escape");
  assert(
    await page.locator(".ca-guide-button").evaluate((e) => e === document.activeElement),
  );
  await page.locator("[data-clear-tags]").click();
  await page.locator("#ca-name-search").fill("");
  await page.locator('[data-popover="advanced"]').click();
  await page.locator("[data-adjacent]").check();
  await page.locator("[data-close-popover]").click();
  assert.equal(await page.locator("[data-result-count]").innerText(), resultCount({}, true));
  while (await page.locator("[data-more]").isVisible())
    await page.locator("[data-more] button").click();
  assert.equal(await page.locator("[data-record]").count(), catalog.records.length);
  // Render every scope and provenance field to catch record-specific failures.
  await page.evaluate(() => {
    document.querySelectorAll(".ca-row-open").forEach((button) => button.click());
    document.querySelectorAll("[data-source-property]").forEach((select) => {
      for (const option of select.options) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    document.querySelectorAll("[data-scope]").forEach((select) => {
      const id = select.dataset.scope,
        values = [...select.options].map((option) => option.value);
      for (const value of values) {
        const current = document.querySelector(`[data-scope="${id}"]`);
        current.value = value;
        current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
  await page.reload();
  await page.locator("[data-record]").first().waitFor();
  for (const width of [320, 390, 768, 1024, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const panel of ["datasets", "methodology"]) {
      await page.locator(`[data-page="${panel}"]`).click();
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${panel} overflows at ${width}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-page="datasets"]').click();
  await page.locator("[data-mobile-filters]").click();
  await filter("tasks", "effect_estimation");
  assert.equal(await page.locator("[data-result-count]").innerText(), resultCount({ tasks: "effect_estimation" }));
  await page.locator("[data-clear-tags]").click();
  await page.locator("#ca-name-search").fill("Learning Mindsets");
  await page.locator(".ca-row-open").click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert(await page.getByText("Use is limited to evaluating treatment-effect methods.", { exact: false }).isVisible());
  }
  for (const name of ["BEELINE / GSD", "TCGA / Perfect Match", "Population-threshold RDD / France", "Human es-fMRI", "SynTReN"]) {
    await page.locator("#ca-name-search").fill(name);
    assert.equal(await page.locator("[data-record]").count(), 1, name);
    await page.locator(".ca-row-open").first().click();
    const row = page.locator("[data-record]").first();
    const selector = row.locator("[data-scope]");
    const values = await selector.count()
      ? await selector.locator("option").evaluateAll((options) => options.map((option) => option.value))
      : [null];
    for (const value of values) {
      if (value !== null) await selector.selectOption(value);
      await row.locator(".atlas-further").evaluate((element) => { element.open = true; });
      await row.locator(".atlas-provenance").evaluate((element) => { element.open = true; });
      assert(!(await row.innerText()).includes("undefined"), name);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}/${value} overflows`);
    }
  }
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.locator("#ca-name-search").fill("");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(process.env.SCREENSHOT_DIR, "desktop.png"), animations: "disabled" });
    await page.locator("#ca-name-search").fill("BEELINE");
    await page.locator(".ca-row-open").first().click();
    await page.evaluate(() => window.scrollTo(0, 280));
    await page.screenshot({ path: resolve(process.env.SCREENSHOT_DIR, "details.png"), animations: "disabled" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-theme-toggle]").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(process.env.SCREENSHOT_DIR, "mobile-dark.png"), animations: "disabled" });
  }
  for (const response of [
    { status: 503, body: "Unavailable" },
    { status: 200, contentType: "application/json", body: "invalid JSON" },
  ]) {
    const unavailable = await browser.newPage();
    await unavailable.route("**/data/catalog.json", (route) => route.fulfill(response));
    await unavailable.goto(base);
    await unavailable.locator('[data-results] [role="alert"]').waitFor();
    await unavailable.locator('[data-page="methodology"]').click();
    assert(await unavailable.locator('[data-panel="methodology"]').isVisible());
    assert((await unavailable.locator(".ca-footer").innerText()).includes("Repository"));
    await unavailable.locator("[data-theme-toggle]").click();
    assert.equal(await unavailable.locator("html").getAttribute("data-theme"), "dark");
    await unavailable.locator('[data-page="datasets"]').click();
    assert(await unavailable.locator('[data-results] [role="alert"]').isVisible());
    await unavailable.close();
  }
  const offline = await browser.newPage();
  offline.on("pageerror", (error) => errors.push(error.message));
  await offline.context().setOffline(true);
  await offline.goto(new URL(`../dist/Causal_Atlas_v${config.version}_Preview.html`, import.meta.url).href);
  await offline.locator("[data-record]").first().waitFor();
  assert.equal(await offline.locator("[data-result-count]").innerText(), resultCount());
  await offline.locator('[data-page="methodology"]').click();
  assert(await offline.locator('[data-panel="methodology"]').isVisible());
  assert((await offline.locator(".ca-footer").innerText()).includes(`v${config.version}`));
  assert.deepEqual(errors, []);
  console.log(
    "Browser review passed: all records and configurations, citations, filters, guide, 320–1920px layouts, standalone offline preview.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
