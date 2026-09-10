import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE } from "../src/utils/nightstandStructure.js";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG } from "../src/utils/deskStructure.js";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG } from "../src/utils/tvStandStructure.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { buildFurnitureDiagnostics, buildFurnitureModel, buildFurnitureRegions, createPlanarRegion, getCoverageRatio, getHorizontalGap, getOverlap, getRegionById, getRegionHeight, getRegionsByRole, getRegionsForComponent, getRegionWidth, validateFurnitureRegions } from "../src/utils/furnitureModel/index.js";

const materials = createMaterialConfig();
const base = { widthCm: 250, heightCm: 230, depthCm: 60, drawers: 6, shelves: 3, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, materialConfigs: materials };
function fixture(furnitureType, overrides = {}) {
  const input = { ...base, furnitureType, ...overrides }; input.generatedPieces = getCutPieces(input);
  const thicknessCm = 1.5; const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm });
  if (furnitureType === "nightstand") input.structure = calculateNightstandStructure({ ...input, thicknessCm, structureConfig: input.nightstandStructureConfig });
  if (furnitureType === "desk") input.structure = calculateDeskStructure({ ...input, thicknessCm, drawerDimensions, deskConfig: input.deskConfig });
  if (furnitureType === "tvStand") input.structure = calculateTvStandStructure({ ...input, thicknessCm, tvStandConfig: input.tvStandConfig });
  if (furnitureType === "wardrobe") input.structure = calculateWardrobeStructure({ ...input, thicknessCm, bottomThicknessCm: .3, drawerDimensions, wardrobeConfig: input.wardrobeConfig });
  return { input, model: buildFurnitureModel(input) };
}

test("canonical planar helpers measure width, height, gap, overlap and 2D coverage", () => {
  const a = createPlanarRegion({ id: "a", type: "front", role: "door-front", minX: 0, maxX: 10, minY: 0, maxY: 20, zCm: 1 });
  const b = createPlanarRegion({ id: "b", type: "opening", role: "front-opening", minX: 8, maxX: 18, minY: 5, maxY: 15, zCm: 1 });
  assert.equal(getRegionWidth(a), 10); assert.equal(getRegionHeight(a), 20); assert.equal(getHorizontalGap(a, b), -2); assert.equal(getOverlap(a, b), 2); assert.equal(getCoverageRatio(a, b), .2);
});

test("region validation rejects duplicate ids, invalid planes, inverted bounds and unknown components", () => {
  const bad = createPlanarRegion({ id: "same", type: "front", role: "door-front", componentId: "missing", minX: 2, maxX: 1, minY: 0, maxY: 1, zCm: 0, plane: "side" });
  const result = validateFurnitureRegions({ components: [], regions: [bad, bad] });
  assert.equal(result.valid, false); ["Duplicate", "Invalid region plane", "Invalid planar bounds", "Unknown region component"].forEach((part) => assert.ok(result.errors.some((error) => error.includes(part))));
});

test("nightstand 40/60 exposes two openings and two fronts with full nominal coverage", () => {
  const { model } = fixture("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, drawerFrontConfig: { type: "overlay", gapMm: 2 }, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } });
  assert.equal(getRegionsByRole(model, "front-opening").length, 2); assert.equal(getRegionsByRole(model, "drawer-front-region").length, 2);
  getRegionsByRole(model, "drawer-front-region").forEach((front) => assert.equal(getCoverageRatio(front, getRegionById(model, front.metadata.targetRegionId)), 1));
  assert.deepEqual(model.diagnostics, []);
});

test("shrinking a nightstand drawer front region reports coverage mismatch", () => {
  const { model } = fixture("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0 }); const altered = structuredClone(model);
  getRegionsByRole(altered, "drawer-front-region")[0].region.maxX -= 5; altered.diagnostics = buildFurnitureDiagnostics(altered);
  assert.ok(altered.diagnostics.some(({ code }) => code === "DRAWER_FRONT_COVERAGE_MISMATCH"));
});

test("desk right and left 35 percent layouts expose mirrored drawer regions and stay quiet", () => {
  const centers = ["right", "left"].map((side) => { const { model } = fixture("desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: side, drawerModuleWidthRatio: .35 } }); assert.equal(model.regions.length, 6); assert.deepEqual(model.diagnostics, []); return getRegionsByRole(model, "front-opening")[0].region.minX; });
  assert.ok(centers[0] > 0 && centers[1] < 0);
});

test("Cat House frontOpening is normalized exactly and TV Stand invents no regions", () => {
  const cat = fixture("catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }).model;
  const opening = getRegionsForComponent(cat, "catHouse.frontOpening")[0]; assert.deepEqual([getRegionWidth(opening), getRegionHeight(opening), opening.region.zCm], [47, 52, 20]);
  const tv = fixture("tvStand", { widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0, tvStandConfig: { ...DEFAULT_TV_STAND_CONFIG, sectionWidthRatios: [.35, .65] } }).model;
  assert.deepEqual(tv.regions, []);
});

test("hinged Wardrobe 20/35/45 has body fronts, six openings and six nominal doors", () => {
  const { model } = fixture("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "hinged" } });
  assert.equal(getRegionsByRole(model, "global-front").length, 4); assert.equal(getRegionsByRole(model, "front-opening").length, 6); assert.equal(getRegionsByRole(model, "door-front").length, 6);
  assert.deepEqual(model.diagnostics, []); assert.equal(model.regionValidation.valid, true);
});

test("altering a hinged door region produces canonical gap and coverage diagnostics", () => {
  const { model } = fixture("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "hinged" } }); const altered = structuredClone(model);
  const door = getRegionById(altered, "wardrobe.body.2.door.principal.region.front"); door.region.minX += 2; altered.diagnostics = buildFurnitureDiagnostics(altered);
  assert.ok(altered.diagnostics.some(({ code }) => code === "DOOR_GAP_TOO_LARGE")); assert.ok(altered.diagnostics.some(({ code }) => code === "DOOR_COVERAGE_INSUFFICIENT"));
});

test("sliding Wardrobe exposes one global opening, three leaves and exact overlaps", () => {
  const { model } = fixture("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "sliding" } });
  const leaves = getRegionsByRole(model, "door-front").sort((a, b) => a.region.minX - b.region.minX);
  assert.equal(leaves.length, 3); assert.equal(getRegionsByRole(model, "global-front").length, 1); assert.equal(getRegionsByRole(model, "front-opening").length, 1);
  assert.equal(getOverlap(leaves[0], leaves[1]), 4); assert.equal(getOverlap(leaves[1], leaves[2]), 4); assert.deepEqual(model.diagnostics, []);
});

test("reducing a sliding overlap reports SLIDING_OVERLAP_TOO_SMALL", () => {
  const { model } = fixture("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, doorType: "sliding" } }); const altered = structuredClone(model);
  const middle = getRegionById(altered, "wardrobe.body.2.door.region.front"); middle.region.minX += 1; middle.region.maxX += 1; altered.diagnostics = buildFurnitureDiagnostics(altered);
  assert.ok(altered.diagnostics.some(({ code }) => code === "SLIDING_OVERLAP_TOO_SMALL"));
});

test("regions and their order are deterministic for legacy configurations", () => {
  for (const [type, options] of [["nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0 }], ["catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }], ["wardrobe", {}]]) {
    assert.deepEqual(fixture(type, options).model.regions, fixture(type, options).model.regions);
  }
});

test("rebuilding regions is pure and mutates neither model nor resolved context", () => {
  const { input, model } = fixture("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, doorType: "sliding" } }); const modelSnapshot = structuredClone(model); const inputSnapshot = structuredClone(input);
  assert.deepEqual(buildFurnitureRegions(model, input), model.regions); assert.deepEqual(model, modelSnapshot); assert.deepEqual(input, inputSnapshot);
});
