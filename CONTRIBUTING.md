# Contributing

Use **Suggest a correction** in the website footer or open an issue. Include the record title or ID, any named configuration, the property, and a primary source supporting the proposed change. A paper section, table, documentation heading or code location makes the correction easier to assess.

For a pull request:

1. Edit `data/catalog.json`, the authoritative catalogue, and add any new source to its source registry.
2. Use the existing vocabulary. If no value is supported, retain the appropriate uncertainty state.
3. Keep release and configuration boundaries explicit. Do not generalize a result from one configuration to all configurations.
4. Run `npm run validate` and `npm test`. Run the browser checks if you change rendering or interactions.
5. Explain the correction and cite the evidence in the pull request.

New resources should use the same property schema as existing records. A missing property is represented by an explicit review state, not by omitting its key. Avoid copying large passages from publications into evidence locations.

The dated files in `research/` preserve earlier searches, annotations and releases. They are not inputs to the website or to normal catalogue editing. Historical integration scripts require a new output path and cannot overwrite the active catalogue. Run `npm run test:archive` to check the frozen v0.3.0 integration.

With Node.js 22 or later and Python 3 available, run `npm ci` to install development tools. `npm run standalone` creates a self-contained preview in `dist/`. For browser checks, run `npx playwright install chromium`, build the preview, then run `npm run test:browser`. These tools are not needed to host the static site.

When copying this release over v0.3.0 manually, remove `tests/pilot.test.mjs`, `scripts/standalone.py` and the old `.ttf` files in `assets/fonts/`. Their replacements are included.
