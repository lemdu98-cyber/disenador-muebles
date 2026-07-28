/**
 * Calculates one rear-overlay back panel for manufacturing and 3D rendering.
 * Inputs and outputs use the caller's unit (cm for cuts, m for 3D).
 */
export function calculateBackPanelDimensions({
  externalWidth,
  externalHeight,
  innerWidth,
  innerHeight,
  panelThickness = 0,
  backPanelThickness = panelThickness,
  hasTop = true,
  hasBottom = true,
  constructionMode = "external",
  furnitureDepth = 0,
  backPanelMounting = "rear-overlay",
}) {
  if (backPanelMounting !== "rear-overlay") {
    throw new Error(`Unsupported back panel mounting: ${backPanelMounting}`);
  }
  const width = constructionMode === "inner" ? innerWidth + panelThickness * 2 : externalWidth;
  const height = constructionMode === "inner"
    ? innerHeight + (hasTop ? panelThickness : 0) + (hasBottom ? panelThickness : 0)
    : externalHeight;

  return {
    width: Math.max(0, width),
    height: Math.max(0, height),
    thickness: Math.max(0, backPanelThickness),
    mounting: backPanelMounting,
    location: "Parte posterior exterior",
    installation: "Clavado sobre los cantos traseros",
    centerZ: -(furnitureDepth / 2 + backPanelThickness / 2),
  };
}
