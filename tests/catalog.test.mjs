import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { matchRecord, matchesProperties } from "../assets/js/search.js";

const catalog = JSON.parse(readFileSync(new URL("../data/catalog.json", import.meta.url)));
const get = (id) => catalog.records.find((r) => r.id === id);

test("all scopes share the property schema and evidence-backed positive values", () => {
  for (const r of catalog.records) {
    for (const scope of [r, ...r.profiles]) {
      assert.deepEqual(Object.keys(scope.properties).sort(), Object.keys(catalog.vocabulary.fields).sort());
      for (const claim of Object.values(scope.properties)) {
        if (claim.state === "documented") {
          assert.ok(claim.evidence.length);
          assert.ok(claim.values.length || claim.measure);
        }
      }
    }
  }
});

test("Coat separates randomized evaluation, self-selected learning and estimated propensities", () => {
  const r = get("coat_schnabel2016");
  assert.ok(matchRecord(r, { tasks: "debiased_prediction", origin: "measured" }));
  assert.equal(matchRecord(r, { identification_design: "randomized_trial" }), null);
  assert.equal(matchRecord(r, { effect_targets: "ATE" }), null);
  assert.equal(matchRecord(r, { assignment_metadata: "provided" }), null);
  assert.equal(matchRecord(r, { assignment: "randomized", data_roles: { regime: "interventional", role: "learning" } }), null);
  assert.equal(matchRecord(r, { assignment: "randomized", data_roles: { regime: "interventional", role: "evaluation" } }).profile_id, "randomized_test");
});

test("the Mindsets derivative does not inherit the original trial's randomization or outcome oracle", () => {
  const r = get("learning_mindsets_acic18");
  assert.ok(matchRecord(r, { origin: "semi_synthetic", regimes: "observational", structure: "clustered" }));
  for (const f of [{ origin: "measured" }, { assignment: "randomized" }, { reference_query: "model_potential_outcomes" }]) {
    assert.equal(matchRecord(r, f), null);
  }
  assert.equal(r.properties.sample_size.measure.min, 10391);
});

test("LUCAS intervention data belongs to evaluation and held-out labels are not public", () => {
  const r = get("lucas_challenge");
  assert.equal(matchRecord(r, { data_roles: { regime: "interventional", role: "learning" } }), null);
  assert.equal(matchRecord(r, { data_roles: { regime: "interventional", role: "evaluation" } }).profile_id, "lucas1");
  assert.equal(matchRecord(r, { references: { object: "observed_outcomes", visibility: "public_reference" } }), null);
  assert.ok(matchRecord(r, { references: { object: "observed_outcomes", visibility: "train_validation_only" } }));
  assert.ok(matchRecord(r, { graph_depth: { min: 5, max: 5, unit: "edges" } }));
  assert.equal(matchRecord(r, { graph_depth: { max: 2, unit: "edges" } }), null);
});

test("Lawrence full and summary graphs cannot be joined into a fictitious graph view", () => {
  const r = get("lawrence_timeseries");
  assert.ok(matchRecord(r, { graph_form: "DAG", graph_representation: "time_unrolled" }));
  assert.equal(matchRecord(r, { graph_form: "DAG", graph_representation: "time_summary" }), null);
  assert.equal(matchRecord(r, { graph_representation: "time_summary" }).profile_id, "author_example_summary");
  assert.equal(matchRecord(r, { graph_representation: "time_summary", reference_query: "model_graph" }), null);
  assert.equal(matchRecord(r, { graph_form: "directed_cyclic_graph" }), null);
  assert.equal(matchRecord(r, { missingness: "absent_in_release" }), null);
  assert.equal(matchRecord(r, { latent_confounding: "present_by_design" }), null);
  assert.ok(matchRecord(r, { temporal_features: "lagged_only" }));
});

test("Feedback-Discovery retains neuronal-reference scope and processing-specific sample counts", () => {
  const r = get("feedback_simple_networks");
  assert.ok(matchRecord(r, { graph_form: "directed_cyclic_graph", graph_representation: "unindexed" }));
  assert.equal(matchRecord(r, { graph_depth: { min: 1 } }), null);
  assert.equal(matchRecord(r, { references: { object: "graph", scope: "observed_variables" } }), null);
  assert.equal(matchRecord(r, { noise: "gaussian" }), null);
  assert.equal(matchRecord(r, { sample_size: { min: 5000, max: 5000, unit: "time_points" } }).profile_id, "concatenated");
  assert.equal(matchRecord(r, { sample_size: { min: 5000, unit: "people" } }), null);
});

test("a reference's visibility cannot be borrowed from another reference", () => {
  const p = {
    references: { state: "documented", evidence: [], values: [
      { object: "graph", basis: "specified_model", coverage: "complete_for_model", visibility: "model_access" },
      { object: "observed_outcomes", basis: "experimental_measurement", coverage: "selected_targets", visibility: "public_reference" },
    ] },
  };
  assert.ok(matchesProperties(p, { reference_query: "model_graph" }));
  assert.equal(matchesProperties(p, { reference_query: { kind: "model_graph", visibility: "public_reference" } }), null);
  assert.ok(matchesProperties(p, { reference_query: { kind: "model_graph", visibility: "model_access" } }));
});

test("adding unassessed fields preserves existing filter matches across all base records and profiles", () => {
  const original = catalog.records;
  const migrated = structuredClone(original);
  for (const r of migrated) {
    for (const scope of [r, ...r.profiles]) {
      for (const key of ["temporal_features", "graph_representation"]) {
        scope.properties[key] = { state: "not_assessed", values: [], basis: "unresolved", evidence: [] };
      }
    }
  }
  const queries = Object.entries(catalog.vocabulary.fields)
    .filter(([key]) => !["temporal_features", "graph_representation"].includes(key))
    .flatMap(([key, field]) => field.allowed_values.map((value) => ({ [key]: value })));
  queries.push({ tasks: "discovery", origin: "measured", reference_query: "empirical_graph" });
  for (const f of queries) {
    const signatures = (rs) => rs.flatMap((r) => {
      const match = matchRecord(r, f);
      return match ? [`${r.id}/${match.profile_id ?? "base"}`] : [];
    });
    assert.deepEqual(signatures(migrated), signatures(original), JSON.stringify(f));
  }
  assert.equal(migrated.filter((r) => matchRecord(r, { graph_representation: "time_unrolled" })).length, 0);
});

test("validator rejects unsupported positive claims and cyclic DAG-depth annotations", () => {
  const dir = mkdtempSync(join(tmpdir(), "atlas-validator-"));
  const filename = join(dir, "catalog.json");
  const validate = (data) => {
    writeFileSync(filename, JSON.stringify(data));
    return spawnSync(process.execPath, [new URL("../scripts/validate.mjs", import.meta.url).pathname, filename], { encoding: "utf8" });
  };
  try {
    assert.equal(validate(catalog).status, 0);
    const edited = structuredClone(catalog);
    edited.records[0].properties.origin.note = "A sourced clarification within the existing scope.";
    const addition = structuredClone(edited.records[0]);
    addition.id = "validation_fixture";
    edited.records.push(addition);
    assert.equal(validate(edited).status, 0);
    for (const mutation of [
      (d) => { d.records[0].properties.origin.evidence = []; },
      (d) => { d.records[0].properties.origin.evidence[0].locator = " "; },
      (d) => { d.records[0].properties.origin.values = []; },
      (d) => { d.records[0].aliases = [42]; },
      (d) => { d.records[0].links[0].role = "unknown"; },
      (d) => { d.records[0].properties.origin.note = " "; },
      (d) => { delete d.records[0].family_id; },
      (d) => {
        delete d.vocabulary.fields.tasks;
        for (const record of d.records)
          for (const scope of [record, ...record.profiles]) delete scope.properties.tasks;
      },
      (d) => { d.records[0].title = 42; },
      (d) => { d.records[0].release = {}; },
      (d) => { d.records[0].profiles = {}; },
      (d) => { d.records[0].properties.origin.extra = true; },
      (d) => { d.records[0].links[0].url = "javascript:alert(1)"; },
      (d) => {
        const profile = d.records.find((r) => r.profiles.length).profiles[0];
        profile.settings.push({ ...profile.settings[0] });
      },
      (d) => {
        const claim = d.records.find((r) => r.properties.sample_size.measure).properties.sample_size;
        claim.measure.unit = "bananas";
      },
      (d) => {
        const reference = d.records.find((r) => r.properties.references.values.length).properties.references.values[0];
        reference.evidence = [{ source_id: "missing_source", locator: "Methods" }];
      },
      (d) => {
        const claim = d.records.find((r) => r.properties.references.values.length).properties.references;
        claim.values.push(Object.fromEntries(Object.entries(claim.values[0]).reverse()));
      },
      (d) => {
        const p = d.records.find((r) => r.id === "feedback_simple_networks").properties;
        p.graph_depth = { ...p.graph_form, values: [], measure: { min: 3, max: 3, unit: "edges", scope: "cyclic graph" } };
      },
    ]) {
      const invalid = structuredClone(catalog);
      mutation(invalid);
      assert.notEqual(validate(invalid).status, 0);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ordered treatments and credentialed references retain their documented distinctions", () => {
  assert(matchRecord(get("angrist_krueger_census"), { treatment_support: "ordered_discrete" }));
  assert.equal(matchRecord(get("angrist_krueger_census"), { treatment_support: "continuous" }), null);
  assert(matchRecord(get("ct_mimic_real"), { references: { visibility: "credentialed_reference" } }));
  assert.equal(matchRecord(get("ct_mimic_real"), { references: { visibility: "public_reference" } }), null);
});
