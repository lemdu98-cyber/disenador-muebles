export const GRAIN_DIRECTIONS = {
  FREE: "free",
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
};

export function canRotatePiece(piece, settings) {
  if (!settings.allowRotation) return false;
  if (!settings.respectGrain) return true;
  if (typeof piece.grainRequired === "boolean") return !piece.grainRequired;
  // Compatibility with fixed productions created before grainRequired existed.
  return (piece.grainDirection || GRAIN_DIRECTIONS.FREE) === GRAIN_DIRECTIONS.FREE;
}
