export const DRAWER_SLIDE_TYPES = {
  none: { label: "Sin corredera", leftClearanceCm: 0.5, rightClearanceCm: 0.5 },
  telescopic: { label: "Telescópica de bolas", leftClearanceCm: 1.27, rightClearanceCm: 1.27 },
  concealed: { label: "Oculta", leftClearanceCm: 1.05, rightClearanceCm: 1.05 },
  custom: { label: "Personalizada" },
};

export const DRAWER_SLIDE_LENGTHS_MM = [250, 300, 350, 400, 450, 500, 550, 600];

export const DEFAULT_DRAWER_SLIDE_CONFIG = {
  type: "telescopic", lengthMm: 350, concealedClearanceCm: 1.05,
  customLeftClearanceCm: 1.27, customRightClearanceCm: 1.27, useSameCustomClearance: true,
};

const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function getDrawerClearances(config = DEFAULT_DRAWER_SLIDE_CONFIG) {
  const resolved = { ...DEFAULT_DRAWER_SLIDE_CONFIG, ...config };
  if (resolved.type === "concealed") {
    const clearance = Math.max(0, numberOr(resolved.concealedClearanceCm, 1.05));
    return { leftCm: clearance, rightCm: clearance };
  }
  if (resolved.type === "custom") {
    const leftCm = Math.max(0, numberOr(resolved.customLeftClearanceCm, 0));
    const rightCm = resolved.useSameCustomClearance ? leftCm : Math.max(0, numberOr(resolved.customRightClearanceCm, 0));
    return { leftCm, rightCm };
  }
  const preset = DRAWER_SLIDE_TYPES[resolved.type] || DRAWER_SLIDE_TYPES.telescopic;
  return { leftCm: preset.leftClearanceCm, rightCm: preset.rightClearanceCm };
}

export function getDrawerOpeningWidthCm({ furnitureType, widthCm, thicknessCm, drawers, deskConfig }) {
  if (!drawers) return 0;
  if (furnitureType === "desk") return Math.max(0, Number(deskConfig?.drawerModuleWidthCm ?? 40) - thicknessCm * 2);
  if (furnitureType === "tvStand") return Math.min(widthCm * 0.38, 72);
  if (furnitureType === "wardrobe") return Math.max(0, (widthCm - thicknessCm * 4) / 3);
  return widthCm - thicknessCm * 2;
}

export function calculateDrawerSlideDimensions({ furnitureType, widthCm, depthCm, drawers, thicknessCm, drawerSlideConfig, deskConfig }) {
  const config = { ...DEFAULT_DRAWER_SLIDE_CONFIG, ...drawerSlideConfig };
  const { leftCm, rightCm } = getDrawerClearances(config);
  const interiorWidthCm = Math.max(0, getDrawerOpeningWidthCm({ furnitureType, widthCm, thicknessCm, drawers, deskConfig }));
  const externalWidthCm = Math.max(0, interiorWidthCm - leftCm - rightCm);
  const sideLengthCm = numberOr(config.lengthMm, 350) / 10;
  const availableDepthCm = Math.max(0, depthCm - thicknessCm * 2);
  return {
    config,
    typeLabel: DRAWER_SLIDE_TYPES[config.type]?.label || DRAWER_SLIDE_TYPES.telescopic.label,
    leftClearanceCm: leftCm, rightClearanceCm: rightCm, totalClearanceCm: leftCm + rightCm,
    interiorWidthCm, externalWidthCm, backWidthCm: Math.max(0, externalWidthCm - thicknessCm * 2),
    sideLengthCm, availableDepthCm, hasEnoughDepth: !drawers || sideLengthCm <= availableDepthCm,
  };
}
