import { calculateWardrobeStructure, normalizeWardrobeSectionWidthRatios } from "../wardrobeStructure.js";
import { calculateTvStandStructure, normalizeTvStandSectionWidthRatios } from "../tvStandStructure.js";
import {
  getEditableProperties,
  getWardrobeRatioBounds,
  resolveWardrobeEditRatios,
  TV_STAND_SECTION_RATIO_INDEX,
  WARDROBE_BODY_RATIO_INDEX,
} from "./editableProperties.js";

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

const CONFIG_MARKERS = Object.freeze({
  wardrobe: ["doorType", "upperCompartmentHeightCm"],
  tvStand: ["shelfHeightCm", "dividerEnabled", "upperRearEnabled", "lowerRearEnabled"],
});

function configBelongsToAnotherFurnitureType(config, furnitureType) {
  return Object.entries(CONFIG_MARKERS).some(([type, markers]) => type !== furnitureType && markers.some((key) => Object.hasOwn(config ?? {}, key)));
}

function applyWardrobeWidthRatio({ model, config, edit, context, property, value }) {
  const ratioIndex = WARDROBE_BODY_RATIO_INDEX[edit.componentId];
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
  return { nextConfig, nextRatios, structure, property };
}

function applyTvStandWidthRatio({ model, config, edit, context, property, value }) {
  const ratioIndex = TV_STAND_SECTION_RATIO_INDEX[edit.componentId];
  const nextRatios = ratioIndex === 0 ? [value, 1 - value] : [1 - value, value];
  const normalizedRatios = normalizeTvStandSectionWidthRatios(nextRatios).ratios;
  const nextConfig = { ...config, sectionWidthRatios: normalizedRatios };
  const structure = calculateTvStandStructure({
    widthCm: context?.widthCm ?? model.dimensions.widthCm,
    heightCm: context?.heightCm ?? model.dimensions.heightCm,
    depthCm: context?.depthCm ?? model.dimensions.depthCm,
    thicknessCm: context?.thicknessCm,
    tvStandConfig: nextConfig,
  });
  return { nextConfig, nextRatios: normalizedRatios, structure, property };
}

const EDIT_HANDLERS = Object.freeze({
  wardrobe: { ratioIndexById: WARDROBE_BODY_RATIO_INDEX, role: "body", apply: applyWardrobeWidthRatio },
  tvStand: { ratioIndexById: TV_STAND_SECTION_RATIO_INDEX, role: "section", apply: applyTvStandWidthRatio },
});

export function applyFurnitureModelEdit({ model, config, edit, context }) {
  const handler = EDIT_HANDLERS[model?.furnitureType];
  if (!handler) return failure(FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE, "This furniture type does not support controlled FurnitureModel edits.");
  if (configBelongsToAnotherFurnitureType(config, model.furnitureType)) return failure(FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE, "The supplied config does not belong to this furniture type.");
  const ratioIndex = handler.ratioIndexById[edit?.componentId];
  const component = model.components?.find(({ id }) => id === edit?.componentId);
  if (ratioIndex === undefined || component?.type !== "section" || component.role !== handler.role) return failure(FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE, "The selected component is not editable.");
  const properties = getEditableProperties({ model, componentId: edit.componentId, config, context });
  const property = properties.find(({ key }) => key === edit?.property);
  if (!property) return failure(FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE, "The requested property is not editable.");
  const value = Number(edit.value);
  if (!Number.isFinite(value)) return failure(FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE, "Enter a finite numeric ratio.");
  if (value < property.min || value > property.max) return failure(FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION, `Section width must stay between ${(property.min * 100).toFixed(1)}% and ${(property.max * 100).toFixed(1)}%.`);
  const { nextConfig, nextRatios, structure } = handler.apply({ model, config, edit, context, property, value });
  if (!structure.valid) return failure(FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION, structure.error);
  return { ok: true, nextConfig, appliedEdit: { componentId: edit.componentId, property: property.key, value }, sectionWidthRatios: [...nextRatios] };
}
