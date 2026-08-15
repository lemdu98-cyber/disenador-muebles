export const DEFAULT_NIGHTSTAND_STRUCTURE = {
  rearEnabled: true, rearHeightCm: 8, frontEnabled: true,
  frontHeightCm: 6, frontSafetyGapCm: 0.5,
};

export const NIGHTSTAND_CROSSBAR_ERROR = "No existe espacio suficiente para instalar el travesaño frontal sin interferir con el cajón inferior.";
const positive = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;

// Practical drawer heights are intentionally local to the nightstand. Structural
// dimensions elsewhere in the application must retain their calculated precision.
export function practicalDrawerHeightCm(value) {
  const height = positive(value, 0);
  const fraction = height - Math.floor(height);
  return Math.abs(fraction - 0.5) < 1e-9 ? height : Math.round(height);
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
  const lowestDrawerBottomCm = -heightCm / 2 + requiredBottomSpaceCm + 0.6;
  const frontCrossbarTopCm = -heightCm / 2 + frontHeightCm;
  const hasVerticalSpace = !config.frontEnabled || !drawers || drawerBoxHeightCm >= 8;
  const hasDepthSpace = !config.frontEnabled || frontThicknessCm <= depthCm;
  return {
    config, rearHeightCm, frontHeightCm, frontThicknessCm, safetyGapCm, requiredBottomSpaceCm,
    drawerSlotHeightCm, drawerBoxHeightCm, drawerFrontHeightCm, drawerSideHeightCm,
    drawerFrontWidthCm: positive(widthCm, 0), topDepthCm: positive(depthCm, 0) + positive(thicknessCm, 0),
    frontGapCm, lowestDrawerBottomCm, frontCrossbarTopCm,
    verticalClearanceCm: lowestDrawerBottomCm - frontCrossbarTopCm,
    valid: hasVerticalSpace && hasDepthSpace,
    error: hasVerticalSpace && hasDepthSpace ? "" : NIGHTSTAND_CROSSBAR_ERROR,
  };
}
