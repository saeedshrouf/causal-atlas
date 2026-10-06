import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matchRecord, matchesProperties } from "../assets/js/search.js";
import { repositoryUrl } from "../assets/js/footer.js";

const catalog = JSON.parse(
  readFileSync(new URL("../data/catalog.json", import.meta.url)),
);
const claim = (values, state = "documented") => ({ values, state, evidence: [] });

test("a conjunction cannot combine the base record with a configuration", () => {
  const record = {
    properties: { origin: claim(["measured"]), regimes: claim(["observational"]) },
    profiles: [
      {
        id: "simulated",
        label: "Simulated",
        properties: {
          origin: claim(["synthetic"]),
          regimes: claim(["interventional"]),
        },
      },
    ],
  };
  assert.equal(
    matchRecord(record, { origin: "measured", regimes: "interventional" }),
    null,
  );
  assert.equal(
    matchRecord(record, { origin: "synthetic", regimes: "interventional" }).profile_id,
    "simulated",
  );
});

test("uncertain values never qualify a filtered match", () => {
  for (const state of catalog.vocabulary.states.filter(
    (state) => state !== "documented",
  )) {
    assert.equal(
      matchesProperties({ origin: claim(["measured"], state) }, { origin: "measured" }),
      null,
    );
  }
});

test("reference criteria must belong to the same reference object", () => {
  const properties = {
    references: claim([
      { object: "graph", basis: "domain_knowledge", coverage: "partial" },
      {
        object: "potential_outcomes",
        basis: "specified_model",
        coverage: "complete_for_model",
      },
    ]),
  };
  assert.equal(matchesProperties(properties, { reference_query: "model_graph" }), null);
  assert.notEqual(
    matchesProperties(properties, { reference_query: "empirical_graph" }),
    null,
  );
});

test("same-unit outcomes require documented pairing in the same scope", () => {
  const properties = {
    references: claim([{ object: "potential_outcomes", basis: "specified_model" }]),
    pairing: claim(["same_unit_simulated_worlds"], "conditional"),
  };
  assert.equal(
    matchesProperties(properties, { reference_query: "model_same_unit_outcomes" }),
    null,
  );
  properties.pairing.state = "documented";
  assert.notEqual(
    matchesProperties(properties, { reference_query: "model_same_unit_outcomes" }),
    null,
  );
});

test("numeric filters retain units and use containment, not overlap", () => {
  const properties = {
    sample_size: {
      state: "documented",
      values: [],
      measure: { min: 100, max: 500, unit: "rows", scope: "release" },
    },
  };
  assert.notEqual(
    matchesProperties(properties, { sample_size: { min: 100, max: 500, unit: "rows" } }),
    null,
  );
  assert.equal(
    matchesProperties(properties, { sample_size: { min: 200, max: 600 } }),
    null,
  );
  assert.equal(
    matchesProperties(properties, { sample_size: { min: 100, unit: "people" } }),
    null,
  );
});

test("a graph filter finds a matching configuration", () => {
  const core = catalog.records.filter((record) => record.role === "core");
  const record = core.find((record) => record.id === "lt_crl_benchmark_v1");
  assert.equal(
    matchRecord(record, { reference_query: "model_graph" }).profile_id,
    "buchholz_1",
  );
});

test("footer links resolve on project Pages, account Pages and custom domains", () => {
  assert.equal(
    repositoryUrl({}, { hostname: "example.github.io", pathname: "/causal-atlas/" }),
    "https://github.com/example/causal-atlas",
  );
  assert.equal(
    repositoryUrl({}, { hostname: "example.github.io", pathname: "/index.html" }),
    "https://github.com/example/example.github.io",
  );
  assert.equal(repositoryUrl({}, { hostname: "example.org", pathname: "/" }), null);
  assert.equal(
    repositoryUrl(
      { repository: "https://github.com/example/catalog" },
      { hostname: "example.org" },
    ),
    "https://github.com/example/catalog",
  );
  assert.equal(repositoryUrl({ repository: "not a url" }, {}), null);
});
