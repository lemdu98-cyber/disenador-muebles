import {
  DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS,
  getWardrobeMinimumSectionWidthsCm,
  getWardrobeSectionGeometry,
  normalizeWardrobeSectionWidthRatios,
} from "../wardrobeStructure.js";

export const WARDROBE_BODY_RATIO_INDEX = Object.freeze({
  "wardrobe.body.1": 0,
  "wardrobe.body.2": 1,
  "wardrobe.body.3": 2,
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

export function getEditableProperties({ model, componentId, config, context }) {
  if (model?.furnitureType !== "wardrobe") return [];
  const component = model.components?.find(({ id }) => id === componentId);
  const ratioIndex = WARDROBE_BODY_RATIO_INDEX[component?.id];
  if (component?.type !== "section" || component.role !== "body" || ratioIndex === undefined) return [];
  const ratios = resolveWardrobeEditRatios(config);
  const bounds = getWardrobeRatioBounds({ model, context })[ratioIndex];
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
