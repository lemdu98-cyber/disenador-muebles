import { calculateDrawerOpenOffsetCm } from "./drawerVisualization.js";
import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM } from "./drawerLimits.js";

export const WARDROBE_LIMITS = { shelves: { min: 2, default: 3, max: 6 }, drawers: { min: 2, default: 2, max: 4 } };
export const DEFAULT_WARDROBE_CONFIG = {
  leftZoneWidthCm: 70,
  drawerRegionHeightCm: 52,
  doorGapCm: 0.3,
  doorEdgeGapCm: 0.2,
  hangingShelfDropCm: 35,
  rodDropCm: 8,
  minimumHangingWidthCm: 65,
  minimumShelfSpacingCm: 24,
  showOpenDoors: false,
  showOpenDrawers: false,
  showStructure: false,
};

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function calculateWardrobeStructure({ widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm = .3, drawers, shelves, drawerDimensions, wardrobeConfig }) {
  const config = { ...DEFAULT_WARDROBE_CONFIG, ...wardrobeConfig };
  const drawerCount = Math.floor(n(drawers));
  const shelfCount = Math.floor(n(shelves));
  const innerWidthCm = widthCm - thicknessCm * 2;
  const sideHeightCm = heightCm - thicknessCm;
  const innerHeightCm = heightCm - thicknessCm * 2;
  const leftOpeningWidthCm = n(config.leftZoneWidthCm, 70);
  const dividerCenterXCm = -widthCm / 2 + thicknessCm + leftOpeningWidthCm + thicknessCm / 2;
  const rightOpeningWidthCm = innerWidthCm - leftOpeningWidthCm - thicknessCm;
  const leftCenterXCm = -widthCm / 2 + thicknessCm + leftOpeningWidthCm / 2;
  const rightCenterXCm = dividerCenterXCm + thicknessCm / 2 + rightOpeningWidthCm / 2;
  const drawerRegionHeightCm = n(config.drawerRegionHeightCm, 52);
  const drawerGapCm = Math.max(.2, n(config.doorGapCm, .3));
  const drawerFrontHeightCm = (drawerRegionHeightCm - drawerGapCm * (drawerCount + 1)) / drawerCount;
  const drawerSideHeightCm = drawerFrontHeightCm - 2;
  const shelfRegionHeightCm = innerHeightCm - drawerRegionHeightCm - thicknessCm;
  const shelfSpacingCm = shelfRegionHeightCm / (shelfCount + 1);
  const shelfYCentersCm = Array.from({ length: shelfCount }, (_, index) => -heightCm / 2 + thicknessCm + drawerRegionHeightCm + thicknessCm + shelfSpacingCm * (index + 1));
  const drawerDepthCm = drawerDimensions?.sideLengthCm || 0;
  const drawerOpenOffsetCm = calculateDrawerOpenOffsetCm(drawerDepthCm, config.showOpenDrawers);
  const drawerLayouts = Array.from({ length: drawerCount }, (_, index) => ({
    index,
    centerYCm: -heightCm / 2 + thicknessCm + drawerGapCm + drawerFrontHeightCm / 2 + index * (drawerFrontHeightCm + drawerGapCm),
    centerZCm: depthCm / 2 - drawerDepthCm / 2 + drawerOpenOffsetCm,
  }));
  const hangingShelfYCm = heightCm / 2 - thicknessCm - n(config.hangingShelfDropCm, 35);
  const rodYCm = hangingShelfYCm - thicknessCm / 2 - n(config.rodDropCm, 8);
  const doorGapCm = Math.max(.2, n(config.doorGapCm, .3));
  const edgeGapCm = Math.max(.1, n(config.doorEdgeGapCm, .2));
  const doorWidthCm = (widthCm - edgeGapCm * 2 - doorGapCm) / 2;
  const doorHeightCm = heightCm - edgeGapCm * 2;
  const errors = [];
  if (widthCm <= thicknessCm * 3 || heightCm <= thicknessCm * 2 || depthCm <= thicknessCm * 2) errors.push("Las dimensiones exteriores no permiten construir la carcasa del ropero.");
  if (leftOpeningWidthCm < 45) errors.push("La zona de repisas y cajones debe medir al menos 45 cm.");
  if (rightOpeningWidthCm < n(config.minimumHangingWidthCm, 65)) errors.push("La zona destinada a ropa colgada es demasiado estrecha.");
  if (drawerCount < WARDROBE_LIMITS.drawers.min || drawerCount > WARDROBE_LIMITS.drawers.max) errors.push(`El Ropero admite entre ${WARDROBE_LIMITS.drawers.min} y ${WARDROBE_LIMITS.drawers.max} cajones.`);
  if (shelfCount < WARDROBE_LIMITS.shelves.min || shelfCount > WARDROBE_LIMITS.shelves.max) errors.push(`El Ropero admite entre ${WARDROBE_LIMITS.shelves.min} y ${WARDROBE_LIMITS.shelves.max} repisas izquierdas.`);
  if (drawerFrontHeightCm < MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM || drawerSideHeightCm < 8) errors.push("No existe altura suficiente para cajones prácticos en la zona inferior izquierda.");
  if (shelfSpacingCm < n(config.minimumShelfSpacingCm, 24)) errors.push("Las repisas izquierdas quedarían demasiado juntas para ser útiles.");
  if (!drawerDimensions?.hasEnoughDepth) errors.push(`La corredera de ${drawerDepthCm.toFixed(1)} cm es demasiado larga para el fondo disponible.`);
  if (hangingShelfYCm <= rodYCm || rodYCm <= -heightCm / 2 + thicknessCm) errors.push("La repisa superior y el perchero no caben en la altura disponible.");
  return {
    config, innerWidthCm, innerHeightCm, sideHeightCm, leftOpeningWidthCm, rightOpeningWidthCm,
    dividerCenterXCm, leftCenterXCm, rightCenterXCm, drawerRegionHeightCm, drawerFrontHeightCm,
    drawerSideHeightCm, drawerDepthCm, drawerLayouts, shelfRegionHeightCm, shelfYCentersCm,
    hangingShelfYCm, rodYCm, doorWidthCm, doorHeightCm, doorGapCm, edgeGapCm,
    drawerBoxWidthCm: Math.max(0, leftOpeningWidthCm - (drawerDimensions?.totalClearanceCm || 0)),
    drawerBackWidthCm: Math.max(0, leftOpeningWidthCm - (drawerDimensions?.totalClearanceCm || 0) - thicknessCm * 2),
    bottomThicknessCm, valid: errors.length === 0, errors, error: errors.join(" "),
  };
}
