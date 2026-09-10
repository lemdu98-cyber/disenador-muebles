import test from "node:test";
import assert from "node:assert/strict";
import { applyFurnitureModelEdit, FURNITURE_EDIT_ERROR_CODES, getEditableProperties } from "../src/utils/furnitureModel/index.js";
import { buildFurnitureModel } from "../src/utils/furnitureModel/index.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "../src/utils/drawerFront.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { getCutPieces } from "../src/utils/cutPieces.js";

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
