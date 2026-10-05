export const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const names = {
  discovery: "Causal discovery",
  effect_estimation: "Effect estimation",
  counterfactual_prediction: "Counterfactual prediction",
  representation_learning: "Representation learning",
  policy_evaluation: "Policy evaluation",
  robustness: "Robustness",
  causal_reasoning: "Causal reasoning",
  interventional_prediction: "Interventional prediction",
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
  answer_labels: "Answer labels",
  download: "Download",
  generate: "Generate",
  public_link: "Public link",
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
export const label = (x) =>
  names[x] ||
  String(x)
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());

export function html(strings, ...values) {
  return strings.reduce(
    (result, part, index) => result + part + (values[index] ?? ""),
    "",
  );
}
