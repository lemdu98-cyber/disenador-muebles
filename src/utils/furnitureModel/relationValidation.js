import { isRelationType } from "./relationTypes.js";

const COMPATIBLE_TYPES = Object.freeze({
  "supported-by": { source: ["panel", "shelf"], target: ["panel", "divider"] },
  "contained-in": { source: ["drawer", "shelf"], target: ["section"] },
  "adjacent-to": { source: ["section"], target: ["section"] },
  connects: { source: ["panel", "crossbar"], target: ["panel", "divider"] },
  separates: { source: ["divider"], target: ["section", "opening"] },
  covers: { source: ["door", "drawer-front"], target: ["opening", "section"] },
  closes: { source: ["back"], target: ["section"] },
});

export function validateFurnitureRelations(model) {
  const errors = [];
  if (!Array.isArray(model?.relations)) return { valid: false, errors: ["relations must be an array."] };
  const components = new Map((model.components ?? []).map((component) => [component.id, component]));
  const relationIds = new Set();
  for (const relation of model.relations) {
    if (!relation?.id || relationIds.has(relation.id)) errors.push(`Duplicate or missing relation id: ${relation?.id ?? "unknown"}.`);
    relationIds.add(relation?.id);
    if (!isRelationType(relation?.type)) errors.push(`Invalid relation type: ${relation?.type ?? "unknown"}.`);
    const source = components.get(relation?.sourceId);
    const target = components.get(relation?.targetId);
    if (!source) errors.push(`Unknown relation source: ${relation?.sourceId ?? "unknown"}.`);
    if (!target) errors.push(`Unknown relation target: ${relation?.targetId ?? "unknown"}.`);
    if (relation?.sourceId && relation.sourceId === relation.targetId) errors.push(`Invalid self relation: ${relation.id ?? relation.sourceId}.`);
    const expectedId = relation?.sourceId && relation?.type && relation?.targetId ? `${relation.sourceId}|${relation.type}|${relation.targetId}` : null;
    if (expectedId && relation.id !== expectedId) errors.push(`Non-canonical relation id: ${relation.id ?? "unknown"}.`);
    const compatible = COMPATIBLE_TYPES[relation?.type];
    if (source && compatible && !compatible.source.includes(source.type)) errors.push(`Incompatible relation source type: ${relation.id}.`);
    if (target && compatible && !compatible.target.includes(target.type)) errors.push(`Incompatible relation target type: ${relation.id}.`);
  }
  return { valid: errors.length === 0, errors };
}
