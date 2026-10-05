# Causal Atlas

A catalog of datasets and data generators for causal research. Researchers can filter resources by documented properties and inspect the sources behind individual annotations.

Created and maintained by **Saeed Shrouf**, University of Toronto.

The current catalog contains 100 records (95 core and five adjacent resources), 34 shared properties, and 18 named configurations. Data stays with the original providers. This repository contains catalog metadata and the website.

## Publish for free

The site uses plain HTML, CSS and JavaScript. It has no runtime dependencies, backend, API keys, external font requests or paid services. No build step is required for hosting.

1. Create a **public** GitHub repository named `causal-atlas`.
2. Upload the **contents** of this folder. `index.html`, `assets/`, `data/` and `site.config.js` must be at the repository root. Do not upload the ZIP itself or an extra enclosing folder. Include `.github/` for the correction form and `.nojekyll` for direct static serving.
3. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then save.
4. GitHub displays the published address on that page, normally `https://YOUR-USERNAME.github.io/causal-atlas/`.

The footer automatically derives the repository and correction links from a standard `github.io` project address. For a custom domain or local preview, set `repository` in `site.config.js` to the full GitHub repository URL. Leave Issues enabled under the repository's general settings.

GitHub Pages is available for public repositories on GitHub Free. The `github.io` address requires no purchased domain. See [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) and [publishing from a branch](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

If you use Git instead of browser upload, run these commands from this folder after creating an empty repository. Replace `YOUR-USERNAME` first:

```sh
git init -b main
git add .
git commit -m "Release Causal Atlas v0.1.2"
git remote add origin https://github.com/YOUR-USERNAME/causal-atlas.git
git push -u origin main
```

## Local use

With Python 3 installed, run from the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Opening `index.html` directly from disk does not load ES modules or fetched JSON reliably. To create an offline file instead:

```sh
python3 scripts/standalone.py
```

Open `dist/Causal_Atlas_Preview.html`. This is generated from the same source as the hosted site. Edit the source files, not the generated preview.

The header remains visible while scrolling. The appearance button switches between light and dark themes and stores the preference in the browser. Light is the default when no preference is saved.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure and Methodology |
| `assets/styles.css` | Shared styles and responsive layouts |
| `assets/js/app.js` | Filtering, navigation and interaction state |
| `assets/js/search.js` | Matching rules, independent of the browser |
| `assets/js/catalog-view.js` | Record, property and source rendering |
| `assets/js/guide.js` | Property definitions and review states |
| `assets/js/footer.js` | Attribution and repository links |
| `data/catalog.json` | Records, vocabulary and source registry |
| `site.config.js` | Authorship, affiliation, version and repository URL |
| `tests/` | Matching and browser regression checks |

## Review and maintenance

The catalog was assembled through LLM-assisted search, annotation and repeated source review. The Methodology page describes that process. The software checks below validate structure and behavior, not the truth of scientific claims or availability of upstream datasets.

Only `documented` properties qualify filter matches. Every selected criterion must hold in the base record or within one complete named configuration. The matcher does not pool incompatible claims across configurations. See [data/README.md](data/README.md) for the data format and [CONTRIBUTING.md](CONTRIBUTING.md) for corrections.

Run the dependency-free checks with Node.js 22 or later:

```sh
npm run validate
npm test
```

For browser checks, also install the development dependency and Chromium:

```sh
npm ci
npx playwright install chromium
npm run standalone
npm run test:browser
```

After changing the catalog, update the collection counts in Methodology if needed. Change `version` and `releasedOn` in `site.config.js`, `package.json`, `package-lock.json` and `CITATION.cff` together when preparing a release. The footer date is the website release date, not a claim that all annotations were reviewed that day.

## Citation

Shrouf, S. (2026). *Causal Atlas* (Version 0.1.2) [Software and dataset catalog].

Add the repository URL to `CITATION.cff` as `repository-code` once it exists. Cite the original dataset papers when using their data. Catalog inclusion does not replace their citations or terms.

## Licenses

Original website code and project documentation are distributed under the [MIT License](LICENSE). Original catalog annotations are distributed under [CC BY 4.0](data/LICENSE.md). These licenses do not cover upstream datasets, software, or quoted source material. Bundled font and icon notices are in [THIRD_PARTY.md](THIRD_PARTY.md).

University of Toronto identifies the maintainer's affiliation. The catalog is an independent project.
