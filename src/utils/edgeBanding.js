export const EDGE_BANDING_SIDES = ["top", "right", "bottom", "left"];
export const EDGE_BANDING_WASTE_PERCENT = 10;
export const EMPTY_EDGE_BANDING = Object.freeze({ top: false, right: false, bottom: false, left: false });

export function validateEdgeBanding(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...EMPTY_EDGE_BANDING };
  return Object.fromEntries(EDGE_BANDING_SIDES.map((side) => [side, value[side] === true]));
}

export function edgeBandingKey(value) {
  const banding = validateEdgeBanding(value);
  return EDGE_BANDING_SIDES.map((side) => banding[side] ? "1" : "0").join("");
}

export function calculateEdgeBandingLength(piece) {
  if (piece?.material?.id !== "melamine") return 0;
  const banding = validateEdgeBanding(piece.edgeBanding);
  const widthCm = Number(piece.length ?? piece.widthCm ?? 0);
  const heightCm = Number(piece.width ?? piece.heightCm ?? 0);
  const centimeters = (banding.top ? widthCm : 0) + (banding.bottom ? widthCm : 0)
    + (banding.left ? heightCm : 0) + (banding.right ? heightCm : 0);
  return centimeters / 100;
}

export function calculateTotalEdgeBanding(pieces) {
  return (pieces || []).reduce((total, piece) => total + calculateEdgeBandingLength(piece) * (piece.quantity ?? 1), 0);
}

export function edgeBandingSummary(value) {
  const labels = { top: "superior", right: "derecho", bottom: "inferior", left: "izquierdo" };
  return EDGE_BANDING_SIDES.filter((side) => validateEdgeBanding(value)[side]).map((side) => labels[side]);
}

export function sanitizeEdgeBandingConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  return Object.fromEntries(Object.entries(config).flatMap(([pieceId, value]) => {
    const normalized = validateEdgeBanding(value);
    return EDGE_BANDING_SIDES.some((side) => normalized[side]) ? [[pieceId, normalized]] : [];
  }));
}

const ROTATED_EDGE_SIDE = { top: "right", right: "bottom", bottom: "left", left: "top" };

/** Shared screen/export representation. Rotation changes only the visible side. */
export function getEdgeBandingLabels(piece) {
  if (piece?.material?.id !== "melamine") return [];
  const banding = validateEdgeBanding(piece.edgeBanding);
  return EDGE_BANDING_SIDES.filter((side) => banding[side]).map((sourceSide) => {
    const side = piece.rotated ? ROTATED_EDGE_SIDE[sourceSide] : sourceSide;
    return { sourceSide, side, orientation: side === "top" || side === "bottom" ? "horizontal" : "vertical", text: "CANTEO" };
  });
}
