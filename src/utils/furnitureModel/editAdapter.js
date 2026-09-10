import { calculateWardrobeStructure, normalizeWardrobeSectionWidthRatios } from "../wardrobeStructure.js";
import { getEditableProperties, getWardrobeRatioBounds, resolveWardrobeEditRatios, WARDROBE_BODY_RATIO_INDEX } from "./editableProperties.js";

export const FURNITURE_EDIT_ERROR_CODES = Object.freeze({
  COMPONENT_NOT_EDITABLE: "COMPONENT_NOT_EDITABLE",
  PROPERTY_NOT_EDITABLE: "PROPERTY_NOT_EDITABLE",
  INVALID_VALUE: "INVALID_VALUE",
  CONSTRAINT_VIOLATION: "CONSTRAINT_VIOLATION",
  UNSUPPORTED_FURNITURE_TYPE: "UNSUPPORTED_FURNITURE_TYPE",
});

const failure = (code, message) => ({ ok: false, error: { code, message } });

function redistributeRatios(currentRatios, selectedIndex, selectedRatio, minimumRatios) {
  const next = [...currentRatios];
  const otherIndexes = [0, 1, 2].filter((index) => index !== selectedIndex);
  const remaining = 1 - selectedRatio;
  const otherTotal = otherIndexes.reduce((sum, index) => sum + currentRatios[index], 0);
  const first = otherIndexes[0];
  const second = otherIndexes[1];
  let firstRatio = remaining * (otherTotal > 0 ? currentRatios[first] / otherTotal : .5);
  firstRatio = Math.max(minimumRatios[first], Math.min(remaining - minimumRatios[second], firstRatio));
  next[selectedIndex] = selectedRatio;
  next[first] = firstRatio;
  next[second] = 1 - selectedRatio - firstRatio;
  return normalizeWardrobeSectionWidthRatios(next).ratios;
}

export function applyFurnitureModelEdit({ model, config, edit, context }) {
  if (model?.furnitureType !== "wardrobe") return failure(FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE, "This furniture type does not support controlled FurnitureModel edits.");
  const ratioIndex = WARDROBE_BODY_RATIO_INDEX[edit?.componentId];
  const component = model.components?.find(({ id }) => id === edit?.componentId);
  if (ratioIndex === undefined || component?.type !== "section" || component.role !== "body") return failure(FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE, "The selected component is not editable.");
  const properties = getEditableProperties({ model, componentId: edit.componentId, config, context });
  const property = properties.find(({ key }) => key === edit?.property);
  if (!property) return failure(FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE, "The requested property is not editable.");
  const value = Number(edit.value);
  if (!Number.isFinite(value)) return failure(FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE, "Enter a finite numeric ratio.");
  if (value < property.min || value > property.max) return failure(FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION, `Section width must stay between ${(property.min * 100).toFixed(1)}% and ${(property.max * 100).toFixed(1)}%.`);
  const currentRatios = resolveWardrobeEditRatios(config);
  const minimumRatios = getWardrobeRatioBounds({ model, context }).map(({ min }) => min);
  const nextRatios = redistributeRatios(currentRatios, ratioIndex, value, minimumRatios);
  const nextConfig = { ...config, sectionWidthRatios: nextRatios };
  const structure = calculateWardrobeStructure({
    widthCm: context?.widthCm ?? model.dimensions.widthCm,
    heightCm: context?.heightCm ?? model.dimensions.heightCm,
    depthCm: context?.depthCm ?? model.dimensions.depthCm,
    thicknessCm: context?.thicknessCm,
    bottomThicknessCm: context?.bottomThicknessCm,
    shelves: context?.shelves ?? model.dimensions.shelves,
    drawerDimensions: context?.drawerDimensions,
    wardrobeConfig: nextConfig,
  });
  if (!structure.valid) return failure(FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION, structure.error);
  return { ok: true, nextConfig, appliedEdit: { componentId: edit.componentId, property: property.key, value }, sectionWidthRatios: [...nextRatios] };
}
