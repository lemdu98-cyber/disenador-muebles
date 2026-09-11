import {
  DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS,
  getWardrobeMinimumSectionWidthsCm,
  getWardrobeSectionGeometry,
  normalizeWardrobeSectionWidthRatios,
} from "../wardrobeStructure.js";
import {
  DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS,
  getTvStandSectionGeometry,
  normalizeTvStandSectionWidthRatios,
  TV_STAND_MINIMUM_SECTION_WIDTH_CM,
} from "../tvStandStructure.js";
import { calculateNightstandStructure, normalizeDrawerHeightRatios } from "../nightstandStructure.js";
import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM, NIGHTSTAND_DRAWER_LIMITS } from "../drawerLimits.js";
import { DEFAULT_DESK_CONFIG, DESK_MINIMUM_LEGROOM_WIDTH_CM, getDeskMinimumDrawerModuleWidthCm, getDeskSectionGeometry } from "../deskStructure.js";
import { snapCutDimension } from "../manufacturingGrid.js";

export const WARDROBE_BODY_RATIO_INDEX = Object.freeze({
  "wardrobe.body.1": 0,
  "wardrobe.body.2": 1,
  "wardrobe.body.3": 2,
});

export const TV_STAND_SECTION_RATIO_INDEX = Object.freeze({
  "tvStand.section.1": 0,
  "tvStand.section.2": 1,
});

export const NIGHTSTAND_DRAWER_RATIO_INDEX = Object.freeze(Object.fromEntries(
  Array.from({ length: NIGHTSTAND_DRAWER_LIMITS.max }, (_, index) => [`nightstand.drawer.${index + 1}`, index]),
));

export function resolveWardrobeEditRatios(config) {
  return normalizeWardrobeSectionWidthRatios(config?.sectionWidthRatios ?? DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS).ratios;
}

export function getWardrobeRatioBounds({ model, context }) {
  const widthCm = Number(context?.widthCm ?? model?.dimensions?.widthCm);
  const thicknessCm = Number(context?.thicknessCm);
  const geometry = getWardrobeSectionGeometry({ widthCm, thicknessCm, sectionWidthRatios: DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS });
  const minimumWidthsCm = getWardrobeMinimumSectionWidthsCm({ thicknessCm, drawerDimensions: context?.drawerDimensions });
  const minimumRatios = minimumWidthsCm.map((width) => width / geometry.innerTotalWidthCm);
  return minimumRatios.map((minimum, index) => ({
    min: minimum,
    max: 1 - minimumRatios.reduce((sum, ratio, otherIndex) => otherIndex === index ? sum : sum + ratio, 0),
    minimumWidthCm: minimumWidthsCm[index],
    minimumMeasurementCm: minimumWidthsCm[index],
    minimumMeasurementLabel: "internal",
  }));
}

export function resolveTvStandEditRatios(config) {
  return normalizeTvStandSectionWidthRatios(config?.sectionWidthRatios ?? DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS).ratios;
}

export function getTvStandRatioBounds({ model, context }) {
  const geometry = getTvStandSectionGeometry({
    widthCm: Number(context?.widthCm ?? model?.dimensions?.widthCm),
    thicknessCm: Number(context?.thicknessCm),
    sectionWidthRatios: DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS,
  });
  const minimumRatio = TV_STAND_MINIMUM_SECTION_WIDTH_CM / geometry.innerOpeningWidthCm;
  return [0, 1].map(() => ({
    min: minimumRatio,
    max: 1 - minimumRatio,
    minimumWidthCm: TV_STAND_MINIMUM_SECTION_WIDTH_CM,
    minimumMeasurementCm: TV_STAND_MINIMUM_SECTION_WIDTH_CM,
    minimumMeasurementLabel: "internal",
  }));
}

const getDrawerCount = (model, context) => Math.max(0, Math.floor(Number(context?.drawers ?? model?.dimensions?.drawers) || 0));

export function resolveNightstandEditRatios(config, drawerCount) {
  return normalizeDrawerHeightRatios(config?.drawerHeightRatios, drawerCount).ratios;
}

export function getNightstandRatioBounds({ model, config, context }) {
  const drawerCount = getDrawerCount(model, context);
  const structure = calculateNightstandStructure({
    widthCm: context?.widthCm ?? model?.dimensions?.widthCm,
    heightCm: context?.heightCm ?? model?.dimensions?.heightCm,
    depthCm: context?.depthCm ?? model?.dimensions?.depthCm,
    thicknessCm: context?.thicknessCm,
    drawers: drawerCount,
    drawerFrontConfig: context?.drawerFrontConfig,
    structureConfig: config,
  });
  const minimumRatio = MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM / structure.distributableFrontHeightCm;
  return Array.from({ length: drawerCount }, () => ({
    min: minimumRatio,
    max: 1 - minimumRatio * (drawerCount - 1),
    minimumHeightCm: MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM,
    minimumMeasurementCm: MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM,
    minimumMeasurementLabel: "front",
  }));
}

export function resolveDeskEditConfig(config, model, context) {
  const geometry = getDeskSectionGeometry({
    widthCm: context?.widthCm ?? model?.dimensions?.widthCm,
    thicknessCm: context?.thicknessCm,
    deskConfig: config ?? DEFAULT_DESK_CONFIG,
  });
  return {
    drawerModuleSide: geometry.drawerModuleSide,
    drawerModuleWidthRatio: geometry.drawerModuleWidthRatio,
  };
}

export function getDeskModuleWidthRatioBounds({ model, context }) {
  const widthCm = Number(context?.widthCm ?? model?.dimensions?.widthCm);
  const thicknessCm = Number(context?.thicknessCm);
  const geometry = getDeskSectionGeometry({ widthCm, thicknessCm, deskConfig: DEFAULT_DESK_CONFIG });
  const minimumModuleWidthCm = getDeskMinimumDrawerModuleWidthCm({ thicknessCm, drawerDimensions: context?.drawerDimensions });
  const minimumOpeningWidthCm = snapCutDimension(minimumModuleWidthCm - thicknessCm * 2, "ceil");
  return {
    min: minimumOpeningWidthCm / geometry.totalOpeningWidthCm,
    max: 1 - DESK_MINIMUM_LEGROOM_WIDTH_CM / geometry.totalOpeningWidthCm,
    minimumModuleWidthCm,
    minimumLegRoomCm: DESK_MINIMUM_LEGROOM_WIDTH_CM,
    minimumMeasurementCm: minimumModuleWidthCm,
    minimumMeasurementLabel: "module",
  };
}

const EDITABLE_DEFINITIONS = Object.freeze({
  wardrobe: {
    ratioIndexById: WARDROBE_BODY_RATIO_INDEX,
    componentRole: "body",
    resolveRatios: resolveWardrobeEditRatios,
    getBounds: getWardrobeRatioBounds,
    propertyKey: "widthRatio",
    propertyLabel: "Section width",
  },
  tvStand: {
    ratioIndexById: TV_STAND_SECTION_RATIO_INDEX,
    componentRole: "section",
    resolveRatios: resolveTvStandEditRatios,
    getBounds: getTvStandRatioBounds,
    propertyKey: "widthRatio",
    propertyLabel: "Section width",
  },
  nightstand: {
    ratioIndexById: NIGHTSTAND_DRAWER_RATIO_INDEX,
    componentRole: "drawer",
    componentType: "drawer",
    resolveRatios: resolveNightstandEditRatios,
    getBounds: getNightstandRatioBounds,
    propertyKey: "heightRatio",
    propertyLabel: "Drawer height",
  },
  desk: {
    componentId: "desk.drawerModule",
    componentRole: "drawer-module",
    properties: ({ model, config, context }) => {
      const resolved = resolveDeskEditConfig(config, model, context);
      const bounds = getDeskModuleWidthRatioBounds({ model, context });
      return [{
        key: "moduleSide",
        label: "Drawer module side",
        type: "select",
        value: resolved.drawerModuleSide,
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      }, {
        key: "moduleWidthRatio",
        label: "Drawer module width",
        type: "number",
        unit: "%",
        min: bounds.min,
        max: bounds.max,
        step: .001,
        value: resolved.drawerModuleWidthRatio,
        metadata: bounds,
      }];
    },
  },
});

export function getEditableProperties({ model, componentId, config, context }) {
  const definition = EDITABLE_DEFINITIONS[model?.furnitureType];
  if (!definition) return [];
  const component = model.components?.find(({ id }) => id === componentId);
  if (definition.properties) {
    if (component?.id !== definition.componentId || component?.type !== (definition.componentType ?? "section") || component.role !== definition.componentRole) return [];
    return definition.properties({ model, config, context });
  }
  const ratioIndex = definition.ratioIndexById[component?.id];
  const drawerCount = getDrawerCount(model, context);
  if (component?.type !== (definition.componentType ?? "section") || component.role !== definition.componentRole || ratioIndex === undefined) return [];
  const ratios = definition.resolveRatios(config, drawerCount);
  if (ratioIndex >= ratios.length) return [];
  const bounds = definition.getBounds({ model, config, context })[ratioIndex];
  return [{
    key: definition.propertyKey,
    label: definition.propertyLabel,
    type: "number",
    unit: "%",
    min: bounds.min,
    max: bounds.max,
    step: .001,
    value: ratios[ratioIndex],
    metadata: { ratioIndex, drawerCount: model.furnitureType === "nightstand" ? drawerCount : undefined, ...bounds },
  }];
}
