import { createComponent } from "./componentFactory.js";
import { validateFurnitureModel } from "./componentValidation.js";

export const getComponentById = (model, id) => model.components.find((component) => component.id === id) ?? null;
export const getChildren = (model, parentId) => model.components.filter((component) => component.parentId === parentId);
export const getComponentsByType = (model, type) => model.components.filter((component) => component.type === type);
export const getComponentsByRole = (model, role) => model.components.filter((component) => component.role === role);

export function createFurnitureModel({ furnitureType, dimensions, components, generatedPieces }) {
  const rootId = `${furnitureType}.root`;
  const root = createComponent({ id: rootId, type: "section", role: "root", dimensions, metadata: { semanticId: rootId } });
  const model = { furnitureType, modelVersion: 1, dimensions: { ...dimensions }, components: [root, ...components] };
  return { ...model, validation: validateFurnitureModel(model, generatedPieces) };
}
