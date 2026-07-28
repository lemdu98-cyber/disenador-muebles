/**
 * Calculates a hardboard drawer bottom mounted below the complete drawer box.
 * Inputs and outputs use the caller's unit (cm in manufacturing, m in 3D).
 */
export function calculateDrawerBottomDimensions({
  externalWidth,
  externalDepth,
  internalWidth,
  internalDepth,
  panelThickness = 0,
  bottomThickness = 0,
  mountingType = "bottom-overlay",
  drawerHeight = 0,
}) {
  if (mountingType !== "bottom-overlay") {
    throw new Error(`Unsupported drawer bottom mounting: ${mountingType}`);
  }

  const width = externalWidth ?? internalWidth + panelThickness * 2;
  const depth = externalDepth ?? internalDepth + panelThickness * 2;

  return {
    width: Math.max(0, width),
    depth: Math.max(0, depth),
    thickness: Math.max(0, bottomThickness),
    mounting: mountingType,
    location: "Parte inferior exterior del cajón",
    installation: "Clavado sobre los cuatro cantos inferiores",
    centerY: -(drawerHeight / 2 + bottomThickness / 2),
  };
}
