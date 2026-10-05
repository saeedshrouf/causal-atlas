# Release review: v0.1.1

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
