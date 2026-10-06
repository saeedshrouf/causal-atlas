import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const catalog = JSON.parse(
  await readFile(
    process.argv[2]
      ? resolve(process.argv[2])
      : new URL("../data/catalog.json", import.meta.url),
  ),
);
function checkObject(value, path, required = [], optional = []) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${path}: expected an object`);
  for (const key of required) assert(Object.hasOwn(value, key), `${path}: missing ${key}`);
  if (required.length)
    assert(Object.keys(value).every((key) => [...required, ...optional].includes(key)), `${path}: unexpected key`);
}

function checkString(value, path) {
  assert(typeof value === "string" && value.trim(), `${path}: expected nonempty text`);
}

function checkStrings(value, path) {
  assert(Array.isArray(value), `${path}: expected an array`);
  value.forEach((item) => checkString(item, path));
  assert.equal(new Set(value).size, value.length, `${path}: duplicate values`);
}

function checkId(value, path) {
  checkString(value, path);
  assert(/^[a-zA-Z0-9_-]+$/.test(value), `${path}: invalid ID`);
}

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])]));
  return value;
}

checkObject(catalog, "catalog", ["records", "vocabulary", "sources"]);
const { records, vocabulary, sources } = catalog;
assert(Array.isArray(records), "records must be an array");
assert(Array.isArray(sources), "sources must be an array");
checkObject(vocabulary, "vocabulary");
checkString(vocabulary.version, "vocabulary/version");
checkObject(vocabulary.fields, "vocabulary/fields");
for (const key of ["states", "bases", "reference_objects", "reference_bases", "reference_coverage",
  "reference_visibility", "reference_scopes", "data_roles"])
  checkStrings(vocabulary[key], `vocabulary/${key}`);
for (const [key, field] of Object.entries(vocabulary.fields)) {
  checkId(key, "field");
  checkObject(field, key, ["label", "group", "definition", "allowed_values"],
    ["allowed_units", "value_definitions"]);
  for (const attribute of ["label", "group", "definition"]) checkString(field[attribute], `${key}/${attribute}`);
  checkStrings(field.allowed_values, `${key}/allowed_values`);
  if (["sample_size", "variable_count", "graph_depth"].includes(key)) {
    checkStrings(field.allowed_units, `${key}/allowed_units`);
    assert(field.allowed_units.length && !field.allowed_values.length, `${key}: invalid numeric vocabulary`);
  } else assert(!field.allowed_units, `${key}: unexpected numeric units`);
  if (field.value_definitions) {
    checkObject(field.value_definitions, `${key}/value_definitions`);
    for (const [value, definition] of Object.entries(field.value_definitions)) {
      assert(field.allowed_values.includes(value), `${key}: definition for an unknown value`);
      checkString(definition, `${key}/${value}`);
    }
  }
}

const fields = [
  "tasks", "domain", "origin", "modalities", "structure",
  "variable_types", "access_modes", "regimes", "assignment", "treatment_support",
  "intervention_semantics", "target_metadata", "assignment_metadata", "effect_targets", "references",
  "graph_form", "graph_scope", "latent_confounding", "mechanisms", "noise",
  "environment_metadata", "pairing", "missingness", "selection", "interference",
  "sample_size", "variable_count", "graph_depth", "evaluation", "access_requirements",
  "data_license", "software_license", "data_roles", "identification_design", "temporal_features",
  "graph_representation",
].sort();
assert.deepEqual(Object.keys(vocabulary.fields).sort(), fields, "Unexpected property schema");
const sourceIds = new Set(sources.map((source) => source.id));
assert.equal(sourceIds.size, sources.length, "Duplicate source IDs");
assert.equal(
  new Set(records.map((record) => record.id)).size,
  records.length,
  "Duplicate record IDs",
);

function checkUrl(value) {
  checkString(value, "URL");
  assert(
    ["https:", "http:"].includes(new URL(value).protocol),
    `Invalid source URL: ${value}`,
  );
}

function checkEvidence(evidence, path) {
  assert(Array.isArray(evidence), `${path}: evidence must be an array`);
  for (const item of evidence) {
    checkObject(item, path, ["source_id", "locator"]);
    assert(sourceIds.has(item.source_id), `${path}: unknown source ${item.source_id}`);
    assert(
      typeof item.locator === "string" && item.locator.trim(),
      `${path}: missing evidence location`,
    );
  }
}

for (const source of sources) {
  checkObject(source, "source", ["id", "title", "url"]);
  assert(typeof source.id === "string" && source.id.trim(), "Missing source ID");
  assert(typeof source.title === "string" && source.title.trim(), `${source.id}: missing title`);
  checkUrl(source.url);
}
for (const record of records) {
  checkObject(record, "record", ["id", "title", "family_id", "release", "role", "links", "profiles", "properties"], ["aliases"]);
  checkId(record.id, "record/id");
  checkId(record.family_id, `${record.id}/family_id`);
  checkString(record.title, `${record.id}/title`);
  checkString(record.release, `${record.id}/release`);
  assert(Array.isArray(record.links) && record.links.length, `${record.id}: missing links`);
  assert(Array.isArray(record.profiles), `${record.id}: profiles must be an array`);
  assert(["core", "adjacent"].includes(record.role), `${record.id}: invalid role`);
  for (const link of record.links) {
    checkObject(link, `${record.id}/link`, ["role", "url"]);
    checkUrl(link.url);
    assert(
      ["provider", "data", "code"].includes(link.role),
      `${record.id}: invalid link role`,
    );
  }
  if (record.aliases !== undefined) {
    assert(Array.isArray(record.aliases), `${record.id}: aliases must be an array`);
    assert(
      record.aliases.every((name) => typeof name === "string" && name.trim()),
      `${record.id}: invalid alias`,
    );
    assert.equal(
      new Set(record.aliases).size,
      record.aliases.length,
      `${record.id}: duplicate aliases`,
    );
  }
  assert.equal(
    new Set(record.profiles.map((profile) => profile.id)).size,
    record.profiles.length,
  );
  for (const scope of [record, ...record.profiles]) {
    const path = `${record.id}/${scope.id}`;
    checkObject(scope.properties, `${path}/properties`);
    assert.deepEqual(
      Object.keys(scope.properties).sort(),
      fields,
      `${path}: inconsistent fields`,
    );
    if (scope !== record) {
      checkObject(scope, path, ["id", "label", "settings", "evidence", "properties"]);
      checkId(scope.id, path);
      assert(typeof scope.label === "string" && scope.label.trim(), `${path}: missing label`);
      assert(Array.isArray(scope.settings), `${path}: missing settings`);
      assert.equal(new Set(scope.settings.map((setting) => setting.parameter)).size,
        scope.settings.length, `${path}: duplicate setting parameters`);
      for (const setting of scope.settings) {
        checkObject(setting, path, ["parameter", "value"]);
        assert(typeof setting.parameter === "string" && setting.parameter.trim(), `${path}: missing parameter`);
        assert(
          ["string", "number", "boolean"].includes(typeof setting.value) &&
            (typeof setting.value !== "number" || Number.isFinite(setting.value)),
          `${path}: invalid setting value`,
        );
      }
      checkEvidence(scope.evidence, path);
      assert(scope.evidence.length, `${path}: configuration needs evidence`);
    }
    for (const [key, claim] of Object.entries(scope.properties)) {
      checkObject(claim, `${path}/${key}`, ["state", "values", "basis", "evidence"], ["measure", "note"]);
      assert(vocabulary.states.includes(claim.state), `${path}/${key}: invalid state`);
      assert(vocabulary.bases.includes(claim.basis), `${path}/${key}: invalid basis`);
      assert(Array.isArray(claim.values), `${path}/${key}: values must be an array`);
      assert.equal(new Set(claim.values.map((value) => JSON.stringify(ordered(value)))).size,
        claim.values.length, `${path}/${key}: duplicate values`);
      checkEvidence(claim.evidence, `${path}/${key}`);
      if (claim.note !== undefined) {
        assert(
          typeof claim.note === "string" && claim.note.trim(),
          `${path}/${key}: empty note`,
        );
        assert(claim.evidence.length, `${path}/${key}: note needs evidence`);
      }
      if (claim.state === "documented") {
        assert(claim.evidence.length, `${path}/${key}: documented claim needs evidence`);
        assert(claim.values.length || claim.measure, `${path}/${key}: empty documented claim`);
        assert.notEqual(claim.basis, "unresolved", `${path}/${key}: unresolved documented claim`);
      }
      if (["conditional", "disputed"].includes(claim.state)) {
        assert(claim.evidence.length, `${path}/${key}: qualified claim needs evidence`);
      }
      if (!["documented", "conditional", "disputed"].includes(claim.state)) {
        assert(!claim.values.length && !claim.measure, `${path}/${key}: unknown state asserts a value`);
      }
      if (claim.measure !== undefined) {
        checkObject(claim.measure, `${path}/${key}/measure`, ["min", "max", "unit", "scope"]);
        assert(
          ["sample_size", "variable_count", "graph_depth"].includes(key),
          `${path}/${key}: unexpected measure`,
        );
        assert(Number.isFinite(claim.measure.min) && Number.isFinite(claim.measure.max));
        assert(Number.isSafeInteger(claim.measure.min) && Number.isSafeInteger(claim.measure.max));
        assert(!claim.values.length, `${path}/${key}: numeric values belong in measure`);
        assert(vocabulary.fields[key].allowed_units.includes(claim.measure.unit), `${path}/${key}: invalid unit`);
        assert(claim.measure.min >= 0, `${path}/${key}: negative count`);
        assert(claim.measure.min <= claim.measure.max, `${path}/${key}: inverted range`);
        assert(
          [claim.measure.unit, claim.measure.scope].every((value) =>
            typeof value === "string" && value.trim()),
          `${path}/${key}: unscoped measure`,
        );
      }
      for (const value of claim.values) {
        if (key === "references") {
          checkObject(value, `${path}/reference`, ["object", "basis", "coverage", "visibility", "scope"], ["evidence"]);
          if (value.evidence !== undefined) {
            checkEvidence(value.evidence, `${path}/reference`);
            assert(value.evidence.length, `${path}: empty reference evidence`);
          }
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
          checkObject(value, `${path}/data_roles`, ["regime", "role"]);
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
    const graph = scope.properties.graph_form;
    if (graph.state === "documented" && graph.values.includes("directed_cyclic_graph")) {
      assert(!graph.values.includes("DAG"), `${path}: contradictory graph forms`);
      assert(
        scope.properties.graph_depth.state !== "documented",
        `${path}: DAG depth on a cyclic reference`,
      );
    }
    const graphScope = scope.properties.graph_scope;
    const reference = scope.properties.references;
    if (graphScope.state === "documented" && reference.state === "documented") {
      for (const item of reference.values.filter((value) =>
        ["graph", "pair_direction"].includes(value.object) && value.scope !== "not_assessed")) {
        assert(graphScope.values.includes(item.scope), `${path}: inconsistent reference graph scope`);
      }
    }
    const regimes = scope.properties.regimes;
    const roles = scope.properties.data_roles;
    if (regimes.state === "documented" && roles.state === "documented") {
      assert(roles.values.every((value) => regimes.values.includes(value.regime)), `${path}: role for absent regime`);
    }
  }
}
console.log(
  `Validated ${records.length} records, ${fields.length} fields, ${sources.length} sources.`,
);
console.log("Structural validation does not establish scientific correctness.");
