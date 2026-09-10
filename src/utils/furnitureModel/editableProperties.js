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

export const WARDROBE_BODY_RATIO_INDEX = Object.freeze({
  "wardrobe.body.1": 0,
  "wardrobe.body.2": 1,
  "wardrobe.body.3": 2,
});

export const TV_STAND_SECTION_RATIO_INDEX = Object.freeze({
  "tvStand.section.1": 0,
  "tvStand.section.2": 1,
});

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
  }));
}

const EDITABLE_DEFINITIONS = Object.freeze({
  wardrobe: {
    ratioIndexById: WARDROBE_BODY_RATIO_INDEX,
    componentRole: "body",
    resolveRatios: resolveWardrobeEditRatios,
    getBounds: getWardrobeRatioBounds,
  },
  tvStand: {
    ratioIndexById: TV_STAND_SECTION_RATIO_INDEX,
    componentRole: "section",
    resolveRatios: resolveTvStandEditRatios,
    getBounds: getTvStandRatioBounds,
  },
});

export function getEditableProperties({ model, componentId, config, context }) {
  const definition = EDITABLE_DEFINITIONS[model?.furnitureType];
  if (!definition) return [];
  const component = model.components?.find(({ id }) => id === componentId);
  const ratioIndex = definition.ratioIndexById[component?.id];
  if (component?.type !== "section" || component.role !== definition.componentRole || ratioIndex === undefined) return [];
  const ratios = definition.resolveRatios(config);
  const bounds = definition.getBounds({ model, context })[ratioIndex];
  return [{
    key: "widthRatio",
    label: "Section width",
    type: "number",
    unit: "%",
    min: bounds.min,
    max: bounds.max,
    step: .001,
    value: ratios[ratioIndex],
    metadata: { ratioIndex, minimumWidthCm: bounds.minimumWidthCm },
  }];
}
