import { esc, label, html } from "./text.js";
import { primaryProperties, previewProperties } from "./presentation.js";
export function createCatalogView(data) {
  const vocab = data.vocabulary.fields;
  const sources = Object.fromEntries(data.sources.map((s) => [s.id, s]));
  function propertyText(c) {
    if (c.state !== "documented") return label(c.state);
    if (c.measure) {
      const m = c.measure;
      return `${m.min === m.max ? m.min : m.min + "–" + m.max} ${label(m.unit).toLowerCase()} (${label(m.scope).toLowerCase()})`;
    }
    return (
      c.values
        .map((v) =>
          typeof v === "string"
            ? label(v)
            : Object.entries(v)
                .filter(([key]) => key !== "evidence")
                .map(([k, x]) => `${label(k)}: ${label(x)}`)
                .join("; "),
        )
        .join(", ") || "No value asserted"
    );
  }
  function valueList(values) {
    return html`
      <div class="ca-value-list">
        ${values
          .map(
            (value) => html`
              <span class="ca-property-tag">${esc(label(value))}</span>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function objectFields(entries) {
    return html`
      <dl class="ca-object-values">
        ${entries
          .map(
            ([key, value]) => html`
              <div>
                <dt>${esc(label(key))}</dt>
                <dd>${esc(label(value))}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
    `;
  }

  function propertyHTML(key, claim) {
    let value;
    if (claim.state !== "documented") {
      value = esc(propertyText(claim));
    } else if (key === "references") {
      value = claim.values
        .map(
          (reference) => html`
            <div class="atlas-reference-object">
              <span class="ca-reference-title">${esc(label(reference.object))}</span>
              ${objectFields([
                ["basis", reference.basis],
                ["scope", reference.scope],
                ["coverage", reference.coverage],
                ["availability", reference.visibility],
              ])}
            </div>
          `,
        )
        .join("");
    } else if (claim.measure) {
      value = esc(propertyText(claim));
    } else if (claim.values.some((value) => typeof value === "object")) {
      value = claim.values.map((value) => objectFields(Object.entries(value))).join("");
    } else {
      value = claim.values.length ? valueList(claim.values) : "No value asserted";
    }
    const pending =
      claim.state !== "documented" && (claim.values.length || claim.measure)
        ? html`
            <p class="atlas-definition">
              Unconfirmed or conditional values:
              ${esc(propertyText({ ...claim, state: "documented" }))}
            </p>
          `
        : "";
    return html`
      <div class="atlas-property">
        <dt>${esc(vocab[key].label)}</dt>
        <dd>
          ${value}${pending}
          ${claim.note ? html`<p class="atlas-definition">${esc(claim.note)}</p>` : ""}
        </dd>
      </div>
    `;
  }
  function providerLinks(r) {
    const links = [...new Map(r.links.map((l) => [l.url, l])).values()];
    const paper = (l) =>
      /nature\.com|pubmed\.|proceedings\.mlr\.|arxiv\.org|openreview\.net/.test(l.url);
    const rank = (link) => (link.role === "data" ? 0 : paper(link) ? 2 : 1);
    const linkLabel = (link) =>
      ({ data: "Data files", code: "Source code" })[link.role] ||
      (paper(link) ? "Research paper" : "Provider page");
    links.sort((a, b) => rank(a) - rank(b));
    return links
      .map(
        (l) => html`
          <a
            class="atlas-provider ca-provider-action"
            href="${esc(l.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${linkLabel(l)}
            <span aria-hidden="true">↗</span>
            <span class="ca-visually-hidden">: ${esc(r.title)} (opens in a new tab)</span>
          </a>
        `,
      )
      .join("");
  }
  function sourcePropertyHTML(k, c) {
    const references = k === "references" ? c.values.filter((value) => value.evidence?.length) : [];
    const assigned = references.flatMap((value) => value.evidence);
    const remaining = c.evidence.filter((item) => !assigned.some((evidence) =>
      evidence.source_id === item.source_id && evidence.locator === item.locator));
    return html`
      <h4>${esc(vocab[k].label)}</h4>
      ${valueList([c.state, c.basis])}
      ${references.map((reference) => html`
        <h5>${esc(label(reference.object))}</h5>
        ${objectFields([["basis", reference.basis], ["scope", reference.scope],
          ["coverage", reference.coverage], ["availability", reference.visibility]])}
        ${evidenceHTML(reference.evidence)}
      `).join("")}
      ${remaining.length ? html`
        ${references.length ? "<h5>Property-level sources</h5>" : ""}
        ${evidenceHTML(remaining)}
      ` : ""}
      ${!assigned.length && !remaining.length ? '<p class="atlas-subtle">No source citation recorded for this property.</p>' : ""}
    `;
  }
  function provenanceHTML(r, p, profile) {
    const first = Object.keys(p)[0];
    return html`
      <details class="atlas-provenance">
        <summary>Sources and provenance</summary>
        <div class="ca-source-picker">
          <label for="ca-source-select-${r.id}">Choose a property</label>
          <select id="ca-source-select-${r.id}" data-source-property="${r.id}">
            ${Object.keys(p)
              .map(
                (k) => html`
                  <option value="${k}">${esc(vocab[k].label)}</option>
                `,
              )
              .join("")}
          </select>
        </div>
        <section class="ca-source-field" data-source-content aria-live="polite">
          ${sourcePropertyHTML(first, p[first])}
        </section>
        <p class="atlas-definition ca-source-scope">Recorded scope: ${esc(r.release)}</p>
        ${
          profile && profile.evidence?.length
            ? html`
                <details class="ca-configuration-sources">
                  <summary>Configuration sources</summary>
                  ${evidenceHTML(profile.evidence)}
                </details>
              `
            : ""
        }
      </details>
    `;
  }
  function evidenceHTML(evidence) {
    return html`
      <ul>
        ${evidence
          .map((e) => {
            const s = sources[e.source_id];
            return html`
              <li>
                ${
                  s
                    ? html`
                        <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">
                          ${esc(s.title)}
                        </a>
                      `
                    : esc(e.source_id)
                }
                <div class="atlas-subtle">${esc(e.locator)}</div>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }
  function detailHTML(record, match, selected = "") {
    const profile = record.profiles.find((profile) => profile.id === selected);
    const properties = profile ? profile.properties : record.properties;
    const primary = primaryProperties(properties);
    const remaining = Object.keys(vocab).filter((key) => !primary.includes(key));
    const groups = [...new Set(remaining.map((key) => vocab[key].group))];
    const release =
      record.release === "documented resource; immutable pin not captured"
        ? ""
        : html`
            <div class="atlas-release">Release / scope: ${esc(record.release)}</div>
          `;
    const configuration = record.profiles.length
      ? html`
          <label class="atlas-scope-label">
            Annotation scope
            <select data-scope="${record.id}">
              <option value="" ${!selected ? "selected" : ""}>Record scope</option>
              ${record.profiles
                .map(
                  (item) => html`
                    <option
                      value="${esc(item.id)}"
                      ${selected === item.id ? "selected" : ""}
                    >
                      ${esc(item.label)}
                    </option>
                  `,
                )
                .join("")}
            </select>
          </label>
        `
      : "";
    const scopeNote =
      selected !== (match.profile_id || "")
        ? html`
            <p class="atlas-scope-note">
              You are viewing a different scope from the filtered match.
            </p>
          `
        : "";
    const settings = profile
      ? html`
          ${objectFields(profile.settings.map((setting) => [setting.parameter, setting.value]))}
        `
      : "";
    return html`
      ${release}${configuration}${scopeNote}${settings}
      <dl class="atlas-properties">
        ${primary.map((key) => propertyHTML(key, properties[key])).join("")}
      </dl>
      <details class="atlas-further">
        <summary>All other properties (${remaining.length})</summary>
        ${groups
          .map(
            (group) => html`
              <p class="atlas-group-name">${esc(group)}</p>
              <dl class="atlas-properties">
                ${remaining
                  .filter((key) => vocab[key].group === group)
                  .map((key) => propertyHTML(key, properties[key]))
                  .join("")}
              </dl>
            `,
          )
          .join("")}
      </details>
      ${provenanceHTML(record, properties, profile)}
    `;
  }

  function metadataTags(properties) {
    return previewProperties
      .flatMap((key) => {
        const claim = properties[key];
        const values =
          claim.state === "documented" && claim.values.length
            ? claim.values.map(label)
            : [propertyText(claim)];
        return values.map(
          (value) => html`
            <span
              class="ca-property-tag"
              aria-label="${esc(vocab[key].label)}: ${esc(value)}"
            >
              ${esc(value)}
            </span>
          `,
        );
      })
      .join("");
  }

  function rowHTML(r, m) {
    const p = m.profile_id
      ? r.profiles.find((x) => x.id === m.profile_id).properties
      : r.properties;
    const ref =
      p.references.state === "documented"
        ? p.references.values
            .map(
              (v) => html`
                <span class="ca-ref-entry">
                  <span>${esc(label(v.object))}</span>
                  <small>${esc(label(v.basis))}</small>
                </span>
              `,
            )
            .join("")
        : esc(label(p.references.state));
    return html`
      <div class="ca-record-main">
        <h3 class="ca-title">
          <button
            type="button"
            data-expand="${r.id}"
            aria-expanded="false"
            aria-controls="ca-detail-${r.id}"
          >
            <span class="ca-title-text">${esc(r.title)}</span>
            <span class="ca-detail-word" hidden>Details</span>
            <span class="ca-visually-hidden">Open dataset details</span>
          </button>
        </h3>
        <div class="ca-meta">${metadataTags(p)}</div>
        ${
          m.profile_id
            ? html`
                <div class="ca-profile">Configuration: ${esc(m.profile_label)}</div>
              `
            : ""
        }${r.role === "adjacent" ? '<div class="ca-profile">Adjacent robustness dataset</div>' : ""}
        <div class="ca-provider-links">${providerLinks(r)}</div>
      </div>
      <div class="ca-reference">${ref}</div>
      <button
        type="button"
        class="ca-row-open"
        data-expand="${r.id}"
        aria-label="Open details: ${esc(r.title)}"
        aria-expanded="false"
        aria-controls="ca-detail-${r.id}"
      >
        <i data-lucide="arrow-right" aria-hidden="true"></i>
      </button>
      <div class="ca-detail-wrap" id="ca-detail-${r.id}" hidden>
        <div class="ca-details"></div>
      </div>
    `;
  }

  return { propertyText, sourcePropertyHTML, detailHTML, rowHTML };
}
