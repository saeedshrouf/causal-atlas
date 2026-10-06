import { config } from "../../site.config.js";
import { matchRecord, matchesName } from "./search.js";
import { esc, label, html } from "./text.js";
import { createCatalogView } from "./catalog-view.js";
import { renderIcons } from "./icons.js";
import { mountGuide } from "./guide.js";
import { mountFooter } from "./footer.js";
import { mountNavigation } from "./navigation.js";
import { primaryFilters, advancedFilters } from "./presentation.js";

async function start(root) {
  const embedded = document.getElementById("catalog-data");
  const response = embedded
    ? null
    : await fetch(new URL("../../data/catalog.json", import.meta.url));
  if (response && !response.ok) throw new Error("Catalog request failed");
  const data = embedded ? JSON.parse(embedded.textContent) : await response.json();
  const { sourcePropertyHTML, detailHTML, rowHTML } =
    createCatalogView(data);

  const vocab = data.vocabulary.fields;
  const records = data.records.slice().sort((a, b) =>
    a.title.localeCompare(b.title, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
  const q = (s) => root.querySelector(s);

  const facets = primaryFilters.map((filter) => ({
    ...filter,
    title: filter.title || vocab[filter.key].label,
    values: filter.values || vocab[filter.key].allowed_values,
  }));
  const advanced = advancedFilters;
  const coreCount = records.filter((record) => record.role === "core").length;
  q("[data-catalog-summary]").textContent = `The current catalogue contains ${records.length} records, of which ${coreCount} form the core collection and ${records.length - coreCount} are designated as adjacent resources. `;
  q("[data-property-count]").textContent = Object.keys(vocab).length;
  const expanded = new Map();
  let filters = {},
    search = "",
    includeAdjacent = false,
    limit = 8,
    matches = [],
    activePopover = null,
    firstRender = true;
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const icons = () => renderIcons(root);
  const motion = (el, keyframes, options = {}) =>
    reduced.matches
      ? null
      : el.animate(keyframes, {
          duration: 220,
          easing: "cubic-bezier(.2,.8,.2,1)",
          ...options,
        });
  const emptyLabels = Object.fromEntries(facets.map((filter) => [filter.key, filter.empty]));
  q("[data-facets]").innerHTML =
    facets
      .map(
        (f) => html`
          <button
            type="button"
            class="ca-facet-trigger"
            data-popover="${f.key}"
            aria-controls="ca-filter-options"
            aria-expanded="false"
            data-active="false"
          >
            <span class="ca-field-label">${esc(f.title)}</span>
            <span class="ca-field-value">${emptyLabels[f.key]}</span>
            <i data-lucide="chevron-down" aria-hidden="true"></i>
          </button>
        `,
      )
      .join("") +
    '<button type="button" class="ca-facet-trigger" data-popover="advanced" aria-controls="ca-filter-options" aria-expanded="false" data-active="false"><span>More properties</span><i data-lucide="plus" aria-hidden="true"></i></button>';
  function eligible(r) {
    return (
      (includeAdjacent || r.role === "core") &&
      matchesName(r, search)
    );
  }
  function optionCount(k, v) {
    return records.filter(
      (r) => eligible(r) && matchRecord(r, { ...filters, [k]: v }, true),
    ).length;
  }
  function positionPopover() {
    if (!activePopover) return;
    const button = q(`[data-popover="${activePopover}"]`);
    const panel = q(".ca-popover");
    const bounds = button.getBoundingClientRect();
    const ceiling = q(".ca-header").getBoundingClientRect().bottom + 8;
    panel.style.maxHeight = Math.max(100, innerHeight - ceiling - 16) + "px";
    panel.style.left =
      Math.max(16, Math.min(bounds.left, innerWidth - panel.offsetWidth - 16)) + "px";
    panel.style.top =
      Math.max(
        ceiling,
        Math.min(bounds.bottom + 8, innerHeight - panel.offsetHeight - 16),
      ) + "px";
    panel.style.setProperty("--menu-top", panel.style.top);
  }
  function renderPopover() {
    if (!activePopover) return;
    const panel = q(".ca-popover");
    panel.classList.toggle("advanced", activePopover === "advanced");
    if (activePopover === "advanced") {
      panel.innerHTML =
        '<div class="ca-popover-heading"><span>More filters</span><button type="button" data-close-popover>Done</button></div><div class="ca-advanced-grid">' +
        advanced
          .map(
            (k) => html`
              <label>
                ${esc(vocab[k].label)}
                <select data-select="${k}">
                  <option value="">Any</option>
                  ${vocab[k].allowed_values
                    .map(
                      (v) => html`
                        <option value="${esc(v)}" ${filters[k] === v ? "selected" : ""}>
                          ${esc(label(v))}
                        </option>
                      `,
                    )
                    .join("")}
                </select>
              </label>
            `,
          )
          .join("") +
        html`</div><label class="ca-check"><input type="checkbox" data-adjacent ${includeAdjacent ? "checked" : ""}> Include adjacent robustness datasets</label>`;
    } else {
      const f = facets.find((x) => x.key === activePopover);
      panel.innerHTML =
        html`
          <div class="ca-popover-heading">
            <span>${esc(f.title)}</span>
            <button type="button" data-clear-facet="${f.key}">
              Clear
            </button>
          </div>
        ` +
        f.values
          .map(
            (v) => html`
              <button
                type="button"
                class="ca-popover-option"
                data-key="${f.key}"
                data-value="${esc(v)}"
                aria-pressed="${filters[f.key] === v}"
              >
                <span>${esc(label(v))}</span>
                <span class="ca-option-count">${optionCount(f.key, v)}</span>
              </button>
            `,
          )
          .join("");
    }
    positionPopover();
  }
  function closePopover(returnFocus = false) {
    if (!activePopover) return;
    const button = q(`[data-popover="${activePopover}"]`);
    activePopover = null;
    q(".ca-popover").hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus({ preventScroll: true });
  }
  function openPopover(key) {
    if (activePopover === key) {
      closePopover(true);
      return;
    }
    closePopover();
    activePopover = key;
    const panel = q(".ca-popover");
    panel.hidden = false;
    renderPopover();
    q(`[data-popover="${key}"]`).setAttribute("aria-expanded", "true");
    motion(
      panel,
      [
        { transform: "translateY(-5px) scale(.985)" },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: 170 },
    );
    panel.querySelector("button").focus({ preventScroll: true });
  }
  function renderResults() {
    q("[data-result-count]").textContent =
      `${matches.length} dataset${matches.length === 1 ? "" : "s"}`;
    const keys = Object.keys(filters),
      chips = q("[data-selections]");
    chips.hidden = !keys.length;
    chips.innerHTML =
      keys
        .map(
          (k) => html`
            <button
              type="button"
              class="ca-selection"
              data-remove="${k}"
              aria-label="Remove ${esc(label(filters[k]))} filter"
            >
              ${esc(label(filters[k]))}
              <span aria-hidden="true">×</span>
            </button>
          `,
        )
        .join("") +
      (keys.length
        ? '<button type="button" class="ca-text-button" data-clear-tags>Clear all</button>'
        : "");
    const container = q("[data-results]"),
      oldNodes = new Map(
        [...container.querySelectorAll("[data-record]")].map((el) => [
          el.dataset.record,
          el,
        ]),
      );
    const positions = new Map(
      [...oldNodes].map(([id, el]) => [id, el.getBoundingClientRect().top]),
    );
    const fragment = document.createDocumentFragment();
    for (const { r, m } of matches.slice(0, limit)) {
      const el = oldNodes.get(r.id) || document.createElement("article"),
        signature = m.profile_id || "base";
      if (!oldNodes.has(r.id) || el.dataset.signature !== signature) {
        el.className = "ca-record";
        el.dataset.record = r.id;
        el.dataset.signature = signature;
        el.innerHTML = rowHTML(r, m);
      }
      if (!expanded.has(r.id)) {
        el.classList.remove("open");
        el.querySelector(".ca-row-open").setAttribute(
          "aria-label",
          `Open details: ${r.title}`,
        );
        el.querySelectorAll("[data-expand]").forEach((b) =>
          b.setAttribute("aria-expanded", "false"),
        );
        el.querySelector(".ca-visually-hidden").textContent = "Open dataset details";
        el.querySelector(".ca-detail-wrap")
          .getAnimations()
          .forEach((a) => a.cancel());
        el.querySelector(".ca-detail-wrap").hidden = true;
        el.querySelector(".ca-details").innerHTML = "";
      }
      fragment.append(el);
    }
    container.replaceChildren(fragment);
    if (!matches.length)
      container.innerHTML =
        '<div class="ca-empty"><p>No datasets match these filters.</p><p class="atlas-subtle">Try removing a tag or changing the name search.</p><button type="button" class="ca-chip" data-reset>Reset filters and search</button></div>';
    icons();
    if (!firstRender) {
      for (const el of container.querySelectorAll("[data-record]")) {
        const oldTop = positions.get(el.dataset.record),
          top = el.getBoundingClientRect().top;
        if (oldTop !== undefined && Math.abs(oldTop - top) > 1)
          motion(el, [
            { transform: `translateY(${oldTop - top}px)` },
            { transform: "translateY(0)" },
          ]);
        else if (oldTop === undefined)
          motion(el, [
            { opacity: 0, transform: "translateY(7px)" },
            { opacity: 1, transform: "translateY(0)" },
          ]);
      }
    }
    firstRender = false;
    q("[data-more]").hidden = matches.length <= limit;
    q("[data-more] button").textContent =
      `Show ${Math.min(8, matches.length - limit)} more`;
  }
  function update() {
    matches = records.flatMap((r) => {
      if (!eligible(r)) return [];
      const m = matchRecord(r, filters, true);
      return m ? [{ r, m }] : [];
    });
    root
      .querySelectorAll("[data-key]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(filters[b.dataset.key] === b.dataset.value),
        ),
      );
    root
      .querySelectorAll("[data-popover]")
      .forEach(
        (b) =>
          (b.dataset.active = String(
            b.dataset.popover === "advanced"
              ? advanced.some((k) => filters[k]) || includeAdjacent
              : !!filters[b.dataset.popover],
          )),
      );
    root.querySelectorAll("[data-popover]").forEach((b) => {
      const k = b.dataset.popover;
      if (k !== "advanced")
        b.querySelector(".ca-field-value").textContent = filters[k]
          ? label(filters[k])
          : emptyLabels[k];
    });
    renderResults();
  }
  function changed() {
    limit = 8;
    expanded.clear();
    update();
  }
  function expandRecord(id) {
    const hit = matches.find((x) => x.r.id === id),
      el = q(`[data-record="${id}"]`),
      area = el.querySelector(".ca-detail-wrap"),
      content = el.querySelector(".ca-details"),
      button = el.querySelector("[data-expand]");
    const opening = !expanded.has(id);
    area.getAnimations().forEach((a) => a.cancel());
    if (opening) {
      expanded.set(id, hit.m.profile_id || "");
      content.innerHTML = detailHTML(hit.r, hit.m, expanded.get(hit.r.id) || "");
      area.hidden = false;
      motion(
        area,
        [
          { height: "0px", opacity: 0.4 },
          { height: area.scrollHeight + "px", opacity: 1 },
        ],
        { duration: 280 },
      );
    } else {
      expanded.delete(id);
      const a = motion(
        area,
        [
          { height: area.scrollHeight + "px", opacity: 1 },
          { height: "0px", opacity: 0 },
        ],
        { duration: 200 },
      );
      const finish = () => {
        if (!expanded.has(id)) {
          area.hidden = true;
          content.innerHTML = "";
        }
      };
      if (a) a.onfinish = finish;
      else finish();
    }
    el.classList.toggle("open", opening);
    el.querySelectorAll("[data-expand]").forEach((x) =>
      x.setAttribute("aria-expanded", String(opening)),
    );
    el.querySelector(".ca-row-open").setAttribute(
      "aria-label",
      `${opening ? "Close" : "Open"} details: ${hit.r.title}`,
    );
    button.querySelector(".ca-detail-word").textContent = opening ? "Close" : "Details";
    button.querySelector(".ca-visually-hidden").textContent = opening
      ? "Close dataset details"
      : "Open dataset details";
  }
  root.addEventListener("click", (e) => {
    const row = e.target.closest("[data-record]");
    if (
      row &&
      !e.target.closest("a,button,select,input,label,summary,details,.ca-detail-wrap") &&
      !window.getSelection()?.toString()
    ) {
      expandRecord(row.dataset.record);
      return;
    }

    const b = e.target.closest("button");
    if (!b || !root.contains(b)) return;
    if (b.dataset.popover) openPopover(b.dataset.popover);
    if (b.hasAttribute("data-mobile-filters")) {
      const body = q(".ca-filter-body");
      body.hidden = !body.hidden;
      b.setAttribute("aria-expanded", String(!body.hidden));
      closePopover();
    }
    if (b.dataset.key) {
      const k = b.dataset.key,
        v = b.dataset.value;
      if (filters[k] === v) delete filters[k];
      else filters[k] = v;
      closePopover(true);
      changed();
    }
    if (b.dataset.clearFacet) {
      delete filters[b.dataset.clearFacet];
      closePopover(true);
      changed();
    }
    if (b.hasAttribute("data-close-popover")) closePopover(true);
    if (b.dataset.remove) {
      delete filters[b.dataset.remove];
      changed();
    }
    if (b.hasAttribute("data-clear-tags")) {
      filters = {};
      changed();
    }
    if (b.hasAttribute("data-reset")) {
      filters = {};
      search = "";
      includeAdjacent = false;
      q("#ca-name-search").value = "";
      closePopover();
      changed();
    }
    if (b.dataset.expand) expandRecord(b.dataset.expand);
    if (b.closest("[data-more]")) {
      limit += 8;
      renderResults();
    }
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activePopover) {
      e.preventDefault();
      closePopover(true);
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (
      activePopover &&
      !q(".ca-popover").contains(e.target) &&
      !e.target.closest("[data-popover]")
    )
      closePopover();
  });
  q("#ca-name-search").addEventListener("input", (e) => {
    search = e.target.value.trim();
    closePopover();
    changed();
  });
  root.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches("[data-source-property]")) {
      const r = records.find((r) => r.id === el.dataset.sourceProperty),
        selected = expanded.get(r.id) || "",
        profile = r.profiles.find((p) => p.id === selected),
        p = profile ? profile.properties : r.properties;
      el.closest(".atlas-provenance").querySelector("[data-source-content]").innerHTML =
        sourcePropertyHTML(el.value, p[el.value]);
    }
    if (el.matches("[data-select]")) {
      if (el.value) filters[el.dataset.select] = el.value;
      else delete filters[el.dataset.select];
      changed();
    }
    if (el.matches("[data-adjacent]")) {
      includeAdjacent = el.checked;
      changed();
    }
    if (el.matches("[data-scope]")) {
      expanded.set(el.dataset.scope, el.value);
      const hit = matches.find((x) => x.r.id === el.dataset.scope),
        area = q(`#ca-detail-${el.dataset.scope} .ca-details`);
      area.innerHTML = detailHTML(hit.r, hit.m, expanded.get(hit.r.id) || "");
      area.querySelector("select").focus({ preventScroll: true });
    }
  });
  window.addEventListener("scroll", () => positionPopover(), { passive: true });
  window.addEventListener("resize", () => positionPopover(), { passive: true });
  new ResizeObserver(positionPopover).observe(q(".ca-shell"));
  root.addEventListener("atlas:pagechange", () => closePopover());
  const mobile = matchMedia("(max-width:760px)");
  const syncMobile = () => {
    q(".ca-filter-body").hidden = mobile.matches;
    q("[data-mobile-filters]").setAttribute("aria-expanded", String(!mobile.matches));
    closePopover();
  };
  syncMobile();
  mobile.addEventListener("change", syncMobile);
  mountGuide(root, vocab, closePopover);
  update();
  icons();
}
const root = document.getElementById("causal-atlas");
mountFooter(root, config);
mountNavigation(root);
start(root).catch((error) => {
  console.error(error);
  document.querySelector("[data-results]").innerHTML =
    '<p role="alert">The catalog could not be loaded. Please reload the page.</p>';
  document.querySelector("[data-result-count]").textContent = "Catalog unavailable";
});
