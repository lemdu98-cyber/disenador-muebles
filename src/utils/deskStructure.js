import { DESK_DRAWER_LIMITS, MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM } from "./drawerLimits.js";

export const DEFAULT_DESK_CONFIG = {
  drawerPosition: "right",
  drawerModuleWidthCm: 40,
  drawerFrontGapCm: 0.3,
  rearCrossbarHeightCm: 10,
  moduleBraceHeightCm: 6,
  showOpenDrawers: false,
};

const numberOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nonNegative = (value, fallback = 0) => Math.max(0, numberOr(value, fallback));

export function calculateDeskStructure({
  widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm = 0.3, drawers, drawerDimensions, deskConfig,
}) {
  const config = { ...DEFAULT_DESK_CONFIG, ...deskConfig };
  const drawerCount = Math.max(0, Math.floor(nonNegative(drawers)));
  const moduleWidthCm = nonNegative(config.drawerModuleWidthCm, 40);
  const frontGapCm = nonNegative(config.drawerFrontGapCm, 0.3);
  const rearCrossbarHeightCm = nonNegative(config.rearCrossbarHeightCm, 10);
  const moduleBraceHeightCm = nonNegative(config.moduleBraceHeightCm, 6);
  const legHeightCm = nonNegative(heightCm - thicknessCm);
  const drawerOpeningWidthCm = moduleWidthCm - thicknessCm * 2;
  const legroomWidthCm = widthCm - moduleWidthCm - thicknessCm;
  const legroomHeightCm = legHeightCm;
  const topClearanceCm = 0.5;
  const braceClearanceCm = 0.5;
  const drawerRegionHeightCm = legHeightCm - moduleBraceHeightCm - topClearanceCm - braceClearanceCm;
  const drawerFrontHeightCm = drawerCount
    ? (drawerRegionHeightCm - frontGapCm * (drawerCount - 1)) / drawerCount
    : 0;
  const drawerSideHeightCm = drawerFrontHeightCm - 2;
  const moduleSign = config.drawerPosition === "left" ? -1 : 1;
  const moduleCenterXCm = moduleSign * (widthCm / 2 - moduleWidthCm / 2);
  const dividerCenterXCm = moduleSign * (widthCm / 2 - moduleWidthCm + thicknessCm / 2);
  const drawerDepthCm = drawerDimensions?.sideLengthCm ?? 0;
  const drawerClosedCenterZCm = depthCm / 2 - drawerDepthCm / 2;
  const drawerOpenOffsetCm = calculateDrawerOpenOffsetCm(drawerDepthCm, config.showOpenDrawers);
  const firstFrontTopCm = heightCm / 2 - thicknessCm - topClearanceCm;
  const drawerLayouts = Array.from({ length: drawerCount }, (_, index) => {
    const frontTopCm = firstFrontTopCm - index * (drawerFrontHeightCm + frontGapCm);
    const frontCenterYCm = frontTopCm - drawerFrontHeightCm / 2;
    const structureCenterYCm = frontCenterYCm;
    const structureBottomCm = structureCenterYCm - drawerSideHeightCm / 2;
    return {
      index,
      frontCenterYCm,
      structureCenterYCm,
      bottomCenterYCm: structureBottomCm - bottomThicknessCm / 2,
      slideCenterYCm: structureCenterYCm,
      centerZCm: drawerClosedCenterZCm + drawerOpenOffsetCm,
    };
  });
  const lowestDrawerEdgeCm = drawerLayouts.length
    ? drawerLayouts.at(-1).bottomCenterYCm - bottomThicknessCm / 2
    : heightCm / 2 - thicknessCm;
  const moduleBraceTopCm = -heightCm / 2 + moduleBraceHeightCm;
  const drawerRearEdgeCm = depthCm / 2 - drawerDepthCm;
  const rearCrossbarFrontCm = -depthCm / 2 + thicknessCm;

  const minimumModuleWidthCm = thicknessCm * 2 + (drawerDimensions?.totalClearanceCm ?? 0) + 12;
  const errors = [];
  if (drawerCount < DESK_DRAWER_LIMITS.min || drawerCount > DESK_DRAWER_LIMITS.max) errors.push(`El Escritorio admite entre ${DESK_DRAWER_LIMITS.min} y ${DESK_DRAWER_LIMITS.max} cajones.`);
  if (widthCm <= 0 || heightCm <= thicknessCm || depthCm <= thicknessCm * 2 || thicknessCm <= 0) errors.push("Las dimensiones estructurales deben ser mayores que cero.");
  if (drawerCount && moduleWidthCm < minimumModuleWidthCm) errors.push(`El módulo de cajones debe medir al menos ${minimumModuleWidthCm.toFixed(1)} cm para alojar caja y correderas.`);
  if (drawerCount && moduleWidthCm > widthCm - thicknessCm - 60) errors.push("El módulo de cajones es demasiado ancho para conservar una zona cómoda para la silla.");
  if (drawerCount && drawerOpeningWidthCm <= (drawerDimensions?.totalClearanceCm ?? 0)) errors.push("El módulo es demasiado angosto para las holguras laterales de las correderas.");
  if (legroomWidthCm < 60) errors.push(`El ancho libre para las piernas es ${Math.max(0, legroomWidthCm).toFixed(1)} cm; se requieren al menos 60 cm.`);
  if (legroomHeightCm < 60) errors.push(`La altura libre para las piernas es ${Math.max(0, legroomHeightCm).toFixed(1)} cm; se requieren al menos 60 cm.`);
  if (drawerCount && drawerFrontHeightCm <= 0) errors.push("No existe altura suficiente para distribuir los frentes de los cajones.");
  if (drawerCount > 1 && frontGapCm <= 0) errors.push("La separación entre frentes debe ser mayor que cero para evitar contacto o superposición.");
  if (drawerCount && drawerFrontHeightCm < MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM) errors.push(`No existe suficiente altura disponible para instalar ${drawerCount} cajones con esta configuración.`);
  if (drawerCount && !drawerDimensions?.hasEnoughDepth) errors.push(`La corredera de ${drawerDepthCm.toFixed(1)} cm es demasiado larga para el fondo disponible.`);
  if (drawerCount && lowestDrawerEdgeCm < moduleBraceTopCm - 1e-9) errors.push("El cajón inferior choca con el refuerzo estructural del módulo.");
  if (drawerCount && drawerRearEdgeCm < rearCrossbarFrontCm - 1e-9) errors.push("Los cajones chocan con el travesaño trasero.");
  if (rearCrossbarHeightCm <= 0 || rearCrossbarHeightCm >= legHeightCm) errors.push("La altura del travesaño trasero no es compatible con la altura del escritorio.");
  if (moduleBraceHeightCm <= 0 || moduleBraceHeightCm >= legHeightCm) errors.push("El refuerzo del módulo no es compatible con la altura del escritorio.");

  return {
    config,
    drawerCount,
    moduleWidthCm,
    moduleCenterXCm,
    dividerCenterXCm,
    drawerOpeningWidthCm,
    drawerFrontWidthCm: moduleWidthCm,
    drawerFrontHeightCm,
    drawerSideHeightCm,
    bottomThicknessCm,
    drawerDepthCm,
    drawerOpenOffsetCm,
    drawerLayouts,
    legHeightCm,
    legroomWidthCm,
    legroomHeightCm,
    rearCrossbarHeightCm,
    moduleBraceHeightCm,
    lowestDrawerEdgeCm,
    moduleBraceTopCm,
    valid: errors.length === 0,
    errors,
    error: errors.join(" "),
  };
}
import { calculateDrawerOpenOffsetCm } from "./drawerVisualization.js";
