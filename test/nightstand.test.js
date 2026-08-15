import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { calculateNightstandStructure, practicalDrawerHeightCm } from "../src/utils/nightstandStructure.js";

const design = {
  furnitureType: "nightstand",
  widthCm: 50,
  heightCm: 55,
  depthCm: 40,
  drawers: 2,
  doors: 0,
  shelves: 0,
  drawerFrontConfig: { type: "overlay", gapMm: 2 },
};

test("nightstand dimensions come from the shared structure calculation", () => {
  const structure = calculateNightstandStructure({ ...design, thicknessCm: 1.5 });
  assert.equal(structure.drawerFrontWidthCm, 50);
  assert.equal(structure.topDepthCm, 41.5);
  assert.equal(structure.drawerFrontHeightCm, 22);
  assert.equal(structure.drawerSideHeightCm, 20);
  assert.equal(structure.frontGapCm, 0.2);
});

test("only practical drawer heights are simplified and exact half centimetres remain", () => {
  assert.equal(practicalDrawerHeightCm(20.3), 20);
  assert.equal(practicalDrawerHeightCm(20.1), 20);
  assert.equal(practicalDrawerHeightCm(20.4), 20);
  assert.equal(practicalDrawerHeightCm(20.5), 20.5);
  assert.equal(practicalDrawerHeightCm(21.6), 22);
});

test("cut pieces use the overlay front without widening the drawer box", () => {
  const pieces = getCutPieces(design);
  const named = (name) => pieces.filter((piece) => piece.name === name);
  assert.deepEqual(named("Tapa superior").map(({ length, width }) => [length, width]), [[50, 41.5]]);
  assert.deepEqual(named("Frente de cajón").map(({ length, width }) => [length, width]), [[50, 22], [50, 22]]);
  assert.deepEqual(named("Parte trasera de cajón").map(({ length, width }) => [length, width]), [[41.46, 20], [41.46, 20]]);
  assert.deepEqual(named("Lateral izquierdo de cajón").map(({ length, width }) => [length, width]), [[35, 20], [35, 20]]);
});

test("front and top dimensions scale with configured width, depth and thickness", () => {
  const structure = calculateNightstandStructure({ ...design, widthCm: 60, depthCm: 45, thicknessCm: 1.8 });
  assert.equal(structure.drawerFrontWidthCm, 60);
  assert.equal(structure.topDepthCm, 46.8);
});
