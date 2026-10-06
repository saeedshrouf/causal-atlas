# Release review: v0.3.1

Reviewed 2026-10-06.

Maintenance release for the existing design. Historical migrations can no longer overwrite the active catalogue, and release snapshots have separate tests. Validation covers missing metadata, controlled units and reference-specific evidence. Navigation and the footer work independently of catalogue loading. Presentation settings are consolidated, font files are smaller, and the offline preview uses a module-aware builder.

The [maintenance review](research/maintenance-2026-10-06/README.md) records six changed property entries and the checks confirming the other 8,598 are unchanged. The catalogue still contains 140 records, 99 configurations, 36 properties and 152 sources.

- Validation, 27 current tests and four archived integration tests passed.
- Browser checks passed for all records and configurations, citations, filters, keyboard controls, both themes, 320–1920px layouts and the offline preview.
- HTTP and JSON failures leave Methodology, the footer and theme controls available.
- Desktop and mobile screenshots were inspected. Version metadata agrees across the site, package, schema and citation file.

The 1,386 unassessed fields remain pending. This maintenance review does not certify the retained scientific annotations. The package has not been pushed or deployed.

## v0.3.0 review

Reviewed 2026-10-06.

Added 35 records and 72 configurations from the cleared research queue. The catalogue now contains 140 records, including five adjacent resources, 99 configurations, 36 properties and 152 source entries. The design and matching rules are unchanged.

The [consolidated review](research/integration-2026-10-06/README.md) reconciles all 8,604 property entries. Seven existing fields were corrected for regulatory-graph scope, configurable noise, credentialed outcome access and conflicting Perturbench licenses. All new annotations match the reviewed research package. Held candidates are excluded.

- Schema and cross-field validation passed, including reference scope, regime roles, evidence, numeric units and configuration settings.
- All 28 automated tests passed, including 183 legacy query fixtures with explicit annotation corrections.
- Browser checks passed for all records and configurations, citations, filters, keyboard controls, light/dark modes, 320–1920px layouts and the offline preview.
- Expanded new-record details were checked at 320px. Desktop, expanded details and mobile dark-mode screenshots were inspected.
- Version metadata agrees across the website, package files and citation file.

Uncertainties are retained. In particular, 1,386 legacy fields still lack a field-specific assessment. The review does not establish independent annotation accuracy or reproduce upstream generators. This release has not been pushed or deployed.

## v0.2.0 review

Reviewed 2026-10-05.

Added five records and nine configurations, two shared temporal properties, alias search and role-specific resource links. Existing colors, typography, layout and main filters are unchanged. Short notes clarify data use, reference scope and access conditions within expanded details.

The only changes to existing scientific claims are NetSim's graph scope and its corresponding reference scope. The original pilot and the [integration decisions](research/integration-2026-10-05/README.md) are retained with source evidence.

- Validated 105 records, 36 properties, 27 configurations and 125 source entries.
- All 22 automated tests passed. The 183 legacy query fixtures allow only the two intentional NetSim scope-filter changes.
- Browser checks passed for all records and configurations, aliases, citations, filters, keyboard controls, light/dark themes, 320–1920px layouts and the offline preview.
- Desktop, expanded details, mobile and dark-mode screenshots were inspected. No stylesheet changes were needed.

Unknown annotations and unresolved software notices remain explicit. These reviews do not establish independent annotation accuracy or verify execution of upstream generators. This package has not been pushed or deployed.

## v0.1.1 review

Reviewed 2026-10-04.

This interface update removes the filter hint and dot-separated metadata, adds a sticky header, and introduces a persistent, light-first theme toggle. The catalog data and matching rules are unchanged.

Theme persistence, header position, filter-menu visibility, property rendering and mobile layouts were checked in both themes. All record/configuration rendering checks and search tests from v0.1.0 were rerun.

## v0.1.0 review

Reviewed 2026-10-04.

## Code changes

- Separated page markup, catalog data, styles, matching, rendering, the label guide and footer.
- Consolidated the prototype's accumulated style overrides and removed obsolete controls and selectors.
- Replaced the full icon distribution with the five icon definitions actually used.
- Kept fonts local and preserved third-party notices.
- Added a catalog-load error state, keyboard focus styling and a skip link.
- Kept floating filters anchored during scrolling and reset accessibility labels when results change.
- Added release metadata, author attribution and GitHub Pages repository-link detection.

## Validation

- Parsed catalog content matched the pre-refactor catalog exactly.
- Structural validation passed for 100 records, 34 properties, 18 configurations and 103 source entries.
- 35,600 query/record comparisons returned the same matches and evidence as the original matcher.
- Seven automated tests passed, covering scope isolation, uncertain values, reference-object semantics, same-unit pairing, numeric ranges, known queries and repository links.
- Browser review exercised all records, all configurations and every base-record source selector. It also checked filtering, expansion, keyboard navigation, guide tabs, mobile controls, and offline standalone loading.
- Datasets, Help and Methodology layouts were checked for horizontal overflow at 320, 390, 768, 1024 and 1920 pixels.
- Desktop and mobile screenshots were inspected after the refactor.

These checks concern the code and integrity of the existing catalog. They do not constitute a new scientific review of the annotations or a live availability check of upstream resources. Actual GitHub Pages publication will occur when the repository owner enables hosting.
