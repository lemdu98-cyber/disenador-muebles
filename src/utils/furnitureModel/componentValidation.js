import { FURNITURE_TYPES, isComponentType } from "./componentTypes.js";

const validDimensions = (dimensions) => dimensions == null || [dimensions.widthCm, dimensions.heightCm, dimensions.depthCm].every((value) => Number.isFinite(value) && value >= 0);

export function validateFurnitureModel(model, generatedPieces = []) {
  const errors = [];
  if (!FURNITURE_TYPES.includes(model?.furnitureType)) errors.push("Unsupported furnitureType.");
  if (!Array.isArray(model?.components)) return { valid: false, errors: [...errors, "components must be an array."] };
  const ids = new Set();
  const pieceIds = new Set(generatedPieces.map(({ id }) => id));
  for (const component of model.components) {
    if (!component?.id || ids.has(component.id)) errors.push(`Duplicate or missing component id: ${component?.id ?? "unknown"}.`);
    ids.add(component?.id);
    if (!isComponentType(component?.type)) errors.push(`Invalid component type: ${component?.type ?? "unknown"}.`);
    if (!validDimensions(component.dimensions)) errors.push(`Invalid dimensions: ${component.id}.`);
    if (component.manufacturable && component.sourcePieceIds.length && !component.dimensions) errors.push(`Manufacturable component lacks dimensions: ${component.id}.`);
    for (const pieceId of component.sourcePieceIds ?? []) if (!pieceIds.has(pieceId)) errors.push(`Unknown source piece: ${pieceId}.`);
  }
  const byId = new Map(model.components.map((component) => [component.id, component]));
  for (const component of model.components) if (component.parentId && !byId.has(component.parentId)) errors.push(`Unknown parent: ${component.parentId}.`);
  for (const component of model.components) {
    const seen = new Set(); let current = component;
    while (current?.parentId) {
      if (seen.has(current.id)) { errors.push(`Hierarchy cycle at: ${component.id}.`); break; }
      seen.add(current.id); current = byId.get(current.parentId);
    }
  }
  return { valid: errors.length === 0, errors };
}
