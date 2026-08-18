import { calculateDrawerOpenOffsetCm } from "./drawerVisualization.js";
import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM } from "./drawerLimits.js";

export const WARDROBE_LIMITS = { shoeShelves: { min: 2, default: 3, max: 5 }, fixedDrawersPerBody: 3 };
export const SHOE_BOTTOM_SHELF_CLEARANCE_CM = 1;
export const DEFAULT_WARDROBE_CONFIG = {
  upperCompartmentHeightCm: 38,
  drawerRegionHeightCm: 58,
  shoeRegionHeightCm: 68,
  lowerCrossbarHeightCm: 8,
  doorType: "hinged",
  slidingDoorExtensionCm: 3,
  slidingDoorOverlapCm: 4,
  slidingTrackCount: 2,
  slidingDoorClearanceCm: .5,
  slidingLowerSupportHeightCm: 8,
  doorGapCm: .3,
  hingedSectionGapCm: .3,
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
  const backEdgesXCm = [-widthCm / 2, (panelCentersXCm[1] + panelCentersXCm[0]) / 2 + (openingWidthCm + thicknessCm) / 2, (panelCentersXCm[2] + panelCentersXCm[1]) / 2 + (openingWidthCm + thicknessCm) / 2, widthCm / 2];
  const backLayouts = Array.from({ length: 3 }, (_, index) => ({ widthCm: backEdgesXCm[index + 1] - backEdgesXCm[index], centerXCm: (backEdgesXCm[index + 1] + backEdgesXCm[index]) / 2 }));
  const upperCompartmentHeightCm = num(config.upperCompartmentHeightCm, 38);
  const upperShelfYCm = heightCm / 2 - thicknessCm - upperCompartmentHeightCm - thicknessCm / 2;
  const lowerCrossbarHeightCm = num(config.lowerCrossbarHeightCm, 8);
  const lowerStructureTopCm = -heightCm / 2 + lowerCrossbarHeightCm;
  const drawerRegionHeightCm = num(config.drawerRegionHeightCm, 58);
  const drawerGapCm = Math.max(.2, num(config.doorGapCm, .3));
  const drawerFrontHeightCm = (drawerRegionHeightCm - drawerGapCm * (drawersPerBody + 1)) / drawersPerBody;
  const drawerSideHeightCm = drawerFrontHeightCm - 2;
  const drawerShelfYCm = lowerStructureTopCm + drawerRegionHeightCm + thicknessCm / 2;
  const drawerShelfTopCm = drawerShelfYCm + thicknessCm / 2;
  const upperShelfBottomCm = upperShelfYCm - thicknessCm / 2;
  const intermediateFreeHeightCm = upperShelfBottomCm - drawerShelfTopCm - thicknessCm * 2;
  const intermediateGapCm = intermediateFreeHeightCm / 3;
  const intermediateShelfYCentersCm = [
    drawerShelfTopCm + intermediateGapCm + thicknessCm / 2,
    drawerShelfTopCm + intermediateGapCm * 2 + thicknessCm * 1.5,
  ];
  const drawerDepthCm = drawerDimensions?.sideLengthCm || 0;
  const drawerOpenOffsetCm = calculateDrawerOpenOffsetCm(drawerDepthCm, config.showOpenDrawers);
  const drawerLayouts = [0, 2].flatMap((bodyIndex) => Array.from({ length: drawersPerBody }, (_, drawerIndex) => ({
    bodyIndex, drawerIndex,
    centerXCm: bodyCentersXCm[bodyIndex],
    centerYCm: lowerStructureTopCm + drawerGapCm + drawerFrontHeightCm / 2 + drawerIndex * (drawerFrontHeightCm + drawerGapCm),
    centerZCm: depthCm / 2 - drawerDepthCm / 2 + drawerOpenOffsetCm,
  })));
  const shoeRegionHeightCm = num(config.shoeRegionHeightCm, 68);
  const shoeBottomShelfClearanceCm = SHOE_BOTTOM_SHELF_CLEARANCE_CM;
  const shoeBottomShelfYCm = lowerStructureTopCm + shoeBottomShelfClearanceCm + thicknessCm / 2;
  const shoeBottomShelfTopCm = shoeBottomShelfYCm + thicknessCm / 2;
  const shoeUsableHeightCm = shoeRegionHeightCm - shoeBottomShelfClearanceCm - thicknessCm;
  const shoeSpacingCm = shoeUsableHeightCm / (shoeShelfCount + 1);
  const shoeShelfYCentersCm = Array.from({ length: shoeShelfCount }, (_, index) => shoeBottomShelfTopCm + shoeSpacingCm * (index + 1));
  const rodYCm = upperShelfYCm - thicknessCm / 2 - num(config.rodDropCm, 9);
  const body2HangingBottomCm = lowerStructureTopCm + shoeRegionHeightCm;
  const body3HangingBottomCm = drawerShelfYCm + thicknessCm / 2;
  const body2HangingHeightCm = rodYCm - body2HangingBottomCm;
  const body3HangingHeightCm = rodYCm - body3HangingBottomCm;
  const edgeGapCm = Math.max(.1, num(config.doorEdgeGapCm, .2));
  const doorGapCm = Math.max(.2, num(config.doorGapCm, .3));
  const doorWidthCm = (widthCm - edgeGapCm * 2 - doorGapCm * 2) / 3;
  const doorHeightCm = heightCm - edgeGapCm * 2;
  const hingedSectionGapCm = Math.max(.2, num(config.hingedSectionGapCm, .3));
  const hingedTopEdgeCm = heightCm / 2 - edgeGapCm;
  const upperDoorBottomEdgeCm = upperShelfYCm + hingedSectionGapCm / 2;
  const upperDoorHeightCm = hingedTopEdgeCm - upperDoorBottomEdgeCm;
  const upperDoorCenterYCm = (hingedTopEdgeCm + upperDoorBottomEdgeCm) / 2;
  const mainDoorTopEdgeCm = upperShelfYCm - hingedSectionGapCm / 2;
  const sideMainDoorBottomEdgeCm = drawerShelfYCm + thicknessCm / 2 + doorGapCm / 2;
  // The center door finishes above the front crossbar instead of covering it.
  // doorGapCm is the configured frontal clearance (3 mm by default).
  const centerMainDoorBottomEdgeCm = lowerStructureTopCm + doorGapCm;
  const mainDoorHeightsCm = [sideMainDoorBottomEdgeCm, centerMainDoorBottomEdgeCm, sideMainDoorBottomEdgeCm].map((bottom) => mainDoorTopEdgeCm - bottom);
  const mainDoorCentersYCm = [sideMainDoorBottomEdgeCm, centerMainDoorBottomEdgeCm, sideMainDoorBottomEdgeCm].map((bottom) => (mainDoorTopEdgeCm + bottom) / 2);
  const isSlidingDoors = config.doorType === "sliding";
  const slidingDoorExtensionCm = num(config.slidingDoorExtensionCm, 3);
  const slidingDoorOverlapCm = num(config.slidingDoorOverlapCm, 4);
  const slidingTrackCount = Math.max(2, Math.floor(num(config.slidingTrackCount, 2)));
  const slidingDoorClearanceCm = num(config.slidingDoorClearanceCm, .5);
  const slidingLowerSupportHeightCm = num(config.slidingLowerSupportHeightCm, 8);
  const topDepthCm = depthCm + (isSlidingDoors ? slidingDoorExtensionCm : 0);
  const slidingCoverWidthCm = widthCm - slidingDoorClearanceCm * 2;
  const slidingDoorWidthCm = (slidingCoverWidthCm + slidingDoorOverlapCm * 2) / 3;
  const slidingDoorHeightCm = heightCm - thicknessCm - slidingLowerSupportHeightCm - slidingDoorClearanceCm * 2;
  const slidingDoorStepCm = slidingDoorWidthCm - slidingDoorOverlapCm;
  const slidingDoorClosedCentersXCm = [-slidingDoorStepCm, 0, slidingDoorStepCm];
  const slidingDoorOpenOffsetsXCm = [slidingDoorStepCm, -slidingDoorStepCm, -slidingDoorStepCm];
  const drawerBoxWidthCm = Math.max(0, openingWidthCm - (drawerDimensions?.totalClearanceCm || 0));
  const errors = [];
  if (widthCm <= thicknessCm * 4 || heightCm <= thicknessCm * 3 || depthCm <= thicknessCm * 2) errors.push("Las dimensiones exteriores no permiten construir tres cuerpos.");
  if (openingWidthCm < 45) errors.push("Cada cuerpo debe conservar al menos 45 cm de ancho útil.");
  if (upperCompartmentHeightCm < 25 || upperCompartmentHeightCm > heightCm * .3) errors.push("El compartimento superior debe tener una altura útil razonable.");
  if (lowerCrossbarHeightCm < 5 || lowerCrossbarHeightCm >= drawerRegionHeightCm / 2) errors.push("La altura del travesaño inferior debe ser estructuralmente útil y compatible con los cajones.");
  if (shoeShelfCount < WARDROBE_LIMITS.shoeShelves.min || shoeShelfCount > WARDROBE_LIMITS.shoeShelves.max) errors.push(`El zapatero admite entre ${WARDROBE_LIMITS.shoeShelves.min} y ${WARDROBE_LIMITS.shoeShelves.max} repisas.`);
  if (shoeSpacingCm < num(config.minimumShoeSpacingCm, 14)) errors.push("Las repisas del zapatero quedarían demasiado juntas.");
  if (drawerFrontHeightCm < MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM || drawerSideHeightCm < 8) errors.push("Los cajones resultarían demasiado bajos para ser fabricables.");
  if (intermediateGapCm < 20) errors.push("No existe altura suficiente para distribuir simétricamente las repisas intermedias del Cuerpo 1.");
  if (!drawerDimensions?.hasEnoughDepth) errors.push(`La corredera de ${drawerDepthCm.toFixed(1)} cm es demasiado larga para el fondo disponible.`);
  if (body2HangingHeightCm < num(config.minimumHangingHeightCm, 85) || body3HangingHeightCm < num(config.minimumHangingHeightCm, 85)) errors.push("La altura disponible para ropa colgada es insuficiente.");
  if (isSlidingDoors && (slidingDoorExtensionCm <= thicknessCm || slidingDoorOverlapCm <= 0 || slidingDoorClearanceCm < 0)) errors.push("La extensión, solapamiento y holgura del sistema corredizo no son físicamente válidos.");
  if (isSlidingDoors && (slidingLowerSupportHeightCm < 5 || slidingLowerSupportHeightCm >= drawerRegionHeightCm / 2)) errors.push("La altura del soporte inferior del riel no es compatible con el ropero.");
  if (isSlidingDoors && (slidingDoorWidthCm <= 0 || slidingDoorHeightCm <= 0 || slidingDoorStepCm <= 0)) errors.push("Las puertas corredizas no tienen dimensiones útiles.");
  if (!isSlidingDoors && (upperDoorHeightCm <= 0 || mainDoorHeightsCm.some((value) => value <= 0))) errors.push("Las puertas normales no tienen altura suficiente para cubrir sus compartimentos.");
  if (!isSlidingDoors && upperDoorBottomEdgeCm <= mainDoorTopEdgeCm) errors.push("La holgura entre puertas superiores y principales es insuficiente.");
  return {
    config, bodyCount, drawersPerBody, totalDrawers: drawersPerBody * 2, externalWidthCm: widthCm, sideHeightCm, openingWidthCm,
    panelCentersXCm, bodyCentersXCm, backLayouts, upperCompartmentHeightCm, upperShelfYCm,
    lowerCrossbarHeightCm, lowerStructureTopCm, drawerRegionHeightCm, drawerFrontHeightCm, drawerSideHeightCm, drawerShelfYCm,
    intermediateFreeHeightCm, intermediateGapCm, intermediateShelfYCentersCm,
    drawerDepthCm, drawerLayouts, shoeRegionHeightCm, shoeBottomShelfClearanceCm, shoeBottomShelfYCm,
    shoeUsableHeightCm, shoeSpacingCm, shoeShelfYCentersCm,
    rodYCm, body2HangingHeightCm, body3HangingHeightCm, doorWidthCm, doorHeightCm,
    hingedSectionGapCm, upperDoorHeightCm, upperDoorCenterYCm, mainDoorHeightsCm, mainDoorCentersYCm,
    mainDoorBottomEdgesCm: [sideMainDoorBottomEdgeCm, centerMainDoorBottomEdgeCm, sideMainDoorBottomEdgeCm], isSlidingDoors,
    slidingDoorExtensionCm, slidingDoorOverlapCm, slidingTrackCount, slidingDoorClearanceCm,
    slidingLowerSupportHeightCm, topDepthCm, slidingDoorWidthCm, slidingDoorHeightCm,
    slidingDoorStepCm, slidingDoorClosedCentersXCm, slidingDoorOpenOffsetsXCm,
    doorGapCm, edgeGapCm, drawerBoxWidthCm,
    drawerBackWidthCm: Math.max(0, drawerBoxWidthCm - thicknessCm * 2), bottomThicknessCm,
    valid: errors.length === 0, errors, error: errors.join(" "),
  };
}
