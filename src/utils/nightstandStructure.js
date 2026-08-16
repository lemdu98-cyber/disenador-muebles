import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM, NIGHTSTAND_DRAWER_LIMITS } from "./drawerLimits.js";

export const DEFAULT_NIGHTSTAND_STRUCTURE = {
  rearEnabled: true, rearHeightCm: 8, frontEnabled: true,
  frontHeightCm: 6, frontSafetyGapCm: 0.5,
  topDrawerGapCm: 0.5, drawerPhysicalGapCm: 1, drawerBottomThicknessMm: 3,
  showOpenDrawers: false,
};

export const NIGHTSTAND_CROSSBAR_ERROR = "No existe espacio suficiente para instalar el travesaño frontal sin interferir con el cajón inferior.";
export const NIGHTSTAND_DRAWER_SPACE_ERROR = "No existe suficiente espacio vertical para los cajones y las separaciones configuradas.";
const positive = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;

// Practical drawer heights are intentionally local to the nightstand. Structural
// dimensions elsewhere in the application must retain their calculated precision.
export function practicalDrawerHeightCm(value) {
  const height = positive(value, 0);
  const fraction = height - Math.floor(height);
  return Math.abs(fraction - 0.5) < 1e-9 ? height : Math.round(height);
}

/** Physical vertical envelopes used exclusively by the Nightstand 3D assembly. */
export function calculateNightstandDrawerGeometry({
  heightCm, thicknessCm, drawerCount, frontHeightCm, sideHeightCm,
  topGapCm, betweenGapCm, bottomThicknessCm, crossbarHeightCm, crossbarGapCm,
}) {
  const cabinetTopCm = positive(heightCm, 0) / 2;
  const topUndersideCm = cabinetTopCm - positive(thicknessCm, 0);
  const crossbarTopCm = -positive(heightCm, 0) / 2 + positive(crossbarHeightCm, 0);
  const physicalHeightCm = Math.max(positive(frontHeightCm, 0), positive(sideHeightCm, 0));
  const bottomCm = positive(bottomThicknessCm, 0);
  const count = Math.max(0, Math.floor(positive(drawerCount, 0)));
  let nextTopCm = topUndersideCm - positive(topGapCm, 0);
  const drawerLayouts = Array.from({ length: count }, (_, index) => {
    const structureBottomCm = nextTopCm - physicalHeightCm;
    const layout = {
      index,
      topCm: nextTopCm,
      frontCenterYCm: nextTopCm - positive(frontHeightCm, 0) / 2,
      structureCenterYCm: structureBottomCm + positive(sideHeightCm, 0) / 2,
      structureBottomCm,
      bottomCenterYCm: structureBottomCm - bottomCm / 2,
      bottomEdgeCm: structureBottomCm - bottomCm,
      slideCenterYCm: structureBottomCm + positive(sideHeightCm, 0) / 2,
    };
    nextTopCm = layout.bottomEdgeCm - positive(betweenGapCm, 0);
    return layout;
  });
  const lowestEdgeCm = drawerLayouts.at(-1)?.bottomEdgeCm ?? topUndersideCm;
  const clearanceAboveCrossbarCm = lowestEdgeCm - crossbarTopCm;
  const requiredClearanceCm = positive(crossbarGapCm, 0);
  const valid = count === 0 || clearanceAboveCrossbarCm >= requiredClearanceCm - 1e-9;
  return {
    topUndersideCm, crossbarTopCm, physicalHeightCm, bottomThicknessCm: bottomCm,
    topGapCm: positive(topGapCm, 0), betweenGapCm: positive(betweenGapCm, 0),
    clearanceAboveCrossbarCm, requiredClearanceCm, drawerLayouts, valid,
  };
}

export function calculateNightstandStructure({ widthCm = 0, heightCm, depthCm, thicknessCm, drawers, drawerFrontConfig, structureConfig }) {
  const config = { ...DEFAULT_NIGHTSTAND_STRUCTURE, ...structureConfig };
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
  const drawerBoxHeightCm = Math.max(0, drawerSlotHeightCm - 1.2);
  const drawerFrontHeightCm = practicalDrawerHeightCm(Math.max(0, drawerBoxHeightCm - frontGapCm));
  const drawerSideHeightCm = practicalDrawerHeightCm(Math.max(8, drawerBoxHeightCm - 2));
  const drawerGeometry = calculateNightstandDrawerGeometry({
    heightCm, thicknessCm, drawerCount: drawers,
    frontHeightCm: drawerFrontHeightCm, sideHeightCm: drawerSideHeightCm,
    topGapCm: positive(config.topDrawerGapCm, 0.5),
    betweenGapCm: positive(config.drawerPhysicalGapCm, 1),
    bottomThicknessCm: positive(config.drawerBottomThicknessMm, 3) / 10,
    crossbarHeightCm: config.frontEnabled ? frontHeightCm : 0,
    crossbarGapCm: config.frontEnabled ? safetyGapCm : 0,
  });
  const lowestDrawerBottomCm = -heightCm / 2 + requiredBottomSpaceCm + 0.6;
  const frontCrossbarTopCm = -heightCm / 2 + frontHeightCm;
  const hasValidDrawerCount = drawers >= NIGHTSTAND_DRAWER_LIMITS.min && drawers <= NIGHTSTAND_DRAWER_LIMITS.max;
  const hasVerticalSpace = drawerBoxHeightCm >= MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM && drawerGeometry.valid;
  const hasDepthSpace = !config.frontEnabled || frontThicknessCm <= depthCm;
  return {
    config, rearHeightCm, frontHeightCm, frontThicknessCm, safetyGapCm, requiredBottomSpaceCm,
    drawerSlotHeightCm, drawerBoxHeightCm, drawerFrontHeightCm, drawerSideHeightCm,
    drawerFrontWidthCm: positive(widthCm, 0), topDepthCm: positive(depthCm, 0) + positive(thicknessCm, 0),
    frontGapCm, drawerGeometry, lowestDrawerBottomCm, frontCrossbarTopCm,
    verticalClearanceCm: lowestDrawerBottomCm - frontCrossbarTopCm,
    valid: hasValidDrawerCount && hasVerticalSpace && hasDepthSpace,
    error: !hasValidDrawerCount
      ? `La Mesa de Noche admite entre ${NIGHTSTAND_DRAWER_LIMITS.min} y ${NIGHTSTAND_DRAWER_LIMITS.max} cajones.`
      : hasVerticalSpace && hasDepthSpace ? "" : drawerGeometry.valid ? NIGHTSTAND_CROSSBAR_ERROR : NIGHTSTAND_DRAWER_SPACE_ERROR,
  };
}
