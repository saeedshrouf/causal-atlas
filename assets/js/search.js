const model = new Set(["specified_model", "calibrated_model", "symbolic_oracle"]);
const empirical = new Set([
  "experimental_measurement",
  "expert_reference",
  "domain_knowledge",
]);
export function matchesName(record, query) {
  const normalize = (value) =>
    value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const names = [
    record.title,
    record.family_id.replace(/_/g, " "),
    ...(record.aliases || []),
  ];
  const term = normalize(query.trim());
  return names.some((name) => normalize(name).includes(term));
}

function referenceMatch(refs, q, p) {
  const query = typeof q === "string" ? { kind: q } : q;
  if (!query || typeof query.kind !== "string") return false;
  return refs.some((r) => {
    if (query.visibility && r.visibility !== query.visibility) return false;
    const kind = query.kind;
    if (kind === "model_graph")
      return (
        r.object === "graph" && model.has(r.basis) && r.coverage === "complete_for_model"
      );
    if (kind === "empirical_graph")
      return ["graph", "pair_direction"].includes(r.object) && empirical.has(r.basis);
    if (["model_potential_outcomes", "model_same_unit_outcomes"].includes(kind))
      return (
        r.object === "potential_outcomes" &&
        model.has(r.basis) &&
        (kind === "model_potential_outcomes" ||
          (p.pairing.state === "documented" &&
            p.pairing.values.includes("same_unit_simulated_worlds")))
      );
    if (kind === "mean_outcomes")
      return r.object === "conditional_mean_outcomes" && model.has(r.basis);
    if (kind === "effect_parameter")
      return r.object === "effect_parameter" && model.has(r.basis);
    if (kind === "experimental_outcomes")
      return (
        ["observed_outcomes", "interventional_samples", "policy_returns"].includes(
          r.object,
        ) && r.basis === "experimental_measurement"
      );
    if (kind === "latent_factors") return r.object === "latent_factors";
    if (kind === "answer_labels") return r.object === "answer_labels";
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
