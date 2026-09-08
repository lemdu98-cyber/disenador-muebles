import test from "node:test";
import assert from "node:assert/strict";
import { getDrawerGeometry } from "../src/utils/drawerGeometry.js";

test("drawer geometry is closed, symmetric and honors a global center", () => {
  const geometry = getDrawerGeometry({ centerX: 10, centerY: 20, centerZ: 30, boxWidthCm: 40, drawerHeightCm: 18, sideDepthCm: 35, sideHeightCm: 16, thicknessCm: 1.5, bottomThicknessCm: .3, frontWidthCm: 42, frontHeightCm: 18, backWidthCm: 37, backHeightCm: 16, bottomWidthCm: 37, bottomDepthCm: 32, frontCenterYCm: 2, structureCenterYCm: 0, bottomCenterYCm: -8, bottomCenterZCm: -1 });
  assert.equal(geometry.front.position.zCm, 48.25); assert.equal(geometry.back.position.zCm, 13.25);
  assert.equal(geometry.leftSide.position.xCm, -9.25); assert.equal(geometry.rightSide.position.xCm, 29.25);
  assert.equal(geometry.bottom.position.yCm, 12); assert.deepEqual(geometry.bottom.dimensions, { widthCm: 37, heightCm: .3, depthCm: 32 });
});
