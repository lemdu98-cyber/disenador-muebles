export const DEFAULT_DRAWER_FRONT_CONFIG = {
  type: "overlay",
  sideOverlayCm: 1.27,
  topOverlayCm: 0,
  bottomOverlayCm: 0,
  gapMm: 2,
};

const nonNegative = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};

export function calculateDrawerFrontDimensions({ boxWidthCm, boxFrontHeightCm, drawerFrontConfig }) {
  const config = { ...DEFAULT_DRAWER_FRONT_CONFIG, ...drawerFrontConfig };
  const isOverlay = config.type === "overlay";
  const sideOverlayCm = isOverlay ? nonNegative(config.sideOverlayCm, 1.27) : 0;
  const topOverlayCm = isOverlay ? nonNegative(config.topOverlayCm) : 0;
  const bottomOverlayCm = isOverlay ? nonNegative(config.bottomOverlayCm) : 0;
  const gapCm = nonNegative(config.gapMm, 2) / 10;
  return {
    config,
    widthCm: Math.max(0, boxWidthCm + sideOverlayCm * 2),
    heightCm: Math.max(0, boxFrontHeightCm - gapCm + topOverlayCm + bottomOverlayCm),
    sideOverlayCm,
    topOverlayCm,
    bottomOverlayCm,
    gapCm,
  };
}
