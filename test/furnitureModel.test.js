import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE } from "../src/utils/nightstandStructure.js";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG } from "../src/utils/deskStructure.js";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG } from "../src/utils/tvStandStructure.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { buildFurnitureModel, getComponentById, getComponentsByType, getDrawerComponentIds, getHighlightedComponentIds, normalizeFurnitureComponentSelection, validateFurnitureModel } from "../src/utils/furnitureModel/index.js";

const materials = createMaterialConfig();
const base = { widthCm: 250, heightCm: 230, depthCm: 60, drawers: 6, shelves: 3, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, materialConfigs: materials };
const modelFor = (furnitureType, overrides = {}) => {
  const input = { ...base, furnitureType, ...overrides };
  input.generatedPieces = getCutPieces(input);
  const thicknessCm = 1.5;
  const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm });
  if (furnitureType === "nightstand") input.structure = calculateNightstandStructure({ ...input, thicknessCm, structureConfig: input.nightstandStructureConfig });
  if (furnitureType === "desk") input.structure = calculateDeskStructure({ ...input, thicknessCm, drawerDimensions, deskConfig: input.deskConfig });
  if (furnitureType === "tvStand") input.structure = calculateTvStandStructure({ ...input, thicknessCm, tvStandConfig: input.tvStandConfig });
  if (furnitureType === "wardrobe") input.structure = calculateWardrobeStructure({ ...input, thicknessCm, bottomThicknessCm: .3, drawerDimensions, wardrobeConfig: input.wardrobeConfig });
  return buildFurnitureModel(input);
};

test("models are deterministic and only link real generated pieces", () => {
  const model = modelFor("catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 });
  assert.equal(model.modelVersion, 1); assert.equal(model.validation.valid, true);
  assert.deepEqual(model.components.map(({ id }) => id), modelFor("catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }).components.map(({ id }) => id));
  assert.equal(getComponentById(model, "catHouse.frontOpening").sourcePieceIds.length, 0);
});

test("nightstand preserves asymmetric drawer hierarchy", () => {
  const model = modelFor("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, drawerFrontConfig: { type: "overlay", gapMm: 2 }, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } });
  assert.equal(getComponentsByType(model, "drawer").length, 2);
  assert.deepEqual(["nightstand.drawer.1", "nightstand.drawer.2"].map((id) => getComponentById(model, id).dimensions.heightCm), [17.5, 26.5]);
});

test("desk reflects a right 35 percent drawer module", () => {
  const model = modelFor("desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: "right", drawerModuleWidthRatio: .35 } });
  assert.ok(getComponentById(model, "desk.drawerModule").position.xCm > 0); assert.ok(getComponentById(model, "desk.legOpening").position.xCm < 0);
});

test("TV stand and wardrobe retain resolved variable section widths", () => {
  const tv = modelFor("tvStand", { widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0, tvStandConfig: { ...DEFAULT_TV_STAND_CONFIG, sectionWidthRatios: [.35, .65] } });
  assert.notEqual(getComponentById(tv, "tvStand.section.1").dimensions.widthCm, getComponentById(tv, "tvStand.section.2").dimensions.widthCm);
  const wardrobe = modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45] } });
  assert.deepEqual([1, 2, 3].map((n) => getComponentById(wardrobe, `wardrobe.body.${n}`).dimensions.widthCm), [49, 85.5, 109.5]);
  assert.equal(getComponentsByType(wardrobe, "door").length, 6); assert.equal(wardrobe.validation.valid, true);
});

test("validation detects duplicate ids, bad links and hierarchy cycles", () => {
  const invalid = { furnitureType: "desk", components: [{ id: "a", type: "panel", parentId: "b", sourcePieceIds: ["gone"] }, { id: "b", type: "panel", parentId: "a", sourcePieceIds: [] }, { id: "a", type: "panel", sourcePieceIds: [] }] };
  const result = validateFurnitureModel(invalid, []); assert.equal(result.valid, false); assert.ok(result.errors.some((error) => /Duplicate|Unknown source piece|cycle/.test(error)));
});

test("selection highlights an exact physical component and handles null or invalid ids", () => {
  const model = modelFor("catHouse", { widthCm: 40, heightCm: 40, depthCm: 40, drawers: 0, shelves: 0 });
  assert.deepEqual([...getHighlightedComponentIds(model, "catHouse.top")], ["catHouse.top"]);
  assert.deepEqual([...getHighlightedComponentIds(model, "catHouse.frontOpening")], []);
  assert.deepEqual([...getHighlightedComponentIds(model, "missing")], []);
  assert.deepEqual([...getHighlightedComponentIds(model, null)], []);
});

test("drawer ids are canonical and logical drawers expand to all rendered pieces", () => {
  assert.deepEqual(getDrawerComponentIds("nightstand.drawer.1"), {
    front: "nightstand.drawer.1.front",
    leftSide: "nightstand.drawer.1.left-side",
    rightSide: "nightstand.drawer.1.right-side",
    back: "nightstand.drawer.1.back",
    bottom: "nightstand.drawer.1.bottom",
  });
  const model = modelFor("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, drawerFrontConfig: { type: "overlay", gapMm: 2 }, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } });
  assert.deepEqual(new Set(getHighlightedComponentIds(model, "nightstand.drawer.1")), new Set(Object.values(getDrawerComponentIds("nightstand.drawer.1"))));
  const desk = modelFor("desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: "right", drawerModuleWidthRatio: .35 } });
  assert.deepEqual(new Set(getHighlightedComponentIds(desk, "desk.drawer.1")), new Set(Object.values(getDrawerComponentIds("desk.drawer.1"))));
  const wardrobe = modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45] } });
  assert.deepEqual(new Set(getHighlightedComponentIds(wardrobe, "wardrobe.body.1.drawer.1")), new Set(Object.values(getDrawerComponentIds("wardrobe.body.1.drawer.1"))));
});

test("wardrobe body selection only expands to that body's physical descendants", () => {
  const model = modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45] } });
  const highlighted = getHighlightedComponentIds(model, "wardrobe.body.1");
  assert.ok(highlighted.size > 0);
  assert.ok([...highlighted].every((id) => id.startsWith("wardrobe.body.1.")));
  assert.ok([...highlighted].every((id) => !id.startsWith("wardrobe.body.2.") && !id.startsWith("wardrobe.body.3.")));
});

test("selection normalization clears an id that disappears from a rebuilt model", () => {
  const withDrawers = modelFor("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, drawerFrontConfig: { type: "overlay", gapMm: 2 }, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } });
  const withoutDrawers = modelFor("catHouse", { widthCm: 40, heightCm: 40, depthCm: 40, drawers: 0, shelves: 0 });
  assert.equal(normalizeFurnitureComponentSelection(withDrawers, "nightstand.drawer.2"), "nightstand.drawer.2");
  assert.equal(normalizeFurnitureComponentSelection(withoutDrawers, "nightstand.drawer.2"), null);
  assert.equal(normalizeFurnitureComponentSelection(withoutDrawers, null), null);
});
