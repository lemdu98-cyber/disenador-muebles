import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM, NIGHTSTAND_DRAWER_LIMITS } from "./drawerLimits.js";
import { snapDistributedDimensions } from "./manufacturingGrid.js";

export const DEFAULT_NIGHTSTAND_STRUCTURE = {
  rearEnabled: true, rearHeightCm: 8, frontEnabled: true,
  frontHeightCm: 6, frontSafetyGapCm: 0.5,
  topDrawerGapCm: 0.5, drawerPhysicalGapCm: 1, drawerBottomThicknessMm: 3,
  drawerHeightRatios: [0.5, 0.5], showOpenDrawers: false,
};

export const NIGHTSTAND_CROSSBAR_ERROR = "No existe espacio suficiente para instalar el travesaño frontal sin interferir con el cajón inferior.";
export const NIGHTSTAND_DRAWER_SPACE_ERROR = "No existe suficiente espacio vertical para los cajones y las separaciones configuradas.";
const positive = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;

export function equalDrawerHeightRatios(drawerCount) {
  const count = Math.max(0, Math.floor(Number(drawerCount) || 0));
  return count ? Array(count).fill(1 / count) : [];
}

export function normalizeDrawerHeightRatios(value, drawerCount) {
  const fallback = equalDrawerHeightRatios(drawerCount);
  if (!Array.isArray(value) || value.length !== fallback.length || value.some((ratio) => !Number.isFinite(Number(ratio)) || Number(ratio) <= 0)) return { valid: false, ratios: fallback };
  const total = value.reduce((sum, ratio) => sum + Number(ratio), 0);
  if (!(total > 0)) return { valid: false, ratios: fallback };
  const ratios = value.map((ratio) => Number(ratio) / total);
  ratios[ratios.length - 1] = 1 - ratios.slice(0, -1).reduce((sum, ratio) => sum + ratio, 0);
  return { valid: true, ratios };
}

export function practicalDrawerHeightCm(value) {
  const height = positive(value, 0);
  const fraction = height - Math.floor(height);
  return Math.abs(fraction - 0.5) < 1e-9 ? height : Math.round(height);
}

/** Single source of truth for every physical vertical envelope in the Nightstand. */
export function calculateNightstandDrawerGeometry({
  heightCm, thicknessCm, drawerCount, frontHeightsCm, sideHeightsCm,
  frontHeightCm, sideHeightCm, topGapCm, betweenGapCm, bottomThicknessCm, crossbarHeightCm, crossbarGapCm,
}) {
  const cabinetTopCm = positive(heightCm, 0) / 2;
  const topUndersideCm = cabinetTopCm - positive(thicknessCm, 0);
  const crossbarTopCm = -positive(heightCm, 0) / 2 + positive(crossbarHeightCm, 0);
  const bottomCm = positive(bottomThicknessCm, 0);
  const count = Math.max(0, Math.floor(positive(drawerCount, 0)));
  const fronts = Array.isArray(frontHeightsCm) ? frontHeightsCm : Array(count).fill(positive(frontHeightCm, 0));
  const sides = Array.isArray(sideHeightsCm) ? sideHeightsCm : Array(count).fill(positive(sideHeightCm, 0));
  let nextTopCm = topUndersideCm - positive(topGapCm, 0);
  const drawerLayouts = Array.from({ length: count }, (_, index) => {
    const currentFrontHeightCm = positive(fronts[index], 0);
    const currentSideHeightCm = positive(sides[index], 0);
    const physicalHeightCm = Math.max(currentFrontHeightCm, currentSideHeightCm);
    const structureBottomCm = nextTopCm - physicalHeightCm;
    const layout = {
      index, topCm: nextTopCm, frontHeightCm: currentFrontHeightCm, sideHeightCm: currentSideHeightCm,
      boxHeightCm: currentFrontHeightCm + 0.3, physicalHeightCm,
      frontCenterYCm: nextTopCm - currentFrontHeightCm / 2,
      structureCenterYCm: structureBottomCm + currentSideHeightCm / 2,
      structureBottomCm, bottomCenterYCm: structureBottomCm - bottomCm / 2,
      bottomEdgeCm: structureBottomCm - bottomCm, slideCenterYCm: structureBottomCm + currentSideHeightCm / 2,
      topBoundaryCm: nextTopCm, bottomBoundaryCm: structureBottomCm - bottomCm,
    };
    nextTopCm = layout.bottomEdgeCm - positive(betweenGapCm, 0);
    return layout;
  });
  const lowestEdgeCm = drawerLayouts.at(-1)?.bottomEdgeCm ?? topUndersideCm;
  const clearanceAboveCrossbarCm = lowestEdgeCm - crossbarTopCm;
  const requiredClearanceCm = positive(crossbarGapCm, 0);
  const valid = count === 0 || clearanceAboveCrossbarCm >= requiredClearanceCm - 1e-9;
  return { topUndersideCm, crossbarTopCm, bottomThicknessCm: bottomCm, topGapCm: positive(topGapCm, 0), betweenGapCm: positive(betweenGapCm, 0), clearanceAboveCrossbarCm, requiredClearanceCm, drawerLayouts, valid };
}

export function calculateNightstandStructure({ widthCm = 0, heightCm, depthCm, thicknessCm, drawers, drawerFrontConfig, structureConfig }) {
  const config = { ...DEFAULT_NIGHTSTAND_STRUCTURE, ...structureConfig };
  const ratioResult = normalizeDrawerHeightRatios(config.drawerHeightRatios, drawers);
  const ratioWasProvided = structureConfig?.drawerHeightRatios !== undefined;
  config.drawerHeightRatios = ratioResult.ratios;
  const rearHeightCm = positive(config.rearHeightCm, 8);
  const frontHeightCm = positive(config.frontHeightCm, 6);
  const frontThicknessCm = positive(thicknessCm, 0);
  const safetyGapCm = positive(config.frontSafetyGapCm, 0.5);
  const frontGapCm = positive(drawerFrontConfig?.gapMm, 2) / 10;
  const bottomOverlayCm = drawerFrontConfig?.type === "overlay" ? positive(drawerFrontConfig.bottomOverlayCm, 0) : 0;
  const frontBottomExtensionCm = Math.max(0, bottomOverlayCm - frontGapCm / 2);
  const requiredBottomSpaceCm = config.frontEnabled ? frontHeightCm + safetyGapCm + frontBottomExtensionCm : 4.5;
  const usableHeightCm = Math.max(0, heightCm - thicknessCm);
  const drawerSlotHeightCm = drawers ? (usableHeightCm - requiredBottomSpaceCm) / drawers : 0;
  const legacyDrawerBoxHeightCm = Math.max(0, drawerSlotHeightCm - 1.2);
  const legacyDrawerFrontHeightCm = practicalDrawerHeightCm(Math.max(0, legacyDrawerBoxHeightCm - frontGapCm));
  const distributableFrontHeightCm = legacyDrawerFrontHeightCm * drawers;
  const drawerFrontHeightsCm = snapDistributedDimensions(ratioResult.ratios.map((ratio) => distributableFrontHeightCm * ratio), distributableFrontHeightCm);
  const boxDeltaCm = Math.max(0, legacyDrawerBoxHeightCm - legacyDrawerFrontHeightCm);
  const drawerBoxHeightsCm = drawerFrontHeightsCm.map((height) => height + boxDeltaCm);
  const drawerSideHeightsCm = drawerBoxHeightsCm.map((height) => practicalDrawerHeightCm(Math.max(8, height - 2)));
  const drawerGeometry = calculateNightstandDrawerGeometry({ heightCm, thicknessCm, drawerCount: drawers, frontHeightsCm: drawerFrontHeightsCm, sideHeightsCm: drawerSideHeightsCm, topGapCm: positive(config.topDrawerGapCm, 0.5), betweenGapCm: positive(config.drawerPhysicalGapCm, 1), bottomThicknessCm: positive(config.drawerBottomThicknessMm, 3) / 10, crossbarHeightCm: config.frontEnabled ? frontHeightCm : 0, crossbarGapCm: config.frontEnabled ? safetyGapCm : 0 });
  const lowestDrawerBottomCm = -heightCm / 2 + requiredBottomSpaceCm + 0.6;
  const frontCrossbarTopCm = -heightCm / 2 + frontHeightCm;
  const hasValidDrawerCount = drawers >= NIGHTSTAND_DRAWER_LIMITS.min && drawers <= NIGHTSTAND_DRAWER_LIMITS.max;
  const invalidDrawerIndex = drawerFrontHeightsCm.findIndex((height, index) => height < MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM || drawerSideHeightsCm[index] < 8);
  const hasVerticalSpace = legacyDrawerBoxHeightCm >= MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM && invalidDrawerIndex < 0 && drawerGeometry.valid;
  const hasDepthSpace = !config.frontEnabled || frontThicknessCm <= depthCm;
  const ratiosValid = !ratioWasProvided || ratioResult.valid;
  const valid = hasValidDrawerCount && hasVerticalSpace && hasDepthSpace && ratiosValid;
  return {
    config, rearHeightCm, frontHeightCm, frontThicknessCm, safetyGapCm, requiredBottomSpaceCm, usableHeightCm,
    drawerSlotHeightCm, drawerBoxHeightCm: legacyDrawerBoxHeightCm, drawerFrontHeightCm: legacyDrawerFrontHeightCm, drawerSideHeightCm: drawerSideHeightsCm[0] ?? 0,
    distributableFrontHeightCm, drawerFrontHeightsCm, drawerBoxHeightsCm, drawerSideHeightsCm,
    drawerFrontWidthCm: positive(widthCm, 0), topDepthCm: positive(depthCm, 0) + positive(thicknessCm, 0), frontGapCm, drawerGeometry,
    lowestDrawerBottomCm, frontCrossbarTopCm, verticalClearanceCm: lowestDrawerBottomCm - frontCrossbarTopCm,
    invalidDrawerIndex, valid,
    error: !hasValidDrawerCount ? `La Mesa de Noche admite entre ${NIGHTSTAND_DRAWER_LIMITS.min} y ${NIGHTSTAND_DRAWER_LIMITS.max} cajones.`
      : !ratiosValid ? `La distribución vertical debe contener exactamente ${drawers} proporciones positivas.`
        : invalidDrawerIndex >= 0 ? `Cajón ${invalidDrawerIndex + 1} demasiado bajo para la configuración actual.`
          : hasVerticalSpace && hasDepthSpace ? "" : drawerGeometry.valid ? NIGHTSTAND_CROSSBAR_ERROR : NIGHTSTAND_DRAWER_SPACE_ERROR,
  };
}
