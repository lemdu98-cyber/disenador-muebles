import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE } from "../src/utils/nightstandStructure.js";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG } from "../src/utils/deskStructure.js";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG } from "../src/utils/tvStandStructure.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { buildFurnitureDiagnostics, buildFurnitureModel, buildFurnitureRelations, componentsTouchOnAxis, createFurnitureDiagnostic, createFurnitureRelation, getAncestorIds, getComponentById, getComponentsByType, getDiagnosticsBySeverity, getDiagnosticsForComponent, getDrawerComponentIds, getHighlightedComponentIds, getIncomingRelations, getOutgoingRelations, getRelationsByType, getRelationsForComponent, normalizeFurnitureComponentSelection, summarizeFurnitureDiagnostics, validateFurnitureDiagnostics, validateFurnitureModel, validateFurnitureRelations } from "../src/utils/furnitureModel/index.js";

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

test("ancestor paths are root-first for shallow and deeply nested components", () => {
  const cat = modelFor("catHouse", { widthCm: 40, heightCm: 40, depthCm: 40, drawers: 0, shelves: 0 });
  assert.deepEqual(getAncestorIds(cat, "catHouse.top"), ["catHouse.root"]);
  const wardrobe = modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45] } });
  assert.deepEqual(getAncestorIds(wardrobe, "wardrobe.body.1.drawer.2.front"), ["wardrobe.root", "wardrobe.body.1", "wardrobe.body.1.drawer.2"]);
  assert.deepEqual(getAncestorIds(wardrobe, "missing"), []);
  assert.deepEqual(getAncestorIds(wardrobe, null), []);
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

const hasRelation = (model, sourceId, type, targetId) => model.relations.some((relation) => relation.sourceId === sourceId && relation.type === type && relation.targetId === targetId);

test("relation ids, order and pure lookup helpers are deterministic", () => {
  const options = { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } };
  const first = modelFor("nightstand", options); const second = modelFor("nightstand", options);
  assert.deepEqual(first.relations, second.relations);
  assert.deepEqual(first.relations.map(({ id }) => id), [...first.relations].sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.type.localeCompare(b.type) || a.targetId.localeCompare(b.targetId)).map(({ id }) => id));
  assert.ok(first.relations.every((relation) => relation.id === `${relation.sourceId}|${relation.type}|${relation.targetId}`));
  assert.deepEqual(getRelationsForComponent(first, "nightstand.top"), getOutgoingRelations(first, "nightstand.top"));
  assert.equal(getIncomingRelations(first, "nightstand.leftSide").length, 3);
  assert.equal(getRelationsByType(first, "supported-by").length, 2);
});

test("relation validation rejects missing endpoints, self relations, invalid types, duplicate ids and incompatible endpoints", () => {
  const components = [{ id: "root", type: "section" }, { id: "panel", type: "panel" }, { id: "back", type: "back" }];
  const duplicate = createFurnitureRelation("back", "closes", "root");
  const result = validateFurnitureRelations({ components, relations: [duplicate, duplicate, createFurnitureRelation("back", "closes", "missing"), createFurnitureRelation("panel", "connects", "panel"), createFurnitureRelation("panel", "unknown", "root"), createFurnitureRelation("panel", "closes", "root")] });
  assert.equal(result.valid, false);
  ["Duplicate", "Unknown relation target", "self relation", "Invalid relation type", "Incompatible relation source"].forEach((message) => assert.ok(result.errors.some((error) => error.includes(message))));
});

test("contact epsilon corroborates semantic support without fuzzy distance inference", () => {
  const source = { bounds: { minX: 0, maxX: 10, minY: 10.04, maxY: 12, minZ: 0, maxZ: 10 } };
  const touching = { bounds: { minX: 0, maxX: 2, minY: 0, maxY: 10, minZ: 0, maxZ: 10 } };
  const separated = { bounds: { ...touching.bounds, maxY: 9.98 } };
  assert.equal(componentsTouchOnAxis(source, touching, "y"), true);
  assert.equal(componentsTouchOnAxis(source, separated, "y"), false);
});

test("nightstand 40/60 relations cover top, drawers, crossbars and rear", () => {
  const model = modelFor("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } });
  assert.equal(model.validation.valid, true);
  ["nightstand.leftSide", "nightstand.rightSide"].forEach((target) => assert.ok(hasRelation(model, "nightstand.top", "supported-by", target)));
  [1, 2].forEach((number) => assert.ok(hasRelation(model, `nightstand.drawer.${number}`, "contained-in", "nightstand.root")));
  assert.ok(hasRelation(model, "nightstand.frontCrossbar", "connects", "nightstand.leftSide"));
  assert.ok(hasRelation(model, "nightstand.back", "closes", "nightstand.root"));
});

test("desk divider separates module and opening correctly for right and left 35 percent layouts", () => {
  for (const side of ["right", "left"]) {
    const model = modelFor("desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: side, drawerModuleWidthRatio: .35 } });
    const moduleRelation = model.relations.find(({ sourceId, type, targetId }) => sourceId === "desk.divider" && type === "separates" && targetId === "desk.drawerModule");
    const openingRelation = model.relations.find(({ sourceId, type, targetId }) => sourceId === "desk.divider" && type === "separates" && targetId === "desk.legOpening");
    assert.equal(moduleRelation.metadata.side, side); assert.equal(openingRelation.metadata.side, side === "right" ? "left" : "right");
    assert.ok(hasRelation(model, "desk.drawer.1", "contained-in", "desk.drawerModule")); assert.equal(model.validation.valid, true);
  }
});

test("TV Stand 35/65 keeps divider and shelf relations tied to semantic sections", () => {
  const model = modelFor("tvStand", { widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0, tvStandConfig: { ...DEFAULT_TV_STAND_CONFIG, sectionWidthRatios: [.35, .65] } });
  [1, 2].forEach((number) => {
    assert.ok(hasRelation(model, "tvStand.divider.1", "separates", `tvStand.section.${number}`));
    assert.ok(hasRelation(model, `tvStand.shelf.${number}`, "contained-in", `tvStand.section.${number}`));
    assert.ok(hasRelation(model, `tvStand.shelf.${number}`, "supported-by", `tvStand.support.${number}`));
  });
  assert.equal(model.validation.valid, true);
});

test("Cat House exposes only reliable enclosure relations and no invented front door", () => {
  const model = modelFor("catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 });
  assert.ok(hasRelation(model, "catHouse.back", "closes", "catHouse.root"));
  assert.ok(hasRelation(model, "catHouse.top", "supported-by", "catHouse.leftSide"));
  assert.ok(hasRelation(model, "catHouse.bottom", "connects", "catHouse.rightSide"));
  assert.equal(getRelationsForComponent(model, "catHouse.frontOpening").some(({ type }) => type === "covers"), false);
});

test("Wardrobe 20/35/45 hinged relations preserve bodies, boundaries, openings and rear segments", () => {
  const model = modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "hinged" } });
  [[1, 1], [1, 2], [2, 2], [2, 3]].forEach(([divider, body]) => assert.ok(hasRelation(model, `wardrobe.divider.${divider}`, "separates", `wardrobe.body.${body}`)));
  [1, 3].forEach((body) => assert.ok(model.components.filter(({ type, parentId }) => type === "drawer" && parentId === `wardrobe.body.${body}`).every(({ id }) => hasRelation(model, id, "contained-in", `wardrobe.body.${body}`))));
  for (let body = 1; body <= 3; body += 1) {
    assert.ok(hasRelation(model, `wardrobe.body.${body}.back`, "closes", `wardrobe.body.${body}`));
    assert.ok(model.components.filter(({ type, parentId }) => type === "shelf" && parentId === `wardrobe.body.${body}`).every(({ id }) => hasRelation(model, id, "contained-in", `wardrobe.body.${body}`)));
    ["superior", "principal"].forEach((kind) => assert.ok(hasRelation(model, `wardrobe.body.${body}.door.${kind}`, "covers", `wardrobe.body.${body}.opening`)));
  }
  assert.equal(model.validation.valid, true);
});

test("Wardrobe sliding leaves cover the global front instead of belonging one-to-one to unequal bodies", () => {
  const model = modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "sliding" } });
  const slidingDoors = model.components.filter(({ type, role }) => type === "door" && role === "sliding");
  assert.equal(slidingDoors.length, 3);
  slidingDoors.forEach(({ id }) => {
    assert.ok(hasRelation(model, id, "covers", "wardrobe.root"));
    assert.equal(getOutgoingRelations(model, id).some(({ targetId }) => targetId.includes(".opening")), false);
  });
  assert.equal(model.validation.valid, true);
});

test("all default legacy models have valid relations and rebuilding relations mutates no inputs", () => {
  const legacyCases = [
    ["nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0 }],
    ["desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0 }],
    ["tvStand", { widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0 }],
    ["catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }],
    ["wardrobe", {}],
  ];
  legacyCases.forEach(([type, options]) => assert.equal(modelFor(type, options).validation.valid, true));
  const config = { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] };
  const input = { ...base, furnitureType: "nightstand", widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, nightstandStructureConfig: config };
  input.generatedPieces = getCutPieces(input); input.structure = calculateNightstandStructure({ ...input, thicknessCm: 1.5, structureConfig: config });
  const generatedSnapshot = structuredClone(input.generatedPieces); const configSnapshot = structuredClone(config); const model = buildFurnitureModel(input); const modelSnapshot = structuredClone(model);
  assert.deepEqual(buildFurnitureRelations(model), model.relations);
  assert.deepEqual(model, modelSnapshot); assert.deepEqual(input.generatedPieces, generatedSnapshot); assert.deepEqual(config, configSnapshot);
});

const rebuildDiagnostics = (model, mutate) => {
  const altered = structuredClone(model); mutate(altered);
  altered.diagnostics = buildFurnitureDiagnostics(altered);
  return altered;
};

test("valid asymmetric and legacy models produce deterministic, valid and quiet diagnostics", () => {
  const cases = [
    ["nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6] } }],
    ["desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: "right", drawerModuleWidthRatio: .35 } }],
    ["desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: "left", drawerModuleWidthRatio: .35 } }],
    ["tvStand", { widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0, tvStandConfig: { ...DEFAULT_TV_STAND_CONFIG, sectionWidthRatios: [.35, .65] } }],
    ["catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }],
    ["wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "hinged" } }],
    ["wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45], doorType: "sliding" } }],
  ];
  for (const [type, options] of cases) {
    const first = modelFor(type, options); const second = modelFor(type, options);
    assert.deepEqual(first.diagnostics, []); assert.deepEqual(first.diagnostics, second.diagnostics);
    assert.equal(first.diagnosticValidation.valid, true); assert.deepEqual(summarizeFurnitureDiagnostics(first), { errors: 0, warnings: 0, info: 0 });
  }
});

test("a separated supported-by relation reports MISSING_EXPECTED_SUPPORT", () => {
  const model = rebuildDiagnostics(modelFor("tvStand", { widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0 }), (altered) => {
    const shelf = getComponentById(altered, "tvStand.shelf.1"); shelf.bounds.minY += 1; shelf.bounds.maxY += 1;
  });
  const diagnostic = getDiagnosticsForComponent(model, "tvStand.shelf.1").find(({ code }) => code === "MISSING_EXPECTED_SUPPORT");
  assert.equal(diagnostic.severity, "error"); assert.deepEqual(diagnostic.relatedComponentIds, ["tvStand.support.1"]); assert.equal(diagnostic.metadata.axis, "y");
});

test("a disconnected crossbar reports MISSING_EXPECTED_CONNECTION", () => {
  const model = rebuildDiagnostics(modelFor("nightstand", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0 }), (altered) => {
    const crossbar = getComponentById(altered, "nightstand.frontCrossbar"); crossbar.bounds.minX += 2; crossbar.bounds.maxX -= 2;
  });
  assert.equal(getDiagnosticsForComponent(model, "nightstand.frontCrossbar").filter(({ code }) => code === "MISSING_EXPECTED_CONNECTION").length, 2);
});

test("a drawer outside its related body reports OUTSIDE_EXPECTED_CONTAINER", () => {
  const model = rebuildDiagnostics(modelFor("wardrobe", { wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [.2, .35, .45] } }), (altered) => {
    const drawer = getComponentById(altered, "wardrobe.body.1.drawer.1"); drawer.bounds.minX += 200; drawer.bounds.maxX += 200;
  });
  assert.ok(getDiagnosticsForComponent(model, "wardrobe.body.1.drawer.1").some(({ code, severity }) => code === "OUTSIDE_EXPECTED_CONTAINER" && severity === "error"));
});

test("a divider outside the regions reports INVALID_SEPARATION_POSITION", () => {
  const model = rebuildDiagnostics(modelFor("desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, deskConfig: { ...DEFAULT_DESK_CONFIG, drawerModuleSide: "right", drawerModuleWidthRatio: .35 } }), (altered) => {
    const divider = getComponentById(altered, "desk.divider"); divider.bounds.minX += 200; divider.bounds.maxX += 200;
  });
  assert.ok(getDiagnosticsForComponent(model, "desk.divider").some(({ code }) => code === "INVALID_SEPARATION_POSITION"));
});

test("reduced back coverage reports INSUFFICIENT_COVERAGE as a warning", () => {
  const model = rebuildDiagnostics(modelFor("catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }), (altered) => {
    getComponentById(altered, "catHouse.back").bounds.maxX -= 5;
  });
  const diagnostic = getDiagnosticsForComponent(model, "catHouse.back").find(({ code }) => code === "INSUFFICIENT_COVERAGE");
  assert.equal(diagnostic.severity, "warning"); assert.equal(getDiagnosticsBySeverity(model, "warning").length, 1);
});

test("diagnostic validation rejects bad codes, severity, components, related ids and duplicates", () => {
  const diagnostic = createFurnitureDiagnostic({ code: "BAD_CODE", severity: "fatal", componentId: "missing", relatedComponentIds: ["also-missing"], message: "Invalid fixture." });
  const result = validateFurnitureDiagnostics({ components: [{ id: "root" }], diagnostics: [diagnostic, diagnostic] });
  assert.equal(result.valid, false);
  ["Duplicate", "Invalid diagnostic code", "Invalid diagnostic severity", "Unknown diagnostic component", "Unknown diagnostic related component"].forEach((message) => assert.ok(result.errors.some((error) => error.includes(message))));
});

test("diagnostic order is stable and building diagnostics does not mutate the model", () => {
  const source = rebuildDiagnostics(modelFor("catHouse", { widthCm: 50, heightCm: 55, depthCm: 40, drawers: 0, shelves: 0 }), (altered) => {
    const top = getComponentById(altered, "catHouse.top"); top.bounds.minY += 1; top.bounds.maxY += 1;
    getComponentById(altered, "catHouse.back").bounds.maxX -= 5;
  });
  const snapshot = structuredClone(source); const first = buildFurnitureDiagnostics(source); const second = buildFurnitureDiagnostics(source);
  assert.deepEqual(first, second); assert.deepEqual(source, snapshot);
  assert.deepEqual(first.map(({ severity }) => severity), ["error", "error", "warning"]);
  assert.ok(first[0].id.localeCompare(first[1].id) < 0);
});
