export const valueLabels = {
  discovery: "Causal discovery",
  effect_estimation: "Effect estimation",
  counterfactual_prediction: "Counterfactual prediction",
  representation_learning: "Representation learning",
  policy_evaluation: "Policy evaluation",
  robustness: "Robustness",
  causal_reasoning: "Causal reasoning",
  interventional_prediction: "Interventional prediction",
  debiased_prediction: "Debiased prediction",
  measured: "Measured",
  synthetic: "Synthetic",
  semi_synthetic: "Semi-synthetic",
  constructed: "Constructed",
  SCM_simulation: "SCM simulation",
  model_graph: "Complete model graph",
  empirical_graph: "Empirical / expert graph",
  model_potential_outcomes: "Model potential outcomes",
  model_same_unit_outcomes: "Same-unit model outcomes",
  mean_outcomes: "Model mean outcomes",
  effect_parameter: "Model effect parameter",
  experimental_outcomes: "Experimental outcomes",
  latent_factors: "Latent factors",
  unindexed: "Without time indices",
  time_unrolled: "Time-unrolled graph",
  time_summary: "Time-summary graph",
  lagged_only: "Lagged links only",
  directed_cyclic_graph: "Directed cyclic graph",
  custom_terms: "Provider-specific terms",
  answer_labels: "Answer labels",
  download: "Download",
  generate: "Generate",
  public_link: "Public link",
  credentialed_reference: "Credentialed access",
  ordered_discrete: "Ordered discrete",
  credentialed: "Credentialed access",
  request_required: "Request required",
  registration: "Registration",
  not_documented: "Not established in reviewed sources",
  not_assessed: "Not assessed",
  not_applicable: "Not applicable",
  conditional: "Configuration dependent",
  disputed: "Conflicting evidence",
  documented: "Documented",
  source_reported: "Source reported",
  curator_mapping: "Curator mapping",
  curator_derived: "Curator derived",
  unresolved: "Unresolved",
};

export const primaryFilters = [
  { key: "tasks", empty: "All research tasks" },
  { key: "origin", empty: "Any origin" },
  { key: "regimes", title: "Available data", empty: "Any regime" },
  {
    key: "reference_query", title: "Reference", empty: "Any reference",
    values: ["model_graph", "empirical_graph", "model_potential_outcomes", "experimental_outcomes",
      "model_same_unit_outcomes", "mean_outcomes", "effect_parameter", "latent_factors", "answer_labels"],
  },
  { key: "modalities", title: "Data format", empty: "Any format" },
];

export const advancedFilters = [
  "identification_design", "structure", "domain", "access_modes",
  "access_requirements", "graph_form", "latent_confounding",
];

export const previewProperties = ["origin", "modalities", "regimes"];

const detailProperties = [
  { key: "tasks" },
  { key: "origin" },
  { key: "modalities" },
  { key: "structure" },
  { key: "identification_design" },
  { key: "regimes" },
  { key: "data_roles", when: (claim) => claim.state === "documented" },
  { key: "references" },
  { key: "access_modes" },
  { key: "access_requirements" },
  { key: "data_license", when: (claim) => !!claim.note },
];

export function primaryProperties(properties) {
  return detailProperties.filter(({ key, when }) => !when || when(properties[key])).map(({ key }) => key);
}
