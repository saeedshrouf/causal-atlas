import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchRecord } from "../assets/js/search.js";
import { config } from "../site.config.js";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const catalog = read("../data/catalog.json");
const get = (id) => catalog.records.find((record) => record.id === id);

test("regulatory references, configurable noise and restricted outcomes remain qualified", () => {
  const dream = get("dream4");
  assert.equal(matchRecord(dream, { graph_scope: "observed_variables" }), null);
  assert(matchRecord(dream, { references: { object: "graph", scope: "subsystem" } }));
  for (const id of ["dream4", "genenetweaver"])
    assert.equal(matchRecord(get(id), { noise: "stochastic_dynamics" }), null);
  assert.equal(matchRecord(get("ct_mimic_real"), { references: { visibility: "public_reference" } }), null);
  for (const id of ["perturbench_norman19", "perturbench_frangieh21"])
    for (const license of ["CC-BY-4.0", "CC-BY-NC-4.0"])
      assert.equal(matchRecord(get(id), { data_license: license }), null);
});

test("new measured data cannot acquire simulated outcome or complete-graph references", () => {
  assert.equal(matchRecord(get("twins_cevae_source"), { reference_query: "model_potential_outcomes" }), null);
  for (const id of ["beeline_mesc", "beeline_hhep", "human_esfmri", "feedback_mtl", "feedback_rhyming"])
    assert.equal(matchRecord(get(id), { reference_query: "model_graph" }), null);
  for (const country of ["france", "germany", "italy"])
    assert.equal(matchRecord(get(`population_rdd_${country}`), { reference_query: "effect_parameter" }), null);
});

test("BEELINE cell snapshots and LUCAP probes retain their reviewed scope", () => {
  for (const record of catalog.records.filter((r) => r.id.startsWith("beeline_"))) {
    assert.equal(matchRecord(record, { structure: "time_series" }), null);
    assert(matchRecord(record, { data_license: "CC-BY-NC-4.0" }));
  }
  assert.equal(get("beeline_gsd").properties.variable_count.measure.unit, "model_variables");
  assert.equal(matchRecord(get("lucap_challenge"), { reference_query: "model_graph" }), null);
  for (const profile of get("feedback_mtl").profiles)
    assert.equal(profile.properties.sample_size.state, "not_documented");
  assert.equal(get("angrist_krueger_cps").profiles[0].properties.sample_size.measure.min, 14221);
});

test("release metadata and displayed catalogue counts agree", () => {
  const pkg = read("../package.json");
  const lock = read("../package-lock.json");
  const citation = readFileSync(new URL("../CITATION.cff", import.meta.url), "utf8");
  const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(pkg.version, config.version);
  assert.equal(lock.version, config.version);
  assert.equal(lock.packages[""].version, config.version);
  assert(citation.includes(`version: "${config.version}"`));
  assert(citation.includes(`date-released: "${config.releasedOn}"`));
  assert(page.includes("data-catalog-summary"));
  assert(page.includes("data-property-count"));
  assert.equal((page.match(/data-page=/g) || []).length, 2);
});
