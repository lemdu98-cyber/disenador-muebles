import { calculateDrawerOpenOffsetCm } from "./drawerVisualization.js";
import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM } from "./drawerLimits.js";

export const WARDROBE_LIMITS = { shoeShelves: { min: 2, default: 3, max: 5 }, fixedDrawersPerBody: 3 };
export const SHOE_BOTTOM_SHELF_CLEARANCE_CM = 1;
export const DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS = [1 / 3, 1 / 3, 1 / 3];
export const DEFAULT_WARDROBE_CONFIG = {
  sectionWidthRatios: DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS,
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

export function normalizeWardrobeSectionWidthRatios(value) {
  if (!Array.isArray(value) || value.length !== 3) return { ratios: [...DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS], valid: false, error: "La distribución del ropero debe contener exactamente tres proporciones." };
  const numbers = value.map(Number);
  if (numbers.some((ratio) => !Number.isFinite(ratio) || ratio <= 0)) return { ratios: [...DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS], valid: false, error: "Las proporciones de los tres cuerpos deben ser números mayores que cero." };
  const total = numbers.reduce((sum, ratio) => sum + ratio, 0);
  if (!Number.isFinite(total) || total <= 0) return { ratios: [...DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS], valid: false, error: "No se pudo normalizar la distribución de los cuerpos." };
  const ratios = numbers.map((ratio) => ratio / total);
  return { ratios, valid: true, error: "" };
}

/** Ratios describe the three clear internal openings after all four vertical panels. */
export function getWardrobeSectionGeometry({ widthCm, thicknessCm, sectionWidthRatios }) {
  const normalized = normalizeWardrobeSectionWidthRatios(sectionWidthRatios ?? DEFAULT_WARDROBE_SECTION_WIDTH_RATIOS);
  const innerTotalWidthCm = Math.max(0, num(widthCm) - num(thicknessCm) * 4);
  const sectionWidthsCm = normalized.ratios.map((ratio) => innerTotalWidthCm * ratio);
  sectionWidthsCm[2] = innerTotalWidthCm - sectionWidthsCm[0] - sectionWidthsCm[1];
  const leftInnerEdgeCm = -num(widthCm) / 2 + num(thicknessCm);
  const sectionStartXCm = [leftInnerEdgeCm];
  sectionStartXCm[1] = sectionStartXCm[0] + sectionWidthsCm[0] + num(thicknessCm);
  sectionStartXCm[2] = sectionStartXCm[1] + sectionWidthsCm[1] + num(thicknessCm);
  const bodyCentersXCm = sectionStartXCm.map((start, index) => start + sectionWidthsCm[index] / 2);
  const dividerPositionsCm = [sectionStartXCm[1] - num(thicknessCm) / 2, sectionStartXCm[2] - num(thicknessCm) / 2];
  const panelCentersXCm = [-num(widthCm) / 2 + num(thicknessCm) / 2, ...dividerPositionsCm, num(widthCm) / 2 - num(thicknessCm) / 2];
  return { innerTotalWidthCm, sectionWidthsCm, sectionStartXCm, bodyCentersXCm, dividerPositionsCm, panelCentersXCm, sectionWidthRatios: normalized.ratios, ratiosValid: normalized.valid, ratioError: normalized.error };
}

export function calculateWardrobeStructure({ widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm = .3, shelves = 3, drawerDimensions, wardrobeConfig }) {
  const config = { ...DEFAULT_WARDROBE_CONFIG, ...wardrobeConfig };
  const bodyCount = 3;
  const drawersPerBody = WARDROBE_LIMITS.fixedDrawersPerBody;
  const shoeShelfCount = Math.floor(num(shelves, 3));
  const sideHeightCm = heightCm - thicknessCm;
  const sectionGeometry = getWardrobeSectionGeometry({ widthCm, thicknessCm, sectionWidthRatios: config.sectionWidthRatios });
  config.sectionWidthRatios = sectionGeometry.sectionWidthRatios;
  const { innerTotalWidthCm, sectionWidthsCm, sectionStartXCm, bodyCentersXCm, dividerPositionsCm, panelCentersXCm } = sectionGeometry;
  const openingWidthCm = sectionWidthsCm[0];
  const backEdgesXCm = [-widthCm / 2, ...dividerPositionsCm, widthCm / 2];
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
    openingWidthCm: sectionWidthsCm[bodyIndex],
    drawerBoxWidthCm: Math.max(0, sectionWidthsCm[bodyIndex] - (drawerDimensions?.totalClearanceCm || 0)),
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
  const hingedDoorCoverWidthCm = widthCm - edgeGapCm * 2 - doorGapCm * 2;
  const doorWidthsCm = sectionGeometry.sectionWidthRatios.map((ratio) => hingedDoorCoverWidthCm * ratio);
  doorWidthsCm[2] = hingedDoorCoverWidthCm - doorWidthsCm[0] - doorWidthsCm[1];
  const doorWidthCm = doorWidthsCm[0];
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
  const drawerBoxWidthsCm = sectionWidthsCm.map((width) => Math.max(0, width - (drawerDimensions?.totalClearanceCm || 0)));
  const drawerBackWidthsCm = drawerBoxWidthsCm.map((width) => Math.max(0, width - thicknessCm * 2));
  const drawerBoxWidthCm = drawerBoxWidthsCm[0];
  const errors = [];
  if (!sectionGeometry.ratiosValid) errors.push(sectionGeometry.ratioError);
  if (widthCm <= thicknessCm * 4 || heightCm <= thicknessCm * 3 || depthCm <= thicknessCm * 2) errors.push("Las dimensiones exteriores no permiten construir tres cuerpos.");
  const drawerMinimumWidthCm = Math.max(45, (drawerDimensions?.totalClearanceCm || 0) + thicknessCm * 2 + 12);
  if (sectionWidthsCm[0] < drawerMinimumWidthCm) errors.push(`El Cuerpo 1 necesita al menos ${drawerMinimumWidthCm.toFixed(1)} cm interiores para cajones y correderas.`);
  if (sectionWidthsCm[1] < 45) errors.push("El Cuerpo 2 necesita al menos 45 cm interiores para perchero y zapatero.");
  if (sectionWidthsCm[2] < drawerMinimumWidthCm) errors.push(`El Cuerpo 3 necesita al menos ${drawerMinimumWidthCm.toFixed(1)} cm interiores para cajones y correderas.`);
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
    innerTotalWidthCm, sectionWidthsCm, sectionStartXCm, sectionWidthRatios: sectionGeometry.sectionWidthRatios, dividerPositionsCm,
    panelCentersXCm, bodyCentersXCm, backLayouts, upperCompartmentHeightCm, upperShelfYCm,
    lowerCrossbarHeightCm, lowerStructureTopCm, drawerRegionHeightCm, drawerFrontHeightCm, drawerSideHeightCm, drawerShelfYCm,
    intermediateFreeHeightCm, intermediateGapCm, intermediateShelfYCentersCm,
    drawerDepthCm, drawerLayouts, shoeRegionHeightCm, shoeBottomShelfClearanceCm, shoeBottomShelfYCm,
    shoeUsableHeightCm, shoeSpacingCm, shoeShelfYCentersCm,
    rodYCm, body2HangingHeightCm, body3HangingHeightCm, doorWidthCm, doorWidthsCm, doorHeightCm,
    hingedSectionGapCm, upperDoorHeightCm, upperDoorCenterYCm, mainDoorHeightsCm, mainDoorCentersYCm,
    mainDoorBottomEdgesCm: [sideMainDoorBottomEdgeCm, centerMainDoorBottomEdgeCm, sideMainDoorBottomEdgeCm], isSlidingDoors,
    slidingDoorExtensionCm, slidingDoorOverlapCm, slidingTrackCount, slidingDoorClearanceCm,
    slidingLowerSupportHeightCm, topDepthCm, slidingDoorWidthCm, slidingDoorHeightCm,
    slidingDoorStepCm, slidingDoorClosedCentersXCm, slidingDoorOpenOffsetsXCm,
    doorGapCm, edgeGapCm, drawerBoxWidthCm, drawerBoxWidthsCm,
    drawerBackWidthCm: drawerBackWidthsCm[0], drawerBackWidthsCm, bottomThicknessCm,
    valid: errors.length === 0, errors, error: errors.join(" "),
  };
}
