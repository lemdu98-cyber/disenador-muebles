export const MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM = 10;
export const DESK_DRAWER_LIMITS = { min: 3, default: 3, max: 5, minimumPracticalHeightCm: MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM };
export const NIGHTSTAND_DRAWER_LIMITS = { min: 2, default: 2, max: 4, minimumPracticalHeightCm: MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM };

export function calculateDeskDrawerCapacity({ heightCm, thicknessCm, deskConfig }) {
  const gapCm = Math.max(0, Number(deskConfig?.drawerFrontGapCm ?? 0.3));
  const braceHeightCm = Math.max(0, Number(deskConfig?.moduleBraceHeightCm ?? 6));
  const availableHeightCm = Math.max(0, Number(heightCm) - Number(thicknessCm) - braceHeightCm - 1);
  const physicallyPossible = Math.floor((availableHeightCm + gapCm) / (MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM + gapCm));
  return { availableHeightCm, maxAllowed: Math.max(0, Math.min(DESK_DRAWER_LIMITS.max, physicallyPossible)) };
}

export function calculateNightstandDrawerCapacity({ heightCm, thicknessCm, drawerFrontConfig, structureConfig }) {
  const frontEnabled = structureConfig?.frontEnabled !== false;
  const frontHeightCm = frontEnabled ? Math.max(0, Number(structureConfig?.frontHeightCm ?? 6)) : 0;
  const safetyGapCm = frontEnabled ? Math.max(0, Number(structureConfig?.frontSafetyGapCm ?? 0.5)) : 0;
  const frontGapCm = Math.max(0, Number(drawerFrontConfig?.gapMm ?? 2) / 10);
  const bottomOverlayCm = drawerFrontConfig?.type === "overlay" ? Math.max(0, Number(drawerFrontConfig?.bottomOverlayCm ?? 0)) : 0;
  const reservedBottomCm = frontEnabled ? frontHeightCm + safetyGapCm + Math.max(0, bottomOverlayCm - frontGapCm / 2) : 4.5;
  const availableHeightCm = Math.max(0, Number(heightCm) - Number(thicknessCm) - reservedBottomCm);
  const physicallyPossible = Math.floor(availableHeightCm / (MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM + 1.2));
  return { availableHeightCm, maxAllowed: Math.max(0, Math.min(NIGHTSTAND_DRAWER_LIMITS.max, physicallyPossible)) };
}
