# Catalog format

`catalog.json` contains three collections:

- `records`: scoped resources and their named configurations.
- `vocabulary`: shared fields, allowed values, review states and reference types.
- `sources`: stable source IDs with titles and URLs.

Every record and configuration contains the same 36 property keys. A claim contains `state`, `values`, `basis` and `evidence`, and may contain a scoped numeric `measure`. Numeric units come from that field’s `allowed_units`; the scope remains a description of what was counted. An optional `note` explains a qualification supported by that claim's evidence. Notes do not affect filtering. Unknown values remain explicit rather than being guessed or treated as absent.

Records may include `aliases` for alternate names. Links use `provider`, `data` or `code` roles. The two temporal fields describe graph representation and documented temporal features; they remain unassessed where no review has been completed.

Evidence entries resolve `source_id` through the source registry. Their `locator` identifies a section, table, file or other supporting location. Evidence establishes only the scope described by that claim.

References are structured objects. Their object, basis, scope, coverage and visibility are evaluated together. Do not combine the basis of one reference with the object or coverage of another. A reference may include its own `evidence` array when the sources support that particular object. Existing field-level citations are not automatically reassigned to each object.

Configurations are complete property scopes, not partial overrides. Filtering tests the base record first, then each configuration separately. The first complete match is returned. A displayed configuration can be changed without altering the filter result, and the interface identifies when the inspected scope differs from the matching scope.

The `role` field distinguishes core resources from adjacent resources. This is an inclusion category, not a quality score. Dataset-specific access requirements and licenses are annotations about the provider's resource, separate from this catalog's own license.
