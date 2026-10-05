# Causal Atlas

A searchable catalogue of datasets and generators for causal research. Filter by research task, data origin, intervention regime and other properties, then inspect the sources behind each annotation.

The catalogue links to the original providers; it does not host datasets. See the website’s Methodology page for how records were collected and reviewed.

Maintained by Saeed Shrouf, University of Toronto.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>. No build step is needed.

## Contributions

Corrections and dataset suggestions are welcome through GitHub Issues. Please include a source supporting the proposed change. See [CONTRIBUTING.md](CONTRIBUTING.md) for details and [data/README.md](data/README.md) for the catalogue format.

## Citation and licensing

To cite the catalogue, use [CITATION.cff](CITATION.cff). Cite the original dataset papers when using their data.

Code and documentation: [MIT](LICENSE). catalogue annotations: [CC BY 4.0](data/LICENSE.md). Upstream datasets retain their own licenses.
