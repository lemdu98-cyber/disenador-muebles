import test from "node:test";
import assert from "node:assert/strict";
import { buildComponentTree, filterComponents, summarizeFurnitureModel, resolveSourcePieces, validateFurnitureModel } from "../src/utils/furnitureModel/index.js";

const pieces = [{ id: "p1", name: "Panel", material: { id: "melamine" }, length: 10, width: 5, grainRequired: true, edgeBanding: { top: true } }];
const model = { furnitureType: "desk", components: [
  { id: "desk.root", type: "section", sourcePieceIds: [], bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10, minZ: -10, maxZ: 10 } },
  { id: "desk.section", type: "section", parentId: "desk.root", sourcePieceIds: [], position: { xCm: 0, yCm: 0, zCm: 0 }, bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5, minZ: -5, maxZ: 5 } },
  { id: "desk.section.panel", type: "panel", role: "shelf", parentId: "desk.section", sourcePieceIds: ["p1"], position: { xCm: 1, yCm: 0, zCm: 0 }, bounds: { minX: 0, maxX: 2, minY: -1, maxY: 1, minZ: -1, maxZ: 1 } },
] };
test("inspector helpers build stable hierarchy, counts, filters and source details", () => {
  const tree = buildComponentTree(model); assert.equal(tree[0].children[0].children[0].component.id, "desk.section.panel");
  assert.deepEqual(summarizeFurnitureModel(model), { components: 3, physical: 1, logical: 2, sections: 2, drawers: 0, doors: 0, openings: 0, positioned: 2, bounded: 3, oriented: 0, sourced: 1 });
  assert.deepEqual(filterComponents(model, "panel", "shelf").map(({ id }) => id), ["desk.section.panel"]);
  assert.equal(resolveSourcePieces(model.components[2], pieces)[0].grainRequired, true);
});
test("spatial validation accepts contained children and rejects a child outside its parent", () => {
  assert.equal(validateFurnitureModel(model, pieces).valid, true);
  const outside = structuredClone(model); outside.components[2].bounds.minX = 7; outside.components[2].bounds.maxX = 11;
  assert.ok(validateFurnitureModel(outside, pieces).errors.some((error) => error.includes("Child outside parent bounds")));
});
