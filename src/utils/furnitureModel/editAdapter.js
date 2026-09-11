import { calculateWardrobeStructure, normalizeWardrobeSectionWidthRatios } from "../wardrobeStructure.js";
import { calculateTvStandStructure, normalizeTvStandSectionWidthRatios } from "../tvStandStructure.js";
import { calculateNightstandStructure, normalizeDrawerHeightRatios } from "../nightstandStructure.js";
import { calculateDeskStructure } from "../deskStructure.js";
import {
  getEditableProperties,
  getNightstandRatioBounds,
  resolveDeskEditConfig,
  getWardrobeRatioBounds,
  NIGHTSTAND_DRAWER_RATIO_INDEX,
  resolveNightstandEditRatios,
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
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
});

const failure = (code, message) => ({ ok: false, error: { code, message } });

export function redistributeRatiosWithFixedIndex(currentRatios, selectedIndex, selectedRatio, minimumRatios) {
  const next = Array(currentRatios.length).fill(0);
  next[selectedIndex] = selectedRatio;
  let remaining = 1 - selectedRatio;
  let active = currentRatios.map((_, index) => index).filter((index) => index !== selectedIndex);
  while (active.length) {
    const weightTotal = active.reduce((sum, index) => sum + Math.max(0, currentRatios[index]), 0);
    const allocations = active.map((index) => [index, remaining * (weightTotal > 0 ? Math.max(0, currentRatios[index]) / weightTotal : 1 / active.length)]);
    const belowMinimum = allocations.filter(([index, ratio]) => ratio < minimumRatios[index]);
    if (!belowMinimum.length) {
      allocations.forEach(([index, ratio]) => { next[index] = ratio; });
      break;
    }
    belowMinimum.forEach(([index]) => { next[index] = minimumRatios[index]; remaining -= minimumRatios[index]; });
    const fixed = new Set(belowMinimum.map(([index]) => index));
    active = active.filter((index) => !fixed.has(index));
  }
  const correctionIndex = currentRatios.map((_, index) => index).findLast((index) => index !== selectedIndex);
  next[correctionIndex] += 1 - next.reduce((sum, ratio) => sum + ratio, 0);
  return next;
}

const CONFIG_MARKERS = Object.freeze({
  wardrobe: ["doorType", "upperCompartmentHeightCm"],
  tvStand: ["shelfHeightCm", "dividerEnabled", "upperRearEnabled", "lowerRearEnabled"],
  nightstand: ["drawerHeightRatios", "rearEnabled", "frontEnabled", "topDrawerGapCm"],
  desk: ["drawerModuleSide", "drawerModuleWidthRatio", "rearCrossbarHeightCm"],
});

function configBelongsToAnotherFurnitureType(config, furnitureType) {
  return Object.entries(CONFIG_MARKERS).some(([type, markers]) => type !== furnitureType && markers.some((key) => Object.hasOwn(config ?? {}, key)));
}

function applyWardrobeWidthRatio({ model, config, edit, context, property, value }) {
  const ratioIndex = WARDROBE_BODY_RATIO_INDEX[edit.componentId];
  const currentRatios = resolveWardrobeEditRatios(config);
  const minimumRatios = getWardrobeRatioBounds({ model, context }).map(({ min }) => min);
  const nextRatios = normalizeWardrobeSectionWidthRatios(redistributeRatiosWithFixedIndex(currentRatios, ratioIndex, value, minimumRatios)).ratios;
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

function applyNightstandHeightRatio({ model, config, edit, context, property, value }) {
  const ratioIndex = NIGHTSTAND_DRAWER_RATIO_INDEX[edit.componentId];
  const drawerCount = Math.max(0, Math.floor(Number(context?.drawers ?? model.dimensions.drawers) || 0));
  const currentRatios = resolveNightstandEditRatios(config, drawerCount);
  const minimumRatios = getNightstandRatioBounds({ model, config, context }).map(({ min }) => min);
  const redistributed = redistributeRatiosWithFixedIndex(currentRatios, ratioIndex, value, minimumRatios);
  const nextRatios = normalizeDrawerHeightRatios(redistributed, drawerCount).ratios;
  const nextConfig = { ...config, drawerHeightRatios: nextRatios };
  const structure = calculateNightstandStructure({
    widthCm: context?.widthCm ?? model.dimensions.widthCm,
    heightCm: context?.heightCm ?? model.dimensions.heightCm,
    depthCm: context?.depthCm ?? model.dimensions.depthCm,
    thicknessCm: context?.thicknessCm,
    drawers: drawerCount,
    drawerFrontConfig: context?.drawerFrontConfig,
    structureConfig: nextConfig,
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

function applyDeskProperty({ model, config, context, property, value }) {
  const resolved = resolveDeskEditConfig(config, model, context);
  const configKey = property.key === "moduleSide" ? "drawerModuleSide" : "drawerModuleWidthRatio";
  const nextConfig = { ...config, ...resolved, [configKey]: value };
  const structure = calculateDeskStructure({
    widthCm: context?.widthCm ?? model.dimensions.widthCm,
    heightCm: context?.heightCm ?? model.dimensions.heightCm,
    depthCm: context?.depthCm ?? model.dimensions.depthCm,
    thicknessCm: context?.thicknessCm,
    bottomThicknessCm: context?.bottomThicknessCm,
    drawers: context?.drawers ?? model.dimensions.drawers,
    drawerDimensions: context?.drawerDimensions,
    deskConfig: nextConfig,
  });
  return { nextConfig: structure.config, structure, property };
}

const EDIT_HANDLERS = Object.freeze({
  wardrobe: { ratioIndexById: WARDROBE_BODY_RATIO_INDEX, role: "body", type: "section", ratioKey: "sectionWidthRatios", apply: applyWardrobeWidthRatio },
  tvStand: { ratioIndexById: TV_STAND_SECTION_RATIO_INDEX, role: "section", type: "section", ratioKey: "sectionWidthRatios", apply: applyTvStandWidthRatio },
  nightstand: { ratioIndexById: NIGHTSTAND_DRAWER_RATIO_INDEX, role: "drawer", type: "drawer", ratioKey: "drawerHeightRatios", apply: applyNightstandHeightRatio },
  desk: { componentIds: Object.freeze({ "desk.drawerModule": true }), role: "drawer-module", type: "section", apply: applyDeskProperty },
});

export function applyFurnitureModelEdit({ model, config, edit, context }) {
  const handler = EDIT_HANDLERS[model?.furnitureType];
  if (!handler) return failure(FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE, "This furniture type does not support controlled FurnitureModel edits.");
  if (configBelongsToAnotherFurnitureType(config, model.furnitureType)) return failure(FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE, "The supplied config does not belong to this furniture type.");
  const editableComponent = handler.componentIds?.[edit?.componentId] ?? handler.ratioIndexById?.[edit?.componentId] !== undefined;
  const component = model.components?.find(({ id }) => id === edit?.componentId);
  if (!editableComponent || component?.type !== handler.type || component.role !== handler.role) return failure(FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE, "The selected component is not editable.");
  const properties = getEditableProperties({ model, componentId: edit.componentId, config, context });
  const property = properties.find(({ key }) => key === edit?.property);
  if (!property) return failure(FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE, "The requested property is not editable.");
  const value = property.type === "number" ? Number(edit.value) : edit.value;
  if (property.type === "number" && !Number.isFinite(value)) return failure(FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE, "Enter a finite numeric ratio.");
  if (property.type === "select" && !property.options.some((option) => option.value === value)) return failure(FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE, `Choose a valid ${property.label.toLowerCase()}.`);
  if (property.type === "number" && (value < property.min || value > property.max)) return failure(FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION, `${property.label} must stay between ${(property.min * 100).toFixed(1)}% and ${(property.max * 100).toFixed(1)}%.`);
  const { nextConfig, nextRatios, structure } = handler.apply({ model, config, edit, context, property, value });
  if (!structure.valid) return failure(FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION, structure.error);
  return { ok: true, nextConfig, appliedEdit: { componentId: edit.componentId, property: property.key, value }, ...(handler.ratioKey ? { [handler.ratioKey]: [...nextRatios] } : {}) };
}
