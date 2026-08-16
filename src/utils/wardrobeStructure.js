import { calculateDrawerOpenOffsetCm } from "./drawerVisualization.js";
import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM } from "./drawerLimits.js";

export const WARDROBE_LIMITS = { shoeShelves: { min: 2, default: 3, max: 5 }, fixedDrawersPerBody: 3 };
export const DEFAULT_WARDROBE_CONFIG = {
  upperCompartmentHeightCm: 38,
  drawerRegionHeightCm: 58,
  shoeRegionHeightCm: 68,
  doorGapCm: .3,
  doorEdgeGapCm: .2,
  rodDropCm: 9,
  minimumHangingHeightCm: 85,
  minimumShoeSpacingCm: 14,
  showDoors: true,
  showOpenDoors: false,
  showOpenDrawers: false,
  showStructure: false,
};

const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function calculateWardrobeStructure({ widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm = .3, shelves = 3, drawerDimensions, wardrobeConfig }) {
  const config = { ...DEFAULT_WARDROBE_CONFIG, ...wardrobeConfig };
  const bodyCount = 3;
  const drawersPerBody = WARDROBE_LIMITS.fixedDrawersPerBody;
  const shoeShelfCount = Math.floor(num(shelves, 3));
  const sideHeightCm = heightCm - thicknessCm;
  const openingWidthCm = (widthCm - thicknessCm * 4) / bodyCount;
  const panelCentersXCm = Array.from({ length: 4 }, (_, index) => -widthCm / 2 + thicknessCm / 2 + index * (openingWidthCm + thicknessCm));
  const bodyCentersXCm = Array.from({ length: bodyCount }, (_, index) => panelCentersXCm[index] + thicknessCm / 2 + openingWidthCm / 2);
  const topWidthCm = widthCm / bodyCount;
  const topCentersXCm = [-topWidthCm, 0, topWidthCm];
  const backEdgesXCm = [-widthCm / 2, (panelCentersXCm[1] + panelCentersXCm[0]) / 2 + (openingWidthCm + thicknessCm) / 2, (panelCentersXCm[2] + panelCentersXCm[1]) / 2 + (openingWidthCm + thicknessCm) / 2, widthCm / 2];
  const backLayouts = Array.from({ length: 3 }, (_, index) => ({ widthCm: backEdgesXCm[index + 1] - backEdgesXCm[index], centerXCm: (backEdgesXCm[index + 1] + backEdgesXCm[index]) / 2 }));
  const upperCompartmentHeightCm = num(config.upperCompartmentHeightCm, 38);
  const upperShelfYCm = heightCm / 2 - thicknessCm - upperCompartmentHeightCm - thicknessCm / 2;
  const drawerRegionHeightCm = num(config.drawerRegionHeightCm, 58);
  const drawerGapCm = Math.max(.2, num(config.doorGapCm, .3));
  const drawerFrontHeightCm = (drawerRegionHeightCm - drawerGapCm * (drawersPerBody + 1)) / drawersPerBody;
  const drawerSideHeightCm = drawerFrontHeightCm - 2;
  const drawerShelfYCm = -heightCm / 2 + thicknessCm + drawerRegionHeightCm + thicknessCm / 2;
  const drawerDepthCm = drawerDimensions?.sideLengthCm || 0;
  const drawerOpenOffsetCm = calculateDrawerOpenOffsetCm(drawerDepthCm, config.showOpenDrawers);
  const drawerLayouts = [0, 2].flatMap((bodyIndex) => Array.from({ length: drawersPerBody }, (_, drawerIndex) => ({
    bodyIndex, drawerIndex,
    centerXCm: bodyCentersXCm[bodyIndex],
    centerYCm: -heightCm / 2 + thicknessCm + drawerGapCm + drawerFrontHeightCm / 2 + drawerIndex * (drawerFrontHeightCm + drawerGapCm),
    centerZCm: depthCm / 2 - drawerDepthCm / 2 + drawerOpenOffsetCm,
  })));
  const shoeRegionHeightCm = num(config.shoeRegionHeightCm, 68);
  const shoeSpacingCm = shoeRegionHeightCm / (shoeShelfCount + 1);
  const shoeShelfYCentersCm = Array.from({ length: shoeShelfCount }, (_, index) => -heightCm / 2 + thicknessCm + shoeSpacingCm * (index + 1));
  const rodYCm = upperShelfYCm - thicknessCm / 2 - num(config.rodDropCm, 9);
  const body2HangingBottomCm = -heightCm / 2 + thicknessCm + shoeRegionHeightCm;
  const body3HangingBottomCm = drawerShelfYCm + thicknessCm / 2;
  const body2HangingHeightCm = rodYCm - body2HangingBottomCm;
  const body3HangingHeightCm = rodYCm - body3HangingBottomCm;
  const edgeGapCm = Math.max(.1, num(config.doorEdgeGapCm, .2));
  const doorGapCm = Math.max(.2, num(config.doorGapCm, .3));
  const doorWidthCm = (widthCm - edgeGapCm * 2 - doorGapCm * 2) / 3;
  const doorHeightCm = heightCm - edgeGapCm * 2;
  const drawerBoxWidthCm = Math.max(0, openingWidthCm - (drawerDimensions?.totalClearanceCm || 0));
  const errors = [];
  if (widthCm <= thicknessCm * 4 || heightCm <= thicknessCm * 3 || depthCm <= thicknessCm * 2) errors.push("Las dimensiones exteriores no permiten construir tres cuerpos.");
  if (openingWidthCm < 45) errors.push("Cada cuerpo debe conservar al menos 45 cm de ancho útil.");
  if (upperCompartmentHeightCm < 25 || upperCompartmentHeightCm > heightCm * .3) errors.push("El compartimento superior debe tener una altura útil razonable.");
  if (shoeShelfCount < WARDROBE_LIMITS.shoeShelves.min || shoeShelfCount > WARDROBE_LIMITS.shoeShelves.max) errors.push(`El zapatero admite entre ${WARDROBE_LIMITS.shoeShelves.min} y ${WARDROBE_LIMITS.shoeShelves.max} repisas.`);
  if (shoeSpacingCm < num(config.minimumShoeSpacingCm, 14)) errors.push("Las repisas del zapatero quedarían demasiado juntas.");
  if (drawerFrontHeightCm < MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM || drawerSideHeightCm < 8) errors.push("Los cajones resultarían demasiado bajos para ser fabricables.");
  if (!drawerDimensions?.hasEnoughDepth) errors.push(`La corredera de ${drawerDepthCm.toFixed(1)} cm es demasiado larga para el fondo disponible.`);
  if (body2HangingHeightCm < num(config.minimumHangingHeightCm, 85) || body3HangingHeightCm < num(config.minimumHangingHeightCm, 85)) errors.push("La altura disponible para ropa colgada es insuficiente.");
  return {
    config, bodyCount, drawersPerBody, totalDrawers: drawersPerBody * 2, sideHeightCm, openingWidthCm,
    panelCentersXCm, bodyCentersXCm, topWidthCm, topCentersXCm, backLayouts, upperCompartmentHeightCm, upperShelfYCm,
    drawerRegionHeightCm, drawerFrontHeightCm, drawerSideHeightCm, drawerShelfYCm,
    drawerDepthCm, drawerLayouts, shoeRegionHeightCm, shoeSpacingCm, shoeShelfYCentersCm,
    rodYCm, body2HangingHeightCm, body3HangingHeightCm, doorWidthCm, doorHeightCm,
    doorGapCm, edgeGapCm, drawerBoxWidthCm,
    drawerBackWidthCm: Math.max(0, drawerBoxWidthCm - thicknessCm * 2), bottomThicknessCm,
    valid: errors.length === 0, errors, error: errors.join(" "),
  };
}
