import test from "node:test";
import assert from "node:assert/strict";
import { getComponentBounds, isComponentCompatibleWithCutPiece } from "../src/utils/furnitureModel/index.js";
const dimensions = { widthCm: 10, heightCm: 2, depthCm: 6 }; const position = { xCm: 0, yCm: 0, zCm: 0 };
test("spatial bounds honor the three domain orientations", () => {
  assert.deepEqual(getComponentBounds({ position, dimensions, orientation: "horizontal" }), { minX: -5, maxX: 5, minY: -1, maxY: 1, minZ: -3, maxZ: 3 });
  assert.deepEqual(getComponentBounds({ position, dimensions, orientation: "front" }), { minX: -5, maxX: 5, minY: -3, maxY: 3, minZ: -1, maxZ: 1 });
  assert.deepEqual(getComponentBounds({ position, dimensions, orientation: "side" }), { minX: -1, maxX: 1, minY: -5, maxY: 5, minZ: -3, maxZ: 3 });
});
test("one-to-one cut compatibility compares face dimensions, not thickness", () => {
  const piece = { length: 10, width: 6 }; assert.equal(isComponentCompatibleWithCutPiece({ dimensions }, piece), true); assert.equal(isComponentCompatibleWithCutPiece({ dimensions: { ...dimensions, depthCm: 5 } }, piece), false);
});
