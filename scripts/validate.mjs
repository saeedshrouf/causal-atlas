import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(new URL("../data/catalog.json", import.meta.url)),
);
const { records, vocabulary, sources } = catalog;
const fields = Object.keys(vocabulary.fields).sort();
const sourceIds = new Set(sources.map((source) => source.id));
assert.equal(sourceIds.size, sources.length, "Duplicate source IDs");
assert.equal(
  new Set(records.map((record) => record.id)).size,
  records.length,
  "Duplicate record IDs",
);

function checkUrl(value) {
  assert(
    ["https:", "http:"].includes(new URL(value).protocol),
    `Invalid source URL: ${value}`,
  );
}

function checkEvidence(evidence, path) {
  assert(Array.isArray(evidence), `${path}: evidence must be an array`);
  for (const item of evidence) {
    assert(sourceIds.has(item.source_id), `${path}: unknown source ${item.source_id}`);
    assert.equal(typeof item.locator, "string", `${path}: missing evidence location`);
  }
}

for (const source of sources) checkUrl(source.url);
for (const record of records) {
  assert(/^[a-zA-Z0-9_-]+$/.test(record.id), `Invalid ID: ${record.id}`);
  assert(["core", "adjacent"].includes(record.role), `${record.id}: invalid role`);
  assert(
    record.title && record.release && record.links.length,
    `${record.id}: incomplete record`,
  );
  record.links.forEach((link) => checkUrl(link.url));
  assert.equal(
    new Set(record.profiles.map((profile) => profile.id)).size,
    record.profiles.length,
  );
  for (const scope of [record, ...record.profiles]) {
    const path = `${record.id}/${scope.id}`;
    assert.deepEqual(
      Object.keys(scope.properties).sort(),
      fields,
      `${path}: inconsistent fields`,
    );
    if (scope !== record) checkEvidence(scope.evidence, path);
    for (const [key, claim] of Object.entries(scope.properties)) {
      assert(vocabulary.states.includes(claim.state), `${path}/${key}: invalid state`);
      assert(vocabulary.bases.includes(claim.basis), `${path}/${key}: invalid basis`);
      assert(Array.isArray(claim.values), `${path}/${key}: values must be an array`);
      checkEvidence(claim.evidence, `${path}/${key}`);
      if (claim.measure) {
        assert(Number.isFinite(claim.measure.min) && Number.isFinite(claim.measure.max));
        assert(claim.measure.min <= claim.measure.max, `${path}/${key}: inverted range`);
        assert(
          claim.measure.unit && claim.measure.scope,
          `${path}/${key}: unscoped measure`,
        );
      }
      for (const value of claim.values) {
        if (key === "references") {
          for (const [attribute, allowed] of Object.entries({
            object: "reference_objects",
            basis: "reference_bases",
            coverage: "reference_coverage",
            visibility: "reference_visibility",
            scope: "reference_scopes",
          }))
            assert(
              vocabulary[allowed].includes(value[attribute]),
              `${path}: invalid reference ${attribute}`,
            );
        } else if (key === "data_roles") {
          assert(vocabulary.fields.regimes.allowed_values.includes(value.regime));
          assert(vocabulary.data_roles.includes(value.role));
        } else {
          assert(
            vocabulary.fields[key].allowed_values.includes(value),
            `${path}/${key}: unknown value ${value}`,
          );
        }
      }
    }
  }
}
console.log(
  `Validated ${records.length} records, ${fields.length} fields, ${sources.length} sources.`,
);
console.log("Structural validation does not establish scientific correctness.");
