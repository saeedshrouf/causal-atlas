import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchRecord, matchesName } from "../assets/js/search.js";
import { createCatalogView } from "../assets/js/catalog-view.js";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const catalog = read("../data/catalog.json");
const get = (id) => catalog.records.find((record) => record.id === id);
const view = createCatalogView(catalog);

test("alias search preserves accents, title search and empty searches", () => {
  const record = get("lawrence_timeseries");
  assert(matchesName(record, "causaLens"));
  assert(matchesName(record, "  CDML-NeurIPS2020 "));
  assert(matchesName(record, "Lawrence"));
  assert(matchesName(record, ""));
  assert(!matchesName(record, "Coat"));
  assert(matchesName({ title: "C. élegans", family_id: "neural_atlas" }, "elegans"));
  assert(matchesName(get("lucas_challenge"), "LUCAS2"));
});

test("neuronal reference scope does not assert measured-variable graphs or confounding", () => {
  for (const id of ["netsim", "feedback_simple_networks"]) {
    const record = get(id);
    assert(matchRecord(record, { references: { object: "graph", scope: "latent_factors" } }));
    assert.equal(matchRecord(record, { references: { object: "graph", scope: "observed_variables" } }), null);
    assert.equal(matchRecord(record, { latent_confounding: "present_by_design" }), null);
  }
});

test("resource links and qualifications remain tied to the displayed scope", () => {
  const coat = get("coat_schnabel2016");
  const match = matchRecord(coat, { assignment: "randomized" });
  const row = view.rowHTML(coat, match);
  assert(row.indexOf("coat.zip") < row.indexOf('mnar/"'));
  assert(row.includes("Data files") && row.includes("Provider page"));
  const detail = view.detailHTML(coat, match, match.profile_id);
  assert(detail.includes("Evaluation"));
  assert(detail.includes("not a randomized trial of recommendation effects"));
  const mindsets = get("learning_mindsets_acic18");
  const terms = view.detailHTML(mindsets, matchRecord(mindsets, {}));
  assert(terms.indexOf("Use is limited to evaluating treatment-effect methods") < terms.indexOf('class="atlas-further"'));
  const lucas = get("lucas_challenge");
  assert(view.detailHTML(lucas, matchRecord(lucas, {})).includes("test labels are absent"));
});

test("every integrated scope renders and claim notes are escaped", () => {
  for (const record of catalog.records) {
    for (const profile of [null, ...record.profiles]) {
      const match = { profile_id: profile?.id ?? null, profile_label: profile?.label ?? "Record scope" };
      const output = view.rowHTML(record, match) + view.detailHTML(record, match, profile?.id ?? "");
      assert(!output.includes("undefined"), `${record.id}/${profile?.id}`);
    }
  }
  const record = structuredClone(get("coat_schnabel2016"));
  record.properties.regimes.note = '<script>alert("test")</script>';
  const output = view.detailHTML(record, matchRecord(record, {}));
  assert(!output.includes("<script>"));
  assert(output.includes("&lt;script&gt;"));
});

test("reference-specific citations stay attached to their own objects", () => {
  const claim = {
    state: "documented", basis: "curator_mapping", evidence: [],
    values: [
      { object: "graph", basis: "specified_model", coverage: "complete_for_model", scope: "observed_variables", visibility: "model_access",
        evidence: [{ source_id: "chambers", locator: "Graph source only" }] },
      { object: "observed_outcomes", basis: "experimental_measurement", coverage: "selected_targets", scope: "outcome_targets", visibility: "public_reference",
        evidence: [{ source_id: "csuite", locator: "Outcome source only" }] },
    ],
  };
  const output = view.sourcePropertyHTML("references", claim);
  assert(output.indexOf("Graph source only") < output.indexOf("Observed outcomes"));
  assert(output.indexOf("Observed outcomes") < output.indexOf("Outcome source only"));
  assert(!view.propertyText(claim).includes("[object Object]"));
  claim.evidence = [{ source_id: "chambers", locator: "Shared field-level source" }];
  const mixed = view.sourcePropertyHTML("references", claim);
  assert(mixed.indexOf("Property-level sources") < mixed.indexOf("Shared field-level source"));
});
