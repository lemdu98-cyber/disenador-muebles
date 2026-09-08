import { validateEdgeBanding } from "./edgeBanding.js";

export const RAW_MELAMINE_EDGE_COLOR = "#e2d5bd";
export const PANEL_ORIENTATIONS = ["horizontal", "front", "side"];
export const BOX_FACE_ORDER = ["right", "left", "top", "bottom", "front", "back"];

const EDGE_FACE_BY_ORIENTATION = {
  // BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
  front: { top: 2, right: 0, bottom: 3, left: 1 },
  horizontal: { top: 5, right: 0, bottom: 4, left: 1 },
  side: { top: 5, right: 2, bottom: 4, left: 3 },
};

export function getPanelEdgeFaceMap(orientation) {
  if (!PANEL_ORIENTATIONS.includes(orientation)) throw new Error(`Orientación de panel desconocida: ${orientation}.`);
  return { ...EDGE_FACE_BY_ORIENTATION[orientation] };
}

export function getMelamineFaceColors({ color, edgeBanding, orientation }) {
  const colors = Array(6).fill(color);
  const banding = validateEdgeBanding(edgeBanding);
  const faceMap = getPanelEdgeFaceMap(orientation);
  for (const side of ["top", "right", "bottom", "left"]) colors[faceMap[side]] = banding[side] ? color : RAW_MELAMINE_EDGE_COLOR;
  return colors;
}
