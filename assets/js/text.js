import { valueLabels } from "./presentation.js";

export const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export const label = (x) =>
  Object.hasOwn(valueLabels, x) ? valueLabels[x] : String(x)
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());

export function html(strings, ...values) {
  return strings.reduce(
    (result, part, index) => result + part + (values[index] ?? ""),
    "",
  );
}
