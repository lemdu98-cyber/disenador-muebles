import test from "node:test";
import assert from "node:assert/strict";
import { applyFurnitureModelEdit, applyFurnitureModelTransaction, FURNITURE_EDIT_ERROR_CODES, getEditableProperties, getRegionHeight } from "../src/utils/furnitureModel/index.js";
import { buildFurnitureModel } from "../src/utils/furnitureModel/index.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG, TV_STAND_MINIMUM_SECTION_WIDTH_CM } from "../src/utils/tvStandStructure.js";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE, equalDrawerHeightRatios } from "../src/utils/nightstandStructure.js";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG, DEFAULT_DESK_DRAWER_MODULE_RATIO, DESK_MINIMUM_LEGROOM_WIDTH_CM, getDeskSectionGeometry } from "../src/utils/deskStructure.js";
import { MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM } from "../src/utils/drawerLimits.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "../src/utils/drawerFront.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { optimizeAllMaterials } from "../src/utils/materialOptimizer.js";

const materials = createMaterialConfig();

function wardrobeFixture(sectionWidthRatios, doorType = "hinged") {
  const wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, doorType };
  if (sectionWidthRatios !== undefined) wardrobeConfig.sectionWidthRatios = sectionWidthRatios;
  const input = { furnitureType: "wardrobe", widthCm: 250, heightCm: 230, depthCm: 60, drawers: 6, shelves: 3, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, drawerFrontConfig: DEFAULT_DRAWER_FRONT_CONFIG, wardrobeConfig, materialConfigs: materials };
  const thicknessCm = materials.melamine.thicknessMm / 10;
  const bottomThicknessCm = materials.hardboard.thicknessMm / 10;
  const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm });
  const structure = calculateWardrobeStructure({ ...input, thicknessCm, bottomThicknessCm, drawerDimensions });
  const generatedPieces = getCutPieces(input);
  const model = buildFurnitureModel({ ...input, generatedPieces, structure });
  const context = { widthCm: input.widthCm, heightCm: input.heightCm, depthCm: input.depthCm, thicknessCm, bottomThicknessCm, shelves: input.shelves, drawerDimensions };
  return { config: wardrobeConfig, context, generatedPieces, input, model, structure };
}

function tvStandFixture(sectionWidthRatios) {
  const tvStandConfig = { ...DEFAULT_TV_STAND_CONFIG };
  if (sectionWidthRatios !== undefined) tvStandConfig.sectionWidthRatios = sectionWidthRatios;
  const input = { furnitureType: "tvStand", widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0, tvStandConfig, materialConfigs: materials };
  const thicknessCm = materials.melamine.thicknessMm / 10;
  const structure = calculateTvStandStructure({ ...input, thicknessCm });
  const generatedPieces = getCutPieces(input);
  const model = buildFurnitureModel({ ...input, generatedPieces, structure });
  const context = { widthCm: input.widthCm, heightCm: input.heightCm, depthCm: input.depthCm, thicknessCm };
  return { config: tvStandConfig, context, generatedPieces, input, model, structure };
}

function nightstandFixture({ drawerHeightRatios, drawers = 2, heightCm = 55 } = {}) {
  const nightstandStructureConfig = { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: drawerHeightRatios ?? equalDrawerHeightRatios(drawers) };
  const input = { furnitureType: "nightstand", widthCm: 50, heightCm, depthCm: 40, drawers, shelves: 0, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, drawerFrontConfig: DEFAULT_DRAWER_FRONT_CONFIG, nightstandStructureConfig, materialConfigs: materials };
  const thicknessCm = materials.melamine.thicknessMm / 10;
  const bottomThicknessCm = materials.hardboard.thicknessMm / 10;
  const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm });
  const structure = calculateNightstandStructure({ ...input, thicknessCm, structureConfig: nightstandStructureConfig });
  const generatedPieces = getCutPieces(input);
  const model = buildFurnitureModel({ ...input, generatedPieces, structure });
  const context = { widthCm: input.widthCm, heightCm: input.heightCm, depthCm: input.depthCm, thicknessCm, bottomThicknessCm, drawers, drawerDimensions, drawerFrontConfig: input.drawerFrontConfig };
  return { config: nightstandStructureConfig, context, generatedPieces, input, model, structure };
}

function deskFixture({ side = "right", ratio = DEFAULT_DESK_DRAWER_MODULE_RATIO } = {}) {
  const deskConfig = { ...DEFAULT_DESK_CONFIG, drawerModuleSide: side, drawerModuleWidthRatio: ratio };
  const input = { furnitureType: "desk", widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, deskConfig, materialConfigs: materials };
  const thicknessCm = materials.melamine.thicknessMm / 10;
  const bottomThicknessCm = materials.hardboard.thicknessMm / 10;
  const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm });
  const structure = calculateDeskStructure({ ...input, thicknessCm, bottomThicknessCm, drawerDimensions });
  const generatedPieces = getCutPieces(input);
  const model = buildFurnitureModel({ ...input, generatedPieces, structure });
  const context = { widthCm: input.widthCm, heightCm: input.heightCm, depthCm: input.depthCm, thicknessCm, bottomThicknessCm, drawers: input.drawers, drawerDimensions };
  return { config: deskConfig, context, generatedPieces, input, model, structure };
}

const edit = (componentId, value, property = "widthRatio") => ({ componentId, property, value });
const sum = (values) => values.reduce((total, value) => total + value, 0);

test("editable properties expose only the three semantic Wardrobe bodies", () => {
  const fixture = wardrobeFixture();
  for (let body = 1; body <= 3; body += 1) {
    const [property] = getEditableProperties({ model: fixture.model, componentId: `wardrobe.body.${body}`, config: fixture.config, context: fixture.context });
    assert.equal(property.key, "widthRatio"); assert.equal(property.unit, "%"); assert.equal(property.metadata.ratioIndex, body - 1); assert.ok(property.min < property.value && property.value < property.max);
  }
  assert.deepEqual(getEditableProperties({ model: fixture.model, componentId: "wardrobe.top", config: fixture.config, context: fixture.context }), []);
});

test("body1 edit redistributes the remaining share proportionally and keeps an exact sum", () => {
  const fixture = wardrobeFixture([.2, .35, .45]);
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.1", .25) });
  assert.equal(result.ok, true); [.25, .328125, .421875].forEach((expected, index) => assert.ok(Math.abs(result.nextConfig.sectionWidthRatios[index] - expected) < 1e-12)); assert.equal(sum(result.nextConfig.sectionWidthRatios), 1);
});

test("body2 and body3 use the same semantic mapping", () => {
  const fixture = wardrobeFixture();
  const body2 = applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.2", .4) });
  const body3 = applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.3", .3) });
  assert.equal(body2.ok, true); assert.equal(body2.nextConfig.sectionWidthRatios[1], .4); assert.equal(sum(body2.nextConfig.sectionWidthRatios), 1);
  assert.equal(body3.ok, true); assert.equal(body3.nextConfig.sectionWidthRatios[2], .3); assert.equal(sum(body3.nextConfig.sectionWidthRatios), 1);
});

test("constructive low and high limits reject atomically", () => {
  const fixture = wardrobeFixture(); const [property] = getEditableProperties({ model: fixture.model, componentId: "wardrobe.body.1", config: fixture.config, context: fixture.context });
  const original = structuredClone(fixture.config);
  for (const value of [property.min - .001, property.max + .001]) {
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.1", value) });
    assert.equal(result.ok, false); assert.equal(result.error.code, FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION); assert.deepEqual(fixture.config, original);
  }
});

test("invalid component, property, value and furniture type return controlled errors", () => {
  const fixture = wardrobeFixture();
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.top", .25) }).error.code, FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.1", .25, "position.x") }).error.code, FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.1", Number.NaN) }).error.code, FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, model: { ...fixture.model, furnitureType: "desk" }, edit: edit("wardrobe.body.1", .25) }).error.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
});

test("editing is deterministic, immutable and normalizes legacy config", () => {
  const fixture = wardrobeFixture(undefined); const legacy = { doorType: "hinged" }; const modelSnapshot = structuredClone(fixture.model); const configSnapshot = structuredClone(legacy);
  const first = applyFurnitureModelEdit({ model: fixture.model, config: legacy, context: fixture.context, edit: edit("wardrobe.body.1", .25) });
  const second = applyFurnitureModelEdit({ model: fixture.model, config: legacy, context: fixture.context, edit: edit("wardrobe.body.1", .25) });
  assert.deepEqual(first, second); assert.equal(first.ok, true); assert.equal(sum(first.nextConfig.sectionWidthRatios), 1);
  assert.deepEqual(fixture.model, modelSnapshot); assert.deepEqual(legacy, configSnapshot);
});

function rebuildAfterEdit(fixture, result) {
  const input = { ...fixture.input, wardrobeConfig: result.nextConfig };
  const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm: fixture.context.thicknessCm });
  const structure = calculateWardrobeStructure({ ...input, thicknessCm: fixture.context.thicknessCm, bottomThicknessCm: fixture.context.bottomThicknessCm, drawerDimensions });
  const generatedPieces = getCutPieces(input);
  return { generatedPieces, model: buildFurnitureModel({ ...input, generatedPieces, structure }), structure };
}

test("full edit integration rebuilds geometry, manufacturing pieces, regions and relations", () => {
  const fixture = wardrobeFixture([.2, .35, .45]);
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.1", .25) }); const rebuilt = rebuildAfterEdit(fixture, result);
  assert.notDeepEqual(rebuilt.structure.sectionWidthsCm, fixture.structure.sectionWidthsCm);
  assert.ok(rebuilt.structure.sectionWidthsCm.every((width) => Number.isInteger(width * 2)));
  assert.equal(rebuilt.model.components.find(({ id }) => id === "wardrobe.body.1").dimensions.widthCm, rebuilt.structure.sectionWidthsCm[0]);
  assert.notDeepEqual(rebuilt.model.regions, fixture.model.regions); assert.deepEqual(rebuilt.model.relations.map(({ id }) => id), fixture.model.relations.map(({ id }) => id));
  assert.deepEqual(rebuilt.model.diagnostics, []); assert.equal(rebuilt.model.validation.valid, true);
  for (const prefix of ["Puerta principal Cuerpo 1", "Frente Cajón 1 Cuerpo 1", "Fondo cartón prensado Cuerpo 1", "Travesaño frontal inferior Cuerpo 1"]) {
    const before = fixture.generatedPieces.find(({ name }) => name === prefix); const after = rebuilt.generatedPieces.find(({ name }) => name === prefix);
    assert.notDeepEqual([after?.length, after?.width], [before?.length, before?.width]);
  }
});

test("hinged and sliding doors remain generator-driven after ratio edits", () => {
  for (const doorType of ["hinged", "sliding"]) {
    const fixture = wardrobeFixture([.2, .35, .45], doorType);
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit("wardrobe.body.2", .4) }); const rebuilt = rebuildAfterEdit(fixture, result);
    assert.equal(rebuilt.structure.isSlidingDoors, doorType === "sliding"); assert.equal(rebuilt.model.validation.valid, true); assert.deepEqual(rebuilt.model.diagnostics, []);
    const doorNames = doorType === "sliding" ? ["Puerta corrediza 1", "Puerta corrediza 2", "Puerta corrediza 3"] : ["Puerta superior Cuerpo 1", "Puerta principal Cuerpo 2", "Puerta principal Cuerpo 3"];
    doorNames.forEach((name) => assert.ok(rebuilt.generatedPieces.some((piece) => piece.name === name)));
  }
});

test("editable properties expose both semantic TV Stand sections with their own values", () => {
  const fixture = tvStandFixture([.35, .65]);
  for (const [number, expected] of [[1, .35], [2, .65]]) {
    const [property] = getEditableProperties({ model: fixture.model, componentId: `tvStand.section.${number}`, config: fixture.config, context: fixture.context });
    assert.equal(property.key, "widthRatio");
    assert.equal(property.label, "Section width");
    assert.equal(property.unit, "%");
    assert.equal(property.step, .001);
    assert.equal(property.value, expected);
    assert.equal(property.metadata.ratioIndex, number - 1);
    assert.equal(property.metadata.minimumWidthCm, TV_STAND_MINIMUM_SECTION_WIDTH_CM);
  }
  for (const componentId of ["tvStand.top", "tvStand.divider.1", "tvStand.shelf.1", "tvStand.support.1"]) {
    assert.deepEqual(getEditableProperties({ model: fixture.model, componentId, config: fixture.config, context: fixture.context }), []);
  }
});

test("TV Stand section edits use explicit semantic mapping and an exact complement", () => {
  const fixture = tvStandFixture();
  const section1 = applyFurnitureModelEdit({ ...fixture, edit: edit("tvStand.section.1", .35) });
  const section2 = applyFurnitureModelEdit({ ...fixture, edit: edit("tvStand.section.2", .6) });
  assert.equal(section1.ok, true);
  assert.deepEqual(section1.nextConfig.sectionWidthRatios, [.35, .65]);
  assert.equal(sum(section1.nextConfig.sectionWidthRatios), 1);
  assert.equal(section2.ok, true);
  assert.deepEqual(section2.nextConfig.sectionWidthRatios, [.4, .6]);
  assert.equal(sum(section2.nextConfig.sectionWidthRatios), 1);
});

test("TV Stand constructive limits reject low, high and section 2 violations atomically", () => {
  const fixture = tvStandFixture();
  const original = structuredClone(fixture.config);
  const [section1Property] = getEditableProperties({ model: fixture.model, componentId: "tvStand.section.1", config: fixture.config, context: fixture.context });
  const [section2Property] = getEditableProperties({ model: fixture.model, componentId: "tvStand.section.2", config: fixture.config, context: fixture.context });
  for (const [componentId, value] of [
    ["tvStand.section.1", section1Property.min - .001],
    ["tvStand.section.1", section1Property.max + .001],
    ["tvStand.section.2", section2Property.max + .001],
  ]) {
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit(componentId, value) });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION);
    assert.deepEqual(fixture.config, original);
  }
});

test("TV Stand invalid component, property and mismatched furniture configs fail cleanly", () => {
  const tv = tvStandFixture();
  const wardrobe = wardrobeFixture();
  assert.equal(applyFurnitureModelEdit({ ...tv, edit: edit("tvStand.top", .35) }).error.code, FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...tv, edit: edit("tvStand.section.1", .35, "height") }).error.code, FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...tv, config: wardrobe.config, edit: edit("tvStand.section.1", .35) }).error.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
  assert.equal(applyFurnitureModelEdit({ ...wardrobe, config: tv.config, edit: edit("wardrobe.body.1", .25) }).error.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
});

test("TV Stand editing is deterministic, immutable and starts legacy config at 50/50", () => {
  const fixture = tvStandFixture(undefined);
  const legacy = { dividerEnabled: true };
  const modelSnapshot = structuredClone(fixture.model);
  const relationsSnapshot = structuredClone(fixture.model.relations);
  const diagnosticsSnapshot = structuredClone(fixture.model.diagnostics);
  const configSnapshot = structuredClone(legacy);
  const request = { model: fixture.model, config: legacy, context: fixture.context, edit: edit("tvStand.section.1", .35) };
  const first = applyFurnitureModelEdit(request);
  const second = applyFurnitureModelEdit(request);
  assert.deepEqual(first, second);
  assert.deepEqual(first.nextConfig.sectionWidthRatios, [.35, .65]);
  assert.deepEqual(fixture.model, modelSnapshot);
  assert.deepEqual(fixture.model.relations, relationsSnapshot);
  assert.deepEqual(fixture.model.diagnostics, diagnosticsSnapshot);
  assert.deepEqual(legacy, configSnapshot);
});

function rebuildTvStandAfterEdit(fixture, result) {
  const input = { ...fixture.input, tvStandConfig: result.nextConfig };
  const structure = calculateTvStandStructure({ ...input, thicknessCm: fixture.context.thicknessCm });
  const generatedPieces = getCutPieces(input);
  return { generatedPieces, model: buildFurnitureModel({ ...input, generatedPieces, structure }), structure };
}

test("TV Stand 35/65 integration rebuilds geometry, pieces, relations and diagnostics", () => {
  const fixture = tvStandFixture();
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("tvStand.section.1", .35) });
  const rebuilt = rebuildTvStandAfterEdit(fixture, result);
  assert.deepEqual(rebuilt.structure.sectionWidthsCm, [61.5, 114]);
  assert.equal(rebuilt.structure.dividerCenterXCm, -26.25);
  for (const [number, width] of [[1, 61.5], [2, 114]]) {
    const section = rebuilt.model.components.find(({ id }) => id === `tvStand.section.${number}`);
    const shelf = rebuilt.model.components.find(({ id }) => id === `tvStand.shelf.${number}`);
    const support = rebuilt.model.components.find(({ id }) => id === `tvStand.support.${number}`);
    assert.equal(section.dimensions.widthCm, width);
    assert.equal(section.position.xCm, rebuilt.structure.sectionCentersXCm[number - 1]);
    assert.equal(shelf.dimensions.widthCm, width);
    assert.equal(shelf.position.xCm, rebuilt.structure.sectionCentersXCm[number - 1]);
    assert.equal(support.position.xCm, rebuilt.structure.supportCentersXCm[number - 1]);
    assert.ok(Number.isFinite(support.position.xCm));
  }
  assert.equal(rebuilt.model.components.find(({ id }) => id === "tvStand.divider.1").position.xCm, -26.25);
  assert.deepEqual(rebuilt.model.relations.map(({ id }) => id), fixture.model.relations.map(({ id }) => id));
  assert.ok(rebuilt.model.relations.some(({ sourceId, type, targetId }) => sourceId === "tvStand.divider.1" && type === "separates" && targetId === "tvStand.section.1"));
  assert.ok(rebuilt.model.relations.some(({ sourceId, type, targetId }) => sourceId === "tvStand.divider.1" && type === "separates" && targetId === "tvStand.section.2"));
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
  assert.deepEqual(rebuilt.model.regions, []);
  for (const [name, length] of [["Repisa izquierda", 61.5], ["Repisa derecha", 114]]) assert.equal(rebuilt.generatedPieces.find((piece) => piece.name === name).length, length);
  for (const name of ["Soporte vertical izquierdo", "Soporte vertical derecho"]) {
    const piece = rebuilt.generatedPieces.find((candidate) => candidate.name === name);
    assert.ok(Number.isFinite(piece.length) && Number.isFinite(piece.width));
  }
  for (const name of ["Fondo trasero completo", "Travesaño trasero superior", "Travesaño trasero inferior"]) {
    const before = fixture.generatedPieces.find((piece) => piece.name === name);
    const after = rebuilt.generatedPieces.find((piece) => piece.name === name);
    assert.deepEqual([after.length, after.width], [before.length, before.width]);
  }
});

test("TV Stand 60/40 retains the existing manufacturable geometry", () => {
  const fixture = tvStandFixture();
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("tvStand.section.2", .4) });
  const rebuilt = rebuildTvStandAfterEdit(fixture, result);
  assert.deepEqual(result.nextConfig.sectionWidthRatios, [.6, .4]);
  assert.deepEqual(rebuilt.structure.sectionWidthsCm, [105.5, 70]);
  assert.equal(sum(result.nextConfig.sectionWidthRatios), 1);
});

test("editable properties expose heightRatio only on actual semantic Nightstand drawers", () => {
  for (const drawers of [2, 3, 4]) {
    const fixture = nightstandFixture({ drawers, heightCm: drawers === 4 ? 70 : 55 });
    for (let number = 1; number <= drawers; number += 1) {
      const [property] = getEditableProperties({ model: fixture.model, componentId: `nightstand.drawer.${number}`, config: fixture.config, context: fixture.context });
      assert.equal(property.key, "heightRatio");
      assert.equal(property.label, "Drawer height");
      assert.equal(property.unit, "%");
      assert.equal(property.step, .001);
      assert.equal(property.metadata.ratioIndex, number - 1);
      assert.equal(property.metadata.drawerCount, drawers);
      assert.equal(property.metadata.minimumHeightCm, MINIMUM_PRACTICAL_DRAWER_HEIGHT_CM);
    }
    assert.deepEqual(getEditableProperties({ model: fixture.model, componentId: `nightstand.drawer.${drawers}.front`, config: fixture.config, context: fixture.context }), []);
  }
  const fixture = nightstandFixture();
  assert.deepEqual(getEditableProperties({ model: fixture.model, componentId: "nightstand.drawer.4", config: fixture.config, context: fixture.context }), []);
  assert.deepEqual(getEditableProperties({ model: fixture.model, componentId: "nightstand.top", config: fixture.config, context: fixture.context }), []);
});

test("two-drawer edits map drawer 1 and drawer 2 to the correct ratios", () => {
  const fixture = nightstandFixture();
  const fortySixty = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", .4, "heightRatio") });
  const thirtyFiveSixtyFive = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.2", .65, "heightRatio") });
  const sixtyForty = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", .6, "heightRatio") });
  assert.deepEqual(fortySixty.nextConfig.drawerHeightRatios, [.4, .6]);
  assert.deepEqual(thirtyFiveSixtyFive.nextConfig.drawerHeightRatios, [.35, .65]);
  assert.deepEqual(sixtyForty.nextConfig.drawerHeightRatios, [.6, .4]);
  for (const result of [fortySixty, thirtyFiveSixtyFive, sixtyForty]) assert.equal(sum(result.nextConfig.drawerHeightRatios), 1);
});

test("three drawers redistribute the remainder proportionally while respecting minima", () => {
  const fixture = nightstandFixture({ drawers: 3, drawerHeightRatios: [.25, .35, .4] });
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.2", .4, "heightRatio") });
  assert.equal(result.ok, true);
  const expected = [10 / 42, .4, 1 - 10 / 42 - .4];
  expected.forEach((ratio, index) => assert.ok(Math.abs(result.nextConfig.drawerHeightRatios[index] - ratio) < 1e-12));
  assert.equal(sum(result.nextConfig.drawerHeightRatios), 1);
  const rebuilt = rebuildNightstandAfterEdit(fixture, result);
  assert.deepEqual(rebuilt.structure.drawerFrontHeightsCm, [10, 17, 15]);
  assert.equal(rebuilt.structure.valid, true);
});

test("four drawers support a valid edit and reject ratios that consume another minimum", () => {
  const fixture = nightstandFixture({ drawers: 4, heightCm: 70 });
  const valid = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", .3, "heightRatio") });
  assert.equal(valid.ok, true);
  [.3, .7 / 3, .7 / 3, .7 / 3].forEach((ratio, index) => assert.ok(Math.abs(valid.nextConfig.drawerHeightRatios[index] - ratio) < 1e-12));
  assert.equal(sum(valid.nextConfig.drawerHeightRatios), 1);
  assert.equal(rebuildNightstandAfterEdit(fixture, valid).structure.valid, true);
  const [property] = getEditableProperties({ model: fixture.model, componentId: "nightstand.drawer.1", config: fixture.config, context: fixture.context });
  const invalid = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", property.max + .001, "heightRatio") });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.code, FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION);
});

test("Nightstand bounds reject low and high edits atomically", () => {
  const fixture = nightstandFixture();
  const original = structuredClone(fixture.config);
  const [property] = getEditableProperties({ model: fixture.model, componentId: "nightstand.drawer.1", config: fixture.config, context: fixture.context });
  for (const value of [property.min - .001, property.max + .001]) {
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", value, "heightRatio") });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION);
    assert.deepEqual(fixture.config, original);
  }
});

test("Nightstand invalid targets, values and foreign configs use controlled errors", () => {
  const fixture = nightstandFixture();
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.top", .4, "heightRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.4", .25, "heightRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", .4, "widthRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE);
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, "not-a-number"]) assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", value, "heightRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE);
  for (const config of [wardrobeFixture().config, tvStandFixture().config, { drawerModuleSide: "right", drawerModuleWidthRatio: .35 }]) {
    assert.equal(applyFurnitureModelEdit({ ...fixture, config, edit: edit("nightstand.drawer.1", .4, "heightRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
  }
});

test("Nightstand editing is deterministic, immutable and normalizes legacy config by drawer count", () => {
  for (const drawers of [2, 3, 4]) {
    const fixture = nightstandFixture({ drawers, heightCm: drawers === 4 ? 70 : 55 });
    const legacy = { rearEnabled: true };
    const snapshots = { config: structuredClone(legacy), model: structuredClone(fixture.model), components: structuredClone(fixture.model.components), relations: structuredClone(fixture.model.relations), regions: structuredClone(fixture.model.regions), diagnostics: structuredClone(fixture.model.diagnostics) };
    const value = drawers === 4 ? .3 : drawers === 3 ? .3 : .4;
    const request = { model: fixture.model, config: legacy, context: fixture.context, edit: edit("nightstand.drawer.1", value, "heightRatio") };
    const first = applyFurnitureModelEdit(request);
    const second = applyFurnitureModelEdit(request);
    assert.deepEqual(first, second);
    assert.equal(first.ok, true);
    assert.equal(first.nextConfig.drawerHeightRatios.length, drawers);
    assert.equal(sum(first.nextConfig.drawerHeightRatios), 1);
    assert.deepEqual(legacy, snapshots.config);
    assert.deepEqual(fixture.model, snapshots.model);
    assert.deepEqual(fixture.model.components, snapshots.components);
    assert.deepEqual(fixture.model.relations, snapshots.relations);
    assert.deepEqual(fixture.model.regions, snapshots.regions);
    assert.deepEqual(fixture.model.diagnostics, snapshots.diagnostics);
  }
});

function rebuildNightstandAfterEdit(fixture, result) {
  const input = { ...fixture.input, nightstandStructureConfig: result.nextConfig };
  const structure = calculateNightstandStructure({ ...input, thicknessCm: fixture.context.thicknessCm, structureConfig: result.nextConfig });
  const generatedPieces = getCutPieces(input);
  return { generatedPieces, model: buildFurnitureModel({ ...input, generatedPieces, structure }), structure };
}

test("Nightstand 40/60 integration rebuilds fronts, boxes, regions and manufacturing flow", () => {
  const fixture = nightstandFixture();
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("nightstand.drawer.1", .4, "heightRatio") });
  const rebuilt = rebuildNightstandAfterEdit(fixture, result);
  assert.deepEqual(rebuilt.structure.config.drawerHeightRatios, [.4, .6]);
  assert.deepEqual(rebuilt.structure.drawerFrontHeightsCm, [17.5, 26.5]);
  assert.deepEqual(rebuilt.structure.drawerBoxHeightsCm, [17.8, 26.8]);
  assert.deepEqual(rebuilt.structure.drawerSideHeightsCm, [16, 25]);
  for (let index = 0; index < 2; index += 1) {
    const number = index + 1;
    const front = rebuilt.model.components.find(({ id }) => id === `nightstand.drawer.${number}.front`);
    const side = rebuilt.model.components.find(({ id }) => id === `nightstand.drawer.${number}.left-side`);
    const back = rebuilt.model.components.find(({ id }) => id === `nightstand.drawer.${number}.back`);
    assert.equal(front.dimensions.depthCm, rebuilt.structure.drawerFrontHeightsCm[index]);
    assert.equal(front.position.yCm, rebuilt.structure.drawerGeometry.drawerLayouts[index].frontCenterYCm);
    assert.equal(side.dimensions.depthCm, rebuilt.structure.drawerSideHeightsCm[index]);
    assert.equal(back.dimensions.depthCm, rebuilt.structure.drawerSideHeightsCm[index]);
  }
  assert.equal(rebuilt.model.regions.length, 4);
  assert.deepEqual(rebuilt.model.regions.filter(({ role }) => role === "drawer-front-region").map(getRegionHeight), [17.5, 26.5]);
  assert.deepEqual(rebuilt.model.regions.filter(({ role }) => role === "front-opening").map(getRegionHeight), [17.5, 26.5]);
  assert.deepEqual(rebuilt.model.relations.map(({ id }) => id), fixture.model.relations.map(({ id }) => id));
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
  assert.deepEqual(rebuilt.generatedPieces.filter(({ name }) => name === "Frente de cajón").map(({ width }) => width), [17.5, 26.5]);
  assert.deepEqual(rebuilt.generatedPieces.filter(({ name }) => name === "Lateral izquierdo de cajón").map(({ width }) => width), [16, 25]);
  assert.deepEqual(rebuilt.generatedPieces.filter(({ name }) => name === "Parte trasera de cajón").map(({ width }) => width), [16, 25]);
  assert.deepEqual(rebuilt.generatedPieces.filter(({ name }) => name === "Base de cartón prensado del cajón").map(({ length, width, material }) => [length, width, material.id]), fixture.generatedPieces.filter(({ name }) => name === "Base de cartón prensado del cajón").map(({ length, width, material }) => [length, width, material.id]));
  const optimized = optimizeAllMaterials(rebuilt.generatedPieces, materials);
  assert.equal(optimized.melamine.unplaced.length + optimized.hardboard.unplaced.length, 0);
});

test("Nightstand 35/65 and 60/40 keep the established manufacturable heights", () => {
  const fixture = nightstandFixture();
  const cases = [
    ["nightstand.drawer.2", .65, [.35, .65], [15.5, 28.5]],
    ["nightstand.drawer.1", .6, [.6, .4], [26.5, 17.5]],
  ];
  for (const [componentId, value, ratios, heights] of cases) {
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit(componentId, value, "heightRatio") });
    const rebuilt = rebuildNightstandAfterEdit(fixture, result);
    assert.deepEqual(result.nextConfig.drawerHeightRatios, ratios);
    assert.deepEqual(rebuilt.structure.drawerFrontHeightsCm, heights);
    assert.deepEqual(rebuilt.model.diagnostics, []);
  }
});

function rebuildDeskAfterEdit(fixture, result) {
  const input = { ...fixture.input, deskConfig: result.nextConfig };
  const drawerDimensions = calculateDrawerSlideDimensions({ ...input, thicknessCm: fixture.context.thicknessCm });
  const structure = calculateDeskStructure({ ...input, thicknessCm: fixture.context.thicknessCm, bottomThicknessCm: fixture.context.bottomThicknessCm, drawerDimensions });
  const generatedPieces = getCutPieces(input);
  return { drawerDimensions, generatedPieces, model: buildFurnitureModel({ ...input, generatedPieces, structure }), structure };
}

test("editable properties expose side and width only on the semantic Desk drawer module", () => {
  const fixture = deskFixture();
  const properties = getEditableProperties({ model: fixture.model, componentId: "desk.drawerModule", config: fixture.config, context: fixture.context });
  assert.deepEqual(properties.map(({ key, type }) => [key, type]), [["moduleSide", "select"], ["moduleWidthRatio", "number"]]);
  assert.deepEqual(properties[0].options, [{ value: "left", label: "Left" }, { value: "right", label: "Right" }]);
  assert.equal(properties[0].value, "right");
  assert.equal(properties[1].value, DEFAULT_DESK_DRAWER_MODULE_RATIO);
  assert.equal(properties[1].unit, "%");
  assert.equal(properties[1].step, .001);
  assert.equal(properties[1].metadata.minimumLegRoomCm, DESK_MINIMUM_LEGROOM_WIDTH_CM);
  assert.equal(properties[1].metadata.minimumModuleWidthCm, fixture.structure.minimumModuleWidthCm);
  for (const id of ["desk.legOpening", "desk.divider", "desk.drawer.1", "desk.drawer.1.front", "desk.top", "desk.leftSide", "desk.rightSide", "desk.rearCrossbar"]) {
    assert.deepEqual(getEditableProperties({ model: fixture.model, componentId: id, config: fixture.config, context: fixture.context }), []);
  }
});

test("Desk module side edits work in both directions without changing dimensions", () => {
  for (const [from, to] of [["right", "left"], ["left", "right"]]) {
    const fixture = deskFixture({ side: from, ratio: .35 });
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", to, "moduleSide") });
    assert.equal(result.ok, true);
    assert.equal(result.nextConfig.drawerModuleSide, to);
    assert.equal(result.nextConfig.drawerModuleWidthRatio, .35);
    const rebuilt = rebuildDeskAfterEdit(fixture, result);
    assert.equal(rebuilt.structure.moduleCenterXCm, -fixture.structure.moduleCenterXCm);
    assert.equal(rebuilt.structure.dividerCenterXCm, -fixture.structure.dividerCenterXCm);
    assert.equal(rebuilt.structure.sectionGeometry.freeOpeningCenterXCm, -fixture.structure.sectionGeometry.freeOpeningCenterXCm);
    assert.deepEqual([rebuilt.structure.moduleWidthCm, rebuilt.structure.drawerOpeningWidthCm, rebuilt.structure.legroomWidthCm], [fixture.structure.moduleWidthCm, fixture.structure.drawerOpeningWidthCm, fixture.structure.legroomWidthCm]);
    assert.deepEqual(rebuilt.generatedPieces.map(({ name, length, width }) => [name, length, width]), fixture.generatedPieces.map(({ name, length, width }) => [name, length, width]));
  }
});

test("Desk side integration mirrors components and regions while preserving semantic identities", () => {
  const fixture = deskFixture({ side: "right", ratio: .35 });
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", "left", "moduleSide") });
  const rebuilt = rebuildDeskAfterEdit(fixture, result);
  for (const id of ["desk.drawerModule", "desk.legOpening", "desk.divider", "desk.drawer.1", "desk.drawer.2", "desk.drawer.3", "desk.drawer.1.front"]) {
    const before = fixture.model.components.find((component) => component.id === id);
    const after = rebuilt.model.components.find((component) => component.id === id);
    assert.equal(after.position.xCm, -before.position.xCm);
  }
  assert.deepEqual(rebuilt.model.components.map(({ id }) => id), fixture.model.components.map(({ id }) => id));
  assert.deepEqual(rebuilt.model.relations.map(({ id }) => id), fixture.model.relations.map(({ id }) => id));
  assert.deepEqual(rebuilt.model.regions.map(({ id }) => id), fixture.model.regions.map(({ id }) => id));
  fixture.model.regions.forEach((before, index) => {
    const after = rebuilt.model.regions[index];
    assert.equal(after.region.minX, -before.region.maxX);
    assert.equal(after.region.maxX, -before.region.minX);
  });
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
});

test("Desk width edit uses the current section geometry for 35 and 30 percent", () => {
  const fixture = deskFixture();
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") });
  const rebuilt = rebuildDeskAfterEdit(fixture, result);
  const expected = getDeskSectionGeometry({ widthCm: 140, thicknessCm: 1.5, deskConfig: { ...fixture.config, drawerModuleWidthRatio: .35 } });
  assert.equal(result.ok, true);
  assert.equal(result.nextConfig.drawerModuleSide, "right");
  assert.equal(result.nextConfig.drawerModuleWidthRatio, .35);
  assert.deepEqual({ module: rebuilt.structure.moduleWidthCm, opening: rebuilt.structure.drawerOpeningWidthCm, legs: rebuilt.structure.legroomWidthCm, divider: rebuilt.structure.dividerCenterXCm }, { module: expected.moduleWidthCm, opening: expected.drawerOpeningWidthCm, legs: expected.legroomWidthCm, divider: expected.dividerCenterXCm });
  const thirty = getDeskSectionGeometry({ widthCm: 140, thicknessCm: 1.5, deskConfig: { ...fixture.config, drawerModuleWidthRatio: .3 } });
  assert.deepEqual({ module: thirty.moduleWidthCm, opening: thirty.drawerOpeningWidthCm, legs: thirty.legroomWidthCm }, { module: 43.5, opening: 40.5, legs: 95 });
});

test("Desk width edits on the left mirror right geometry without duplicated rules", () => {
  const right = deskFixture({ side: "right" });
  const left = deskFixture({ side: "left" });
  const rightResult = rebuildDeskAfterEdit(right, applyFurnitureModelEdit({ ...right, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") }));
  const leftResult = rebuildDeskAfterEdit(left, applyFurnitureModelEdit({ ...left, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") }));
  assert.deepEqual([leftResult.structure.moduleWidthCm, leftResult.structure.drawerOpeningWidthCm, leftResult.structure.legroomWidthCm], [rightResult.structure.moduleWidthCm, rightResult.structure.drawerOpeningWidthCm, rightResult.structure.legroomWidthCm]);
  assert.equal(leftResult.structure.moduleCenterXCm, -rightResult.structure.moduleCenterXCm);
  assert.equal(leftResult.structure.dividerCenterXCm, -rightResult.structure.dividerCenterXCm);
  assert.equal(leftResult.structure.sectionGeometry.freeOpeningCenterXCm, -rightResult.structure.sectionGeometry.freeOpeningCenterXCm);
});

test("Desk constructive width limits reject low and high values atomically", () => {
  const fixture = deskFixture();
  const original = structuredClone(fixture.config);
  const width = getEditableProperties({ model: fixture.model, componentId: "desk.drawerModule", config: fixture.config, context: fixture.context }).find(({ key }) => key === "moduleWidthRatio");
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", width.min, "moduleWidthRatio") }).ok, true);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", width.max, "moduleWidthRatio") }).ok, true);
  for (const value of [width.min - .001, width.max + .001]) {
    const result = applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", value, "moduleWidthRatio") });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION);
    assert.deepEqual(fixture.config, original);
  }
});

test("Desk invalid side, component, property and foreign configs fail cleanly", () => {
  const fixture = deskFixture();
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", "center", "moduleSide") }).error.code, FURNITURE_EDIT_ERROR_CODES.INVALID_VALUE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("desk.top", .35, "moduleWidthRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", .35, "heightRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.PROPERTY_NOT_EDITABLE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, config: wardrobeFixture().config, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
  assert.equal(applyFurnitureModelEdit({ ...fixture, model: nightstandFixture().model, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") }).error.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
});

test("Desk editing is deterministic, immutable and normalizes legacy side and ratio", () => {
  const fixture = deskFixture();
  const legacy = { drawerFrontGapCm: .3, rearCrossbarHeightCm: 10, moduleBraceHeightCm: 6 };
  const snapshots = { config: structuredClone(legacy), model: structuredClone(fixture.model), components: structuredClone(fixture.model.components), regions: structuredClone(fixture.model.regions), relations: structuredClone(fixture.model.relations), diagnostics: structuredClone(fixture.model.diagnostics) };
  const request = { model: fixture.model, config: legacy, context: fixture.context, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") };
  const first = applyFurnitureModelEdit(request);
  const second = applyFurnitureModelEdit(request);
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.equal(first.nextConfig.drawerModuleSide, "right");
  assert.equal(first.nextConfig.drawerModuleWidthRatio, .35);
  assert.deepEqual(legacy, snapshots.config);
  assert.deepEqual(fixture.model, snapshots.model);
  assert.deepEqual(fixture.model.components, snapshots.components);
  assert.deepEqual(fixture.model.regions, snapshots.regions);
  assert.deepEqual(fixture.model.relations, snapshots.relations);
  assert.deepEqual(fixture.model.diagnostics, snapshots.diagnostics);
});

test("Desk 35 percent integration rebuilds manufacturing pieces, regions and diagnostics", () => {
  const fixture = deskFixture();
  const result = applyFurnitureModelEdit({ ...fixture, edit: edit("desk.drawerModule", .35, "moduleWidthRatio") });
  const rebuilt = rebuildDeskAfterEdit(fixture, result);
  assert.deepEqual({ module: rebuilt.structure.moduleWidthCm, opening: rebuilt.structure.drawerOpeningWidthCm, legs: rebuilt.structure.legroomWidthCm, divider: rebuilt.structure.dividerCenterXCm }, { module: 50.5, opening: 47.5, legs: 88, divider: 20.25 });
  assert.equal(rebuilt.model.components.find(({ id }) => id === "desk.drawerModule").dimensions.widthCm, 50.5);
  assert.equal(rebuilt.model.components.find(({ id }) => id === "desk.legOpening").dimensions.widthCm, 88);
  for (let number = 1; number <= 3; number += 1) {
    const drawer = rebuilt.model.components.find(({ id }) => id === `desk.drawer.${number}`);
    const front = rebuilt.model.components.find(({ id }) => id === `desk.drawer.${number}.front`);
    assert.equal(drawer.dimensions.widthCm, 47.5);
    assert.equal(front.position.xCm, rebuilt.structure.moduleCenterXCm);
    assert.ok(rebuilt.model.relations.some(({ sourceId, type, targetId }) => sourceId === drawer.id && type === "contained-in" && targetId === "desk.drawerModule"));
  }
  assert.equal(rebuilt.model.regions.length, 6);
  rebuilt.model.regions.forEach((region) => assert.equal(region.region.maxX - region.region.minX, region.role === "front-opening" ? 47.5 : 50.5));
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
  assert.equal(rebuilt.generatedPieces.find(({ name }) => name === "Frente cajón superior").length, 50.5);
  assert.equal(rebuilt.generatedPieces.find(({ name }) => name === "Parte trasera de cajón").length, 42);
  assert.equal(rebuilt.generatedPieces.find(({ name }) => name === "Base de cartón prensado del cajón").length, 45);
  const optimized = optimizeAllMaterials(rebuilt.generatedPieces, materials);
  assert.equal(optimized.melamine.unplaced.length + optimized.hardboard.unplaced.length, 0);
});

test("Wardrobe transaction applies ordered edits and emits a deterministic leaf diff", () => {
  const fixture = wardrobeFixture();
  const edits = [edit("wardrobe.body.1", .25), edit("wardrobe.body.2", .4)];
  const result = applyFurnitureModelTransaction({ ...fixture, edits });
  assert.equal(result.ok, true);
  assert.equal(result.furnitureType, "wardrobe");
  assert.deepEqual(result.nextConfig.sectionWidthRatios, [.24, .4, .36]);
  assert.deepEqual(result.appliedEdits, edits);
  assert.deepEqual(result.diff, [
    { path: "sectionWidthRatios[0]", before: 1 / 3, after: .24 },
    { path: "sectionWidthRatios[1]", before: 1 / 3, after: .4 },
    { path: "sectionWidthRatios[2]", before: 1 / 3, after: .36 },
  ]);
  const rebuilt = rebuildAfterEdit(fixture, { nextConfig: result.nextConfig });
  assert.deepEqual(rebuilt.structure.sectionWidthsCm, [58.5, 97.5, 88]);
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
});

test("transaction failure reports the failed edit and rolls back every prior candidate", () => {
  const fixture = wardrobeFixture();
  const edits = [edit("wardrobe.body.1", .25), edit("wardrobe.body.2", .95)];
  const configSnapshot = structuredClone(fixture.config);
  const result = applyFurnitureModelTransaction({ ...fixture, edits });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, FURNITURE_EDIT_ERROR_CODES.TRANSACTION_FAILED);
  assert.equal(result.error.cause.code, FURNITURE_EDIT_ERROR_CODES.CONSTRAINT_VIOLATION);
  assert.equal(result.failedEditIndex, 1);
  assert.deepEqual(result.edit, edits[1]);
  assert.equal(result.nextConfig, undefined);
  assert.deepEqual(fixture.config, configSnapshot);
});

test("transactions are deterministic, immutable and omit unchanged config fields from diff", () => {
  const fixture = deskFixture();
  const edits = [edit("desk.drawerModule", "left", "moduleSide"), edit("desk.drawerModule", .35, "moduleWidthRatio")];
  const snapshots = { config: structuredClone(fixture.config), model: structuredClone(fixture.model), edits: structuredClone(edits), relations: structuredClone(fixture.model.relations), regions: structuredClone(fixture.model.regions), diagnostics: structuredClone(fixture.model.diagnostics) };
  const first = applyFurnitureModelTransaction({ ...fixture, edits });
  const second = applyFurnitureModelTransaction({ ...fixture, edits });
  assert.deepEqual(first, second);
  assert.deepEqual(first.diff, [
    { path: "drawerModuleSide", before: "right", after: "left" },
    { path: "drawerModuleWidthRatio", before: DEFAULT_DESK_DRAWER_MODULE_RATIO, after: .35 },
  ]);
  assert.deepEqual(first.appliedEdits, edits);
  assert.deepEqual(fixture.config, snapshots.config);
  assert.deepEqual(fixture.model, snapshots.model);
  assert.deepEqual(edits, snapshots.edits);
  assert.deepEqual(fixture.model.relations, snapshots.relations);
  assert.deepEqual(fixture.model.regions, snapshots.regions);
  assert.deepEqual(fixture.model.diagnostics, snapshots.diagnostics);
});

test("Desk multi-property transaction rebuilds left 35 percent atomically", () => {
  const fixture = deskFixture();
  const result = applyFurnitureModelTransaction({ ...fixture, edits: [edit("desk.drawerModule", "left", "moduleSide"), edit("desk.drawerModule", .35, "moduleWidthRatio")] });
  const rebuilt = rebuildDeskAfterEdit(fixture, result);
  assert.equal(result.ok, true);
  assert.equal(result.nextConfig.drawerModuleSide, "left");
  assert.equal(result.nextConfig.drawerModuleWidthRatio, .35);
  assert.deepEqual({ module: rebuilt.structure.moduleWidthCm, opening: rebuilt.structure.drawerOpeningWidthCm, legs: rebuilt.structure.legroomWidthCm, divider: rebuilt.structure.dividerCenterXCm }, { module: 50.5, opening: 47.5, legs: 88, divider: -20.25 });
  assert.equal(rebuilt.model.components.find(({ id }) => id === "desk.drawerModule").position.xCm, -44.75);
  assert.equal(rebuilt.model.components.find(({ id }) => id === "desk.legOpening").position.xCm, 24.5);
  assert.equal(rebuilt.model.regions.length, 6);
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
});

test("TV Stand transaction preserves the complete controlled-edit contract", () => {
  const fixture = tvStandFixture();
  const [property] = getEditableProperties({ model: fixture.model, componentId: "tvStand.section.1", config: fixture.config, context: fixture.context });
  const result = applyFurnitureModelTransaction({ ...fixture, edits: [edit("tvStand.section.1", .35)] });
  const rebuilt = rebuildTvStandAfterEdit(fixture, result);
  assert.equal(property.key, "widthRatio");
  assert.deepEqual(result.nextConfig.sectionWidthRatios, [.35, .65]);
  assert.deepEqual(result.diff.map(({ path }) => path), ["sectionWidthRatios[0]", "sectionWidthRatios[1]"]);
  assert.deepEqual(rebuilt.structure.sectionWidthsCm, [61.5, 114]);
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(rebuilt.model.validation.valid, true);
});

test("Nightstand transaction preserves drawer geometry, regions and manufacturing", () => {
  const fixture = nightstandFixture();
  const [property] = getEditableProperties({ model: fixture.model, componentId: "nightstand.drawer.1", config: fixture.config, context: fixture.context });
  const result = applyFurnitureModelTransaction({ ...fixture, edits: [edit("nightstand.drawer.1", .4, "heightRatio")] });
  const rebuilt = rebuildNightstandAfterEdit(fixture, result);
  assert.equal(property.key, "heightRatio");
  assert.deepEqual(result.nextConfig.drawerHeightRatios, [.4, .6]);
  assert.deepEqual(rebuilt.structure.drawerFrontHeightsCm, [17.5, 26.5]);
  assert.equal(rebuilt.model.regions.length, 4);
  assert.deepEqual(rebuilt.model.diagnostics, []);
  assert.equal(optimizeAllMaterials(rebuilt.generatedPieces, materials).melamine.unplaced.length, 0);
});

test("Cat House remains non-editable and mixed-furniture transactions are rejected", () => {
  const model = { furnitureType: "catHouse", components: [{ id: "catHouse.root", type: "section", role: "root" }], relations: [], regions: [], diagnostics: [] };
  assert.deepEqual(getEditableProperties({ model, componentId: "catHouse.root", config: {}, context: {} }), []);
  const unsupported = applyFurnitureModelTransaction({ model, config: {}, edits: [{ componentId: "catHouse.root", property: "widthRatio", value: .5 }], context: {} });
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.error.code, FURNITURE_EDIT_ERROR_CODES.TRANSACTION_FAILED);
  assert.equal(unsupported.error.cause.code, FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE);
  const wardrobe = wardrobeFixture();
  const mixed = applyFurnitureModelTransaction({ ...wardrobe, edits: [edit("wardrobe.body.1", .25), edit("desk.drawerModule", .35, "moduleWidthRatio")] });
  assert.equal(mixed.failedEditIndex, 1);
  assert.equal(mixed.error.cause.code, FURNITURE_EDIT_ERROR_CODES.COMPONENT_NOT_EDITABLE);
});
