import { createComponent } from "./componentFactory.js";
import { validateFurnitureModel } from "./componentValidation.js";
import { getComponentBounds } from "./spatial.js";

export const getComponentById = (model, id) => model.components.find((component) => component.id === id) ?? null;
export const normalizeFurnitureComponentSelection = (model, selectedId) => selectedId && model?.components?.some((component) => component.id === selectedId) ? selectedId : null;
export const getChildren = (model, parentId) => model.components.filter((component) => component.parentId === parentId);
export const getComponentsByType = (model, type) => model.components.filter((component) => component.type === type);
export const getComponentsByRole = (model, role) => model.components.filter((component) => component.role === role);
export function getDescendants(model, parentId) {
  const descendants = []; const visit = (id) => getChildren(model, id).forEach((child) => { descendants.push(child); visit(child.id); }); visit(parentId); return descendants;
}
export function getAncestorIds(model, componentId) {
  const byId = new Map((model?.components ?? []).map((component) => [component.id, component]));
  const ancestors = []; let current = byId.get(componentId);
  if (!current) return ancestors;
  while (current.parentId && byId.has(current.parentId)) { current = byId.get(current.parentId); ancestors.unshift(current.id); }
  return ancestors;
}
/** Physical selection expands logical nodes to their existing physical descendants. */
export function getHighlightedComponentIds(model, selectedId) {
  const selected = getComponentById(model, selectedId); if (!selected) return new Set();
  const candidates = ["drawer", "section", "opening"].includes(selected.type) ? getDescendants(model, selected.id) : [selected];
  return new Set(candidates.filter((component) => component.sourcePieceIds.length).map((component) => component.id));
}

/** One canonical mapping shared by FurnitureModel adapters and the drawer renderer. */
export function getDrawerComponentIds(baseId) {
  return {
    front: `${baseId}.front`,
    leftSide: `${baseId}.left-side`,
    rightSide: `${baseId}.right-side`,
    back: `${baseId}.back`,
    bottom: `${baseId}.bottom`,
  };
}

export function createFurnitureModel({ furnitureType, dimensions, components, generatedPieces }) {
  const rootId = `${furnitureType}.root`;
  const root = createComponent({ id: rootId, type: "section", role: "root", dimensions, position: { xCm: 0, yCm: 0, zCm: 0 }, bounds: boundsFromCenter(dimensions, { xCm: 0, yCm: 0, zCm: 0 }), metadata: { semanticId: rootId } });
  const model = { furnitureType, modelVersion: 1, dimensions: { ...dimensions }, components: [root, ...components] };
  return { ...model, validation: validateFurnitureModel(model, generatedPieces) };
}

export function boundsFromCenter(dimensions, position) {
  return getComponentBounds({ dimensions, position });
}
