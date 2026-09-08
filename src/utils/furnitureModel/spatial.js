/** Domain orientation mirrors the existing MelaminePanel convention. Dimensions retain cut-list semantics: width=piece.length, height=thickness, depth=piece.width. */
export const COMPONENT_ORIENTATIONS = Object.freeze(["horizontal", "front", "side"]);
export const isComponentOrientation = (value) => COMPONENT_ORIENTATIONS.includes(value);
export function getComponentBounds({ position, dimensions, orientation = "horizontal" }) {
  if (!position || !dimensions || ![position.xCm, position.yCm, position.zCm, dimensions.widthCm, dimensions.heightCm, dimensions.depthCm].every(Number.isFinite)) return null;
  const [x, y, z] = orientation === "front" ? [dimensions.widthCm, dimensions.depthCm, dimensions.heightCm] : orientation === "side" ? [dimensions.heightCm, dimensions.widthCm, dimensions.depthCm] : [dimensions.widthCm, dimensions.heightCm, dimensions.depthCm];
  return { minX: position.xCm - x / 2, maxX: position.xCm + x / 2, minY: position.yCm - y / 2, maxY: position.yCm + y / 2, minZ: position.zCm - z / 2, maxZ: position.zCm + z / 2 };
}
export function isComponentCompatibleWithCutPiece(component, piece, epsilon = 1e-6) {
  if (!component?.dimensions || !piece) return false;
  const close = (a, b) => Math.abs(a - b) <= epsilon;
  return close(component.dimensions.widthCm, piece.length) && close(component.dimensions.depthCm, piece.width);
}
