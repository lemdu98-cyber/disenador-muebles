export const DEFAULT_TV_STAND_CONFIG = {
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

export function calculateTvStandStructure({ widthCm, heightCm, depthCm, thicknessCm, tvStandConfig }) {
  const config = { ...DEFAULT_TV_STAND_CONFIG, ...tvStandConfig };
  const sideHeightCm = heightCm - thicknessCm;
  const innerWidthCm = widthCm - thicknessCm * 2;
  const dividerHeightCm = heightCm - thicknessCm * 2;
  const shelfDepthCm = depthCm - thicknessCm;
  const shelfHeightCm = nonNegative(config.shelfHeightCm, 27.5);
  const upperRearHeightCm = nonNegative(config.upperRearHeightCm, 6);
  const lowerRearHeightCm = nonNegative(config.lowerRearHeightCm, 6);
  const shelfSpanCm = config.dividerEnabled ? (innerWidthCm - thicknessCm) / 2 : innerWidthCm;
  const shelfCenterYCm = -heightCm / 2 + shelfHeightCm - thicknessCm / 2;
  const lowerClearHeightCm = shelfHeightCm - thicknessCm * 2;
  const upperClearHeightCm = heightCm - thicknessCm - shelfHeightCm;
  const upperRearBottomCm = heightCm - thicknessCm - upperRearHeightCm;
  const lowerRearTopCm = thicknessCm + lowerRearHeightCm;
  const errors = [];
  const warnings = [];

  if (widthCm <= thicknessCm * 3 || heightCm <= thicknessCm * 3 || depthCm <= thicknessCm * 2 || thicknessCm <= 0) {
    errors.push("Las dimensiones exteriores no permiten construir la estructura con el espesor configurado.");
  }
  if (shelfSpanCm <= 0 || shelfDepthCm <= 0 || dividerHeightCm <= 0) errors.push("Una o más piezas tienen dimensiones negativas o iguales a cero.");
  if (lowerClearHeightCm < 12) errors.push("La repisa interior deja un espacio inferior menor a 12 cm.");
  if (upperClearHeightCm < 12) errors.push("La repisa interior deja un espacio superior menor a 12 cm.");
  if (config.upperRearEnabled && (upperRearHeightCm <= 0 || upperRearHeightCm >= dividerHeightCm)) errors.push("La altura del travesaño trasero superior no es válida.");
  if (config.lowerRearEnabled && (lowerRearHeightCm <= 0 || lowerRearHeightCm >= dividerHeightCm)) errors.push("La altura del travesaño trasero inferior no es válida.");
  if (config.upperRearEnabled && config.lowerRearEnabled && lowerRearTopCm >= upperRearBottomCm) errors.push("Los travesaños traseros superior e inferior se superponen.");
  if (!config.dividerEnabled && widthCm > 120) warnings.push("La luz libre de la tapa es elevada. Se recomienda utilizar el divisor central para reducir la flexión de la melamina.");
  if (config.dividerEnabled && shelfSpanCm > 100) warnings.push("La luz de las repisas supera 100 cm; considere reducir el ancho total o agregar más apoyos.");

  return {
    config,
    sideHeightCm,
    innerWidthCm,
    dividerHeightCm,
    shelfDepthCm,
    shelfHeightCm,
    shelfCenterYCm,
    shelfSpanCm,
    lowerClearHeightCm,
    upperClearHeightCm,
    upperRearHeightCm,
    lowerRearHeightCm,
    valid: errors.length === 0,
    errors,
    warnings,
    error: errors.join(" "),
    warning: warnings.join(" "),
  };
}
