import { snapDistributedDimensions } from "./manufacturingGrid.js";

export const TV_STAND_MINIMUM_SECTION_WIDTH_CM = 35;
export const DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS = [0.5, 0.5];
export const DEFAULT_TV_STAND_CONFIG = {
  sectionWidthRatios: DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS,
  shelfHeightCm: 27.5,
  dividerEnabled: true,
  upperRearEnabled: true,
  upperRearHeightCm: 6,
  lowerRearEnabled: true,
  lowerRearHeightCm: 6,
  showStructure: false,
};

const nonNegative = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};

// Target distribution requested for each lower half: about 55 cm outside and
// 32 cm beside the central divider at the default 180 cm overall width.
const LOWER_OUTER_SHARE = 55 / (55 + 32);

export function normalizeTvStandSectionWidthRatios(value) {
  if (!Array.isArray(value) || value.length !== 2) return { ratios: [...DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS], valid: false, error: "La distribución del TV Stand debe contener exactamente dos proporciones." };
  const numbers = value.map(Number);
  if (numbers.some((ratio) => !Number.isFinite(ratio) || ratio <= 0)) return { ratios: [...DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS], valid: false, error: "Las proporciones de ambos cuerpos deben ser números mayores que cero." };
  const total = numbers[0] + numbers[1];
  return { ratios: numbers.map((ratio) => ratio / total), valid: true, error: "" };
}

export function getTvStandSectionGeometry({ widthCm, thicknessCm, sectionWidthRatios }) {
  const normalized = normalizeTvStandSectionWidthRatios(sectionWidthRatios ?? DEFAULT_TV_STAND_SECTION_WIDTH_RATIOS);
  const innerOpeningWidthCm = Math.max(0, Number(widthCm) - Number(thicknessCm) * 3);
  const theoreticalSectionWidthsCm = normalized.ratios.map((ratio) => innerOpeningWidthCm * ratio);
  const sectionWidthsCm = snapDistributedDimensions(theoreticalSectionWidthsCm, innerOpeningWidthCm);
  const leftInnerEdgeCm = -Number(widthCm) / 2 + Number(thicknessCm);
  const sectionStartXCm = [leftInnerEdgeCm, leftInnerEdgeCm + sectionWidthsCm[0] + Number(thicknessCm)];
  const sectionCentersXCm = sectionStartXCm.map((start, index) => start + sectionWidthsCm[index] / 2);
  const dividerCenterXCm = sectionStartXCm[1] - Number(thicknessCm) / 2;
  return { innerOpeningWidthCm, theoreticalSectionWidthsCm, sectionWidthsCm, sectionStartXCm, sectionCentersXCm, dividerCenterXCm, sectionWidthRatios: normalized.ratios, ratiosValid: normalized.valid, ratioError: normalized.error };
}

export function calculateTvStandStructure({ widthCm, heightCm, depthCm, thicknessCm, tvStandConfig }) {
  const config = { ...DEFAULT_TV_STAND_CONFIG, ...tvStandConfig };
  const sectionGeometry = getTvStandSectionGeometry({ widthCm, thicknessCm, sectionWidthRatios: config.sectionWidthRatios });
  config.sectionWidthRatios = sectionGeometry.sectionWidthRatios;
  const sideHeightCm = heightCm - thicknessCm;
  const innerWidthCm = widthCm - thicknessCm * 2;
  const dividerHeightCm = heightCm - thicknessCm * 2;
  const shelfDepthCm = depthCm - thicknessCm;
  const shelfHeightCm = nonNegative(config.shelfHeightCm, 27.5);
  const upperRearHeightCm = nonNegative(config.upperRearHeightCm, 6);
  const lowerRearHeightCm = nonNegative(config.lowerRearHeightCm, 6);
  const sectionWidthsCm = config.dividerEnabled ? sectionGeometry.sectionWidthsCm : [innerWidthCm];
  const shelfSpanCm = sectionWidthsCm[0];
  const shelfCenterYCm = -heightCm / 2 + shelfHeightCm - thicknessCm / 2;
  const lowerClearHeightCm = shelfHeightCm - thicknessCm * 2;
  const upperClearHeightCm = heightCm - thicknessCm - shelfHeightCm;
  const upperRearBottomCm = heightCm - thicknessCm - upperRearHeightCm;
  const lowerRearTopCm = thicknessCm + lowerRearHeightCm;
  const supportHeightCm = lowerClearHeightCm;
  const supportDepthCm = shelfDepthCm;
  const lowerCompartmentWidthsCm = sectionWidthsCm.map((span) => {
    const clear = span - thicknessCm;
    const outer = clear * LOWER_OUTER_SHARE;
    return { outer, inner: clear - outer };
  });
  const supportCentersXCm = config.dividerEnabled ? [
    sectionGeometry.sectionStartXCm[0] + lowerCompartmentWidthsCm[0].outer + thicknessCm / 2,
    sectionGeometry.sectionStartXCm[1] + lowerCompartmentWidthsCm[1].inner + thicknessCm / 2,
  ] : [];
  const outerLowerCompartmentWidthCm = lowerCompartmentWidthsCm[0]?.outer ?? 0;
  const innerLowerCompartmentWidthCm = lowerCompartmentWidthsCm[0]?.inner ?? 0;
  const errors = [];
  const warnings = [];
  if (!sectionGeometry.ratiosValid) errors.push(sectionGeometry.ratioError);

  if (widthCm <= thicknessCm * 3 || heightCm <= thicknessCm * 3 || depthCm <= thicknessCm * 2 || thicknessCm <= 0) {
    errors.push("Las dimensiones exteriores no permiten construir la estructura con el espesor configurado.");
  }
  if (shelfSpanCm <= 0 || shelfDepthCm <= 0 || dividerHeightCm <= 0) errors.push("Una o más piezas tienen dimensiones negativas o iguales a cero.");
  if (lowerClearHeightCm < 12) errors.push("La repisa interior deja un espacio inferior menor a 12 cm.");
  if (upperClearHeightCm < 12) errors.push("La repisa interior deja un espacio superior menor a 12 cm.");
  if (config.upperRearEnabled && (upperRearHeightCm <= 0 || upperRearHeightCm >= dividerHeightCm)) errors.push("La altura del travesaño trasero superior no es válida.");
  if (config.lowerRearEnabled && (lowerRearHeightCm <= 0 || lowerRearHeightCm >= dividerHeightCm)) errors.push("La altura del travesaño trasero inferior no es válida.");
  if (config.upperRearEnabled && config.lowerRearEnabled && lowerRearTopCm >= upperRearBottomCm) errors.push("Los travesaños traseros superior e inferior se superponen.");
  if (config.dividerEnabled && sectionWidthsCm.some((width) => width < TV_STAND_MINIMUM_SECTION_WIDTH_CM)) errors.push(`Cada cuerpo debe tener al menos ${TV_STAND_MINIMUM_SECTION_WIDTH_CM} cm interiores.`);
  if (config.dividerEnabled && lowerCompartmentWidthsCm.some(({ outer, inner }) => outer < 12 || inner < 12)) errors.push("Los soportes verticales dejan compartimentos inferiores demasiado angostos.");
  if (!config.dividerEnabled && widthCm > 120) warnings.push("La luz libre de la tapa es elevada. Se recomienda utilizar el divisor central para reducir la flexión de la melamina.");
  if (config.dividerEnabled && shelfSpanCm > 100) warnings.push("La luz de las repisas supera 100 cm; considere reducir el ancho total o agregar más apoyos.");

  return {
    config,
    sectionGeometry,
    sideHeightCm,
    innerWidthCm,
    dividerHeightCm,
    shelfDepthCm,
    shelfHeightCm,
    shelfCenterYCm,
    shelfSpanCm,
    sectionWidthsCm,
    sectionCentersXCm: sectionGeometry.sectionCentersXCm,
    dividerCenterXCm: sectionGeometry.dividerCenterXCm,
    lowerClearHeightCm,
    upperClearHeightCm,
    upperRearHeightCm,
    lowerRearHeightCm,
    supportHeightCm,
    supportDepthCm,
    supportCenterXCm: Math.abs(supportCentersXCm[1] ?? 0),
    supportCentersXCm,
    outerLowerCompartmentWidthCm,
    innerLowerCompartmentWidthCm,
    valid: errors.length === 0,
    errors,
    warnings,
    error: errors.join(" "),
    warning: warnings.join(" "),
  };
}
