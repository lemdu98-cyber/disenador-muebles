import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { validateAllFurniturePieces } from "../src/utils/manufacturingValidation.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";

const design = { furnitureType: "wardrobe", widthCm: 250, heightCm: 230, depthCm: 60, drawers: 6, shelves: 3, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, wardrobeConfig: DEFAULT_WARDROBE_CONFIG };
const structureFor = (overrides = {}) => {
  const input = { ...design, ...overrides, thicknessCm: 1.5 };
  const drawerDimensions = calculateDrawerSlideDimensions(input);
  return calculateWardrobeStructure({ ...input, drawerDimensions });
};

test("default wardrobe calculates three equal useful bodies", () => {
  const structure = structureFor();
  assert.equal(structure.valid, true);
  assert.equal(structure.sideHeightCm, 228.5);
  assert.equal(structure.openingWidthCm, 244 / 3);
  assert.equal(structure.panelCentersXCm.length, 4);
  assert.equal(structure.drawerLayouts.length, 6);
  assert.equal(structure.shoeShelfYCentersCm.length, 3);
});

test("cut list contains one top, six crossbars, modular backs and explicitly named drawers", () => {
  const materialConfigs = createMaterialConfig();
  const pieces = getCutPieces({ ...design, materialConfigs });
  const countMatching = (pattern) => pieces.filter((piece) => pattern.test(piece.name)).length;
  assert.equal(countMatching(/^Tapa superior$/), 1);
  assert.equal(countMatching(/^Tapa superior Cuerpo/), 0);
  assert.equal(countMatching(/^Base inferior Cuerpo/), 0);
  assert.equal(countMatching(/^Travesaño (frontal|trasero) inferior Cuerpo/), 6);
  assert.equal(countMatching(/^Repisa superior Cuerpo/), 3);
  assert.equal(countMatching(/^Puerta Cuerpo/), 3);
  assert.equal(countMatching(/^Fondo cartón prensado Cuerpo/), 3);
  assert.equal(countMatching(/^Frente Cajón/), 6);
  assert.equal(countMatching(/^Base cartón prensado Cajón/), 6);
  assert.equal(countMatching(/^Repisa zapatos/), 3);
  assert.equal(countMatching(/^Repisa intermedia [12] Cuerpo 1/), 2);
  assert.equal(validateAllFurniturePieces(pieces, materialConfigs).valid, true);
});

test("drawers and shoe shelves start above crossbars and intermediate shelves split three equal clearances", () => {
  const structure = structureFor();
  const lowestDrawerBottom = structure.drawerLayouts[0].centerYCm - structure.drawerFrontHeightCm / 2;
  assert.ok(lowestDrawerBottom > structure.lowerStructureTopCm);
  assert.ok(structure.shoeShelfYCentersCm[0] - .75 > structure.lowerStructureTopCm);
  const lowerTop = structure.drawerShelfYCm + .75;
  const upperBottom = structure.upperShelfYCm - .75;
  const [first, second] = structure.intermediateShelfYCentersCm;
  const clearances = [first - .75 - lowerTop, second - .75 - (first + .75), upperBottom - (second + .75)];
  assert.ok(clearances.every((gap) => Math.abs(gap - clearances[0]) < 1e-9));
});

test("every modular hardboard back is individually validated", () => {
  const materialConfigs = createMaterialConfig();
  materialConfigs.hardboard = { ...materialConfigs.hardboard, lengthCm: 200, widthCm: 100 };
  const pieces = getCutPieces({ ...design, materialConfigs });
  const validation = validateAllFurniturePieces(pieces, materialConfigs);
  assert.equal(validation.valid, false);
  assert.match(validation.error, /Fondo cartón prensado Cuerpo 1/);
});

test("invalid hanging and shoe spacing configurations are rejected", () => {
  const wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, shoeRegionHeightCm: 35, minimumShoeSpacingCm: 14 };
  const structure = structureFor({ shelves: 5, wardrobeConfig });
  assert.equal(structure.valid, false);
  assert.match(structure.error, /zapatero quedarían demasiado juntas/);
});
