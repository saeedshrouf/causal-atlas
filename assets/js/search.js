const model = new Set(["specified_model", "calibrated_model", "symbolic_oracle"]);
const empirical = new Set([
  "experimental_measurement",
  "expert_reference",
  "domain_knowledge",
]);
function referenceMatch(refs, q, p) {
  return refs.some((r) => {
    if (q === "model_graph")
      return (
        r.object === "graph" && model.has(r.basis) && r.coverage === "complete_for_model"
      );
    if (q === "empirical_graph")
      return ["graph", "pair_direction"].includes(r.object) && empirical.has(r.basis);
    if (["model_potential_outcomes", "model_same_unit_outcomes"].includes(q))
      return (
        r.object === "potential_outcomes" &&
        model.has(r.basis) &&
        (q === "model_potential_outcomes" ||
          (p.pairing.state === "documented" &&
            p.pairing.values.includes("same_unit_simulated_worlds")))
      );
    if (q === "mean_outcomes")
      return r.object === "conditional_mean_outcomes" && model.has(r.basis);
    if (q === "effect_parameter")
      return r.object === "effect_parameter" && model.has(r.basis);
    if (q === "experimental_outcomes")
      return (
        ["observed_outcomes", "interventional_samples", "policy_returns"].includes(
          r.object,
        ) && r.basis === "experimental_measurement"
      );
    if (q === "latent_factors") return r.object === "latent_factors";
    if (q === "answer_labels") return r.object === "answer_labels";
    return false;
  });
}
export function matchesProperties(p, filters) {
  const reasons = [];
  for (const [key, w] of Object.entries(filters)) {
    if (w === null || w === "" || (Array.isArray(w) && !w.length)) continue;
    const field = key === "reference_query" ? "references" : key,
      c = p[field];
    if (!c || c.state !== "documented") return null;
    let ok;
    if (key === "reference_query") ok = referenceMatch(c.values, w, p);
    else if (
      w &&
      typeof w === "object" &&
      !Array.isArray(w) &&
      ("min" in w || "max" in w)
    ) {
      const m = c.measure;
      ok =
        !!m &&
        Object.keys(w).every((k) => ["min", "max", "unit", "scope"].includes(k)) &&
        (!("min" in w) || m.min >= w.min) &&
        (!("max" in w) || m.max <= w.max) &&
        ["unit", "scope"].every((k) => !(k in w) || m[k] === w[k]);
    } else if (Array.isArray(w)) ok = w.every((x) => c.values.includes(x));
    else if (w && typeof w === "object")
      ok = c.values.some(
        (v) => typeof v === "object" && Object.entries(w).every(([k, x]) => v[k] === x),
      );
    else ok = c.values.includes(w);
    if (!ok) return null;
    reasons.push({ property: field, requested: w, evidence: c.evidence });
  }
  return reasons;
}
export function matchRecord(r, f, include = true) {
  let reasons = matchesProperties(r.properties, f);
  if (reasons !== null)
    return { profile_id: null, profile_label: "Record scope", reasons };
  if (include)
    for (const p of r.profiles) {
      reasons = matchesProperties(p.properties, f);
      if (reasons !== null) return { profile_id: p.id, profile_label: p.label, reasons };
    }
  return null;
}
