import { getChildren } from "./furnitureModel.js";

export function buildComponentTree(model) {
  const compare = (a, b) => (a.position?.xCm ?? Infinity) - (b.position?.xCm ?? Infinity) || a.id.localeCompare(b.id);
  const visit = (component) => ({ component, children: getChildren(model, component.id).sort(compare).map(visit) });
  return model.components.filter((component) => !component.parentId).sort(compare).map(visit);
}
export function summarizeFurnitureModel(model) {
  const components = model.components.length; const count = (type) => model.components.filter((c) => c.type === type).length;
  return { components, physical: model.components.filter((c) => c.sourcePieceIds.length > 0).length, logical: model.components.filter((c) => c.sourcePieceIds.length === 0).length, sections: count("section"), drawers: count("drawer"), doors: count("door"), openings: count("opening"), positioned: model.components.filter((c) => c.position).length, sourced: model.components.filter((c) => c.sourcePieceIds.length).length };
}
export function filterComponents(model, type = "all", search = "") { const term = search.trim().toLowerCase(); return model.components.filter((c) => (type === "all" || c.type === type) && (!term || `${c.id} ${c.role} ${c.type}`.toLowerCase().includes(term))); }
export const resolveSourcePieces = (component, generatedPieces) => component.sourcePieceIds.map((id) => generatedPieces.find((piece) => piece.id === id)).filter(Boolean);
