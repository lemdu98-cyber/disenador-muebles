import { createComponent } from "./componentFactory.js";
import { validateFurnitureModel } from "./componentValidation.js";

export const getComponentById = (model, id) => model.components.find((component) => component.id === id) ?? null;
export const getChildren = (model, parentId) => model.components.filter((component) => component.parentId === parentId);
export const getComponentsByType = (model, type) => model.components.filter((component) => component.type === type);
export const getComponentsByRole = (model, role) => model.components.filter((component) => component.role === role);

export function createFurnitureModel({ furnitureType, dimensions, components, generatedPieces }) {
  const rootId = `${furnitureType}.root`;
  const root = createComponent({ id: rootId, type: "section", role: "root", dimensions, position: { xCm: 0, yCm: 0, zCm: 0 }, bounds: boundsFromCenter(dimensions, { xCm: 0, yCm: 0, zCm: 0 }), metadata: { semanticId: rootId } });
  const model = { furnitureType, modelVersion: 1, dimensions: { ...dimensions }, components: [root, ...components] };
  return { ...model, validation: validateFurnitureModel(model, generatedPieces) };
}

export function boundsFromCenter(dimensions, position) {
  if (!dimensions || !position || ![dimensions.widthCm, dimensions.heightCm, dimensions.depthCm, position.xCm, position.yCm, position.zCm].every(Number.isFinite)) return null;
  return { minX: position.xCm - dimensions.widthCm / 2, maxX: position.xCm + dimensions.widthCm / 2, minY: position.yCm - dimensions.heightCm / 2, maxY: position.yCm + dimensions.heightCm / 2, minZ: position.zCm - dimensions.depthCm / 2, maxZ: position.zCm + dimensions.depthCm / 2 };
}
