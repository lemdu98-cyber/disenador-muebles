/**
 * Closed structural drawer geometry in centimetres. It is deliberately React/
 * Three-free and preserves the local layout previously rendered by Drawer.
 */
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const part = (position, dimensions, orientation) => ({ position, dimensions, orientation });

export function getDrawerGeometry({ centerX = 0, centerY = 0, centerZ = 0, boxWidthCm, drawerHeightCm, sideDepthCm, sideHeightCm, thicknessCm, bottomThicknessCm, frontWidthCm, frontHeightCm, backWidthCm, backHeightCm, bottomWidthCm, bottomDepthCm, frontCenterYCm = 0, structureCenterYCm, bottomCenterYCm, bottomCenterZCm = 0 }) {
  const width = finite(boxWidthCm); const height = finite(drawerHeightCm); const depth = finite(sideDepthCm); const thickness = finite(thicknessCm); const sideHeight = finite(sideHeightCm);
  const structureY = structureCenterYCm == null ? -height / 2 + sideHeight / 2 : finite(structureCenterYCm);
  const bottomY = bottomCenterYCm == null ? -height / 2 : finite(bottomCenterYCm);
  const at = (x, y, z) => ({ xCm: finite(centerX) + x, yCm: finite(centerY) + y, zCm: finite(centerZ) + z });
  return {
    envelope: { position: at(0, 0, 0), dimensions: { widthCm: width, heightCm: height, depthCm: depth } },
    front: part(at(0, finite(frontCenterYCm), depth / 2 + thickness / 2), { widthCm: finite(frontWidthCm), heightCm: thickness, depthCm: finite(frontHeightCm) }, "front"),
    leftSide: part(at(-width / 2 + thickness / 2, structureY, 0), { widthCm: sideHeight, heightCm: thickness, depthCm: depth }, "side"),
    rightSide: part(at(width / 2 - thickness / 2, structureY, 0), { widthCm: sideHeight, heightCm: thickness, depthCm: depth }, "side"),
    back: part(at(0, structureY, -depth / 2 + thickness / 2), { widthCm: finite(backWidthCm), heightCm: thickness, depthCm: finite(backHeightCm) }, "front"),
    bottom: part(at(0, bottomY, finite(bottomCenterZCm)), { widthCm: finite(bottomWidthCm), heightCm: finite(bottomThicknessCm), depthCm: finite(bottomDepthCm) }, "horizontal"),
  };
}
