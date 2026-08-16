import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { validateAllFurniturePieces } from "../src/utils/manufacturingValidation.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";

const design = { furnitureType: "wardrobe", widthCm: 180, heightCm: 220, depthCm: 60, drawers: 2, shelves: 3, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, wardrobeConfig: DEFAULT_WARDROBE_CONFIG };

test("default wardrobe has two useful zones and thickness-driven carcass", () => {
  const drawerDimensions = calculateDrawerSlideDimensions({ ...design, thicknessCm: 1.5 });
  const structure = calculateWardrobeStructure({ ...design, thicknessCm: 1.5, drawerDimensions });
  assert.equal(structure.valid, true);
  assert.equal(structure.sideHeightCm, 218.5);
  assert.equal(structure.leftOpeningWidthCm, 70);
  assert.equal(structure.rightOpeningWidthCm, 105.5);
  assert.equal(structure.shelfYCentersCm.length, 3);
  assert.equal(structure.drawerLayouts.length, 2);
});

test("manufacturing list separates melamine and hardboard and includes the complete back", () => {
  const materialConfigs = createMaterialConfig();
  const pieces = getCutPieces({ ...design, materialConfigs });
  const count = (name) => pieces.filter((piece) => piece.name === name).length;
  assert.equal(count("Divisor vertical"), 1);
  assert.equal(count("Repisa zona izquierda"), 3);
  assert.equal(count("Puerta izquierda"), 1);
  assert.equal(count("Puerta derecha"), 1);
  assert.equal(count("Base de cartón prensado del cajón"), 2);
  const back = pieces.find((piece) => piece.name === "Fondo completo del ropero");
  assert.deepEqual([back.length, back.width, back.material.id], [180, 220, "hardboard"]);
  assert.equal(validateAllFurniturePieces(pieces, materialConfigs).valid, true);
});

test("an undersized hardboard sheet rejects the complete back without splitting it", () => {
  const materialConfigs = createMaterialConfig();
  materialConfigs.hardboard = { ...materialConfigs.hardboard, lengthCm: 200, widthCm: 160 };
  const pieces = getCutPieces({ ...design, materialConfigs });
  const validation = validateAllFurniturePieces(pieces, materialConfigs);
  assert.equal(validation.valid, false);
  assert.match(validation.error, /Fondo completo del ropero/);
  assert.match(validation.error, /No se dividirá automáticamente/);
});

test("the hanging zone cannot be made useless", () => {
  const wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, leftZoneWidthCm: 120 };
  const drawerDimensions = calculateDrawerSlideDimensions({ ...design, wardrobeConfig, thicknessCm: 1.5 });
  const structure = calculateWardrobeStructure({ ...design, wardrobeConfig, thicknessCm: 1.5, drawerDimensions });
  assert.equal(structure.valid, false);
  assert.match(structure.error, /ropa colgada es demasiado estrecha/);
});
