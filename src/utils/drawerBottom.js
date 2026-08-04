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
  const boxDepth = externalDepth ?? internalDepth + panelThickness * 2;
  // Extend only beneath the front panel so the bottom can be nailed around
  // the complete structural perimeter without reaching past the front.
  const depth = boxDepth + panelThickness;

  return {
    width: Math.max(0, width),
    depth: Math.max(0, depth),
    thickness: Math.max(0, bottomThickness),
    mounting: mountingType,
    location: "Parte inferior exterior del cajón",
    installation: "Clavado sobre los cuatro cantos inferiores",
    centerY: -(drawerHeight / 2 + bottomThickness / 2),
    centerZ: panelThickness / 2,
  };
}
