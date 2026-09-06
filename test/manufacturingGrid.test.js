import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "../src/utils/drawerFront.js";
import { DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { isManufacturableCutDimension, resolveDrawerManufacturingWidth, snapCutDimension, snapCutDimensionWithConstraints, snapDistributedDimensions } from "../src/utils/manufacturingGrid.js";
import { validateAllFurniturePieces } from "../src/utils/manufacturingValidation.js";

test("snap nearest usa milímetros y produce cortes estables de 5 mm", () => {
  assert.deepEqual([16.93, 18.73, 75.79, 81.33, 73.2, 97.6].map(snapCutDimension), [17, 18.5, 76, 81.5, 73, 97.5]);
  assert.equal(isManufacturableCutDimension(35), true);
  assert.equal(isManufacturableCutDimension(35.5), true);
  assert.equal(isManufacturableCutDimension(35.00000001), true);
  assert.equal(isManufacturableCutDimension(35.25), false);
});

test("floor y restricciones nunca agrandan una pieza interior", () => {
  assert.equal(snapCutDimension(73.2, "floor"), 73);
  assert.equal(snapCutDimensionWithConstraints(73.2, { maxCm: 73.2 }), 73);
});

test("reparto compensado conserva 244 cm minimizando el error", () => {
  const result = snapDistributedDimensions([73.2, 97.6, 73.2], 244);
  assert.deepEqual(result, [73.5, 97.5, 73]);
  assert.equal(result.reduce((sum, value) => sum + value, 0), 244);
  assert.ok(result.every(isManufacturableCutDimension));
  assert.deepEqual(snapDistributedDimensions([61, 122, 61], 244), [61, 122, 61]);
});

test("cajón selecciona una trasera fabricable y conserva la holgura", () => {
  const result = resolveDrawerManufacturingWidth({ openingWidthCm: 47, theoreticalBoxWidthCm: 44.46, panelThicknessCm: 1.5, desiredClearanceCm: 2.54 });
  assert.equal(result.valid, true);
  assert.equal(result.backWidthCm, 41.5);
  assert.equal(result.boxWidthCm, 44.5);
  assert.equal(result.effectiveClearanceCm, 2.5);
  assert.ok(Math.abs(result.clearanceDeltaCm) <= .25);
});

const materialConfigs = createMaterialConfig();
const common = { materialConfigs, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, drawerFrontConfig: DEFAULT_DRAWER_FRONT_CONFIG };
const designs = [
  { furnitureType: "nightstand", widthCm: 53, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0 },
  { furnitureType: "desk", widthCm: 120, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0 },
  { furnitureType: "tvStand", widthCm: 160, heightCm: 55, depthCm: 40, drawers: 0, shelves: 1 },
  { furnitureType: "catHouse", widthCm: 60, heightCm: 70, depthCm: 50, drawers: 0, shelves: 0 },
  { furnitureType: "wardrobe", widthCm: 250, heightCm: 230, depthCm: 60, drawers: 6, shelves: 3, wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: [30, 40, 30] } },
];

test("todas las piezas físicas de los cinco muebles salen en grid y siguen siendo válidas", () => {
  for (const design of designs) {
    const pieces = getCutPieces({ ...common, ...design });
    assert.ok(pieces.length > 0, design.furnitureType);
    assert.ok(pieces.every((piece) => piece.length > 0 && piece.width > 0), design.furnitureType);
    assert.ok(pieces.every((piece) => isManufacturableCutDimension(piece.length) && isManufacturableCutDimension(piece.width)), design.furnitureType);
    assert.equal(validateAllFurniturePieces(pieces, materialConfigs).valid, true, design.furnitureType);
  }
});

test("ropero valida tercios, 30/40/30 y 25/50/25 sin perder piezas", () => {
  for (const ratios of [[1, 1, 1], [30, 40, 30], [25, 50, 25]]) {
    const pieces = getCutPieces({ ...common, ...designs[4], wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, sectionWidthRatios: ratios } });
    assert.ok(pieces.length >= 50);
    assert.ok(pieces.every((piece) => isManufacturableCutDimension(piece.length) && isManufacturableCutDimension(piece.width)));
  }
});

test("el ejemplo reportado del ropero ya no contiene centésimas en cortes", () => {
  const pieces = getCutPieces({ ...common, ...designs[4] });
  for (const name of ["Lateral derecho Cajón 1 Cuerpo 1", "Parte trasera Cajón 1 Cuerpo 1", "Frente Cajón 2 Cuerpo 1"]) {
    const piece = pieces.find((candidate) => candidate.name === name);
    assert.ok(piece, name);
    assert.ok(isManufacturableCutDimension(piece.length) && isManufacturableCutDimension(piece.width));
  }
  const distributed = [1, 2, 3].map((body) => pieces.find((piece) => piece.name === `Travesaño frontal inferior Cuerpo ${body}`).length);
  assert.equal(distributed.reduce((sum, value) => sum + value, 0), 244);
});
