import { isDiagnosticCode, isDiagnosticSeverity } from "./diagnosticTypes.js";

export function validateFurnitureDiagnostics(model) {
  const errors = [];
  if (!Array.isArray(model?.diagnostics)) return { valid: false, errors: ["diagnostics must be an array."] };
  const componentIds = new Set((model.components ?? []).map(({ id }) => id));
  const diagnosticIds = new Set();
  for (const diagnostic of model.diagnostics) {
    if (!diagnostic?.id || diagnosticIds.has(diagnostic.id)) errors.push(`Duplicate or missing diagnostic id: ${diagnostic?.id ?? "unknown"}.`);
    diagnosticIds.add(diagnostic?.id);
    if (!isDiagnosticCode(diagnostic?.code)) errors.push(`Invalid diagnostic code: ${diagnostic?.code ?? "unknown"}.`);
    if (!isDiagnosticSeverity(diagnostic?.severity)) errors.push(`Invalid diagnostic severity: ${diagnostic?.severity ?? "unknown"}.`);
    if (!componentIds.has(diagnostic?.componentId)) errors.push(`Unknown diagnostic component: ${diagnostic?.componentId ?? "unknown"}.`);
    if (!Array.isArray(diagnostic?.relatedComponentIds)) errors.push(`relatedComponentIds must be an array: ${diagnostic?.id ?? "unknown"}.`);
    else for (const relatedId of diagnostic.relatedComponentIds) if (!componentIds.has(relatedId)) errors.push(`Unknown diagnostic related component: ${relatedId}.`);
  }
  return { valid: errors.length === 0, errors };
}
