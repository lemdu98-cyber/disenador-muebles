import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "../src/utils/drawerFront.js";
import { DEFAULT_WARDROBE_CONFIG } from "../src/utils/wardrobeStructure.js";
import { canRotatePiece } from "../src/utils/optimizer/grainEngine.js";
import { getPieceOrientations } from "../src/utils/optimizer/rotationEngine.js";
import { optimizeCuts } from "../src/utils/cuttingOptimizer.js";
import { consolidatePieces, getOrderPieces } from "../src/utils/orderUtils.js";
import { createFixedProduction } from "../src/utils/production/ProductionManager.js";
import { findBestFreePlacement, insertIntoFreeRect } from "../src/utils/production/FreeRectangleManager.js";

const configs = createMaterialConfig();
const common = { materialConfigs: configs, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, drawerFrontConfig: DEFAULT_DRAWER_FRONT_CONFIG };
const piecesFor = (furnitureType, overrides = {}) => getCutPieces({ ...common, furnitureType, widthCm: 100, heightCm: 75, depthCm: 45, drawers: furnitureType === "wardrobe" ? 6 : 3, shelves: 3, ...overrides });
const requiredNames = (pieces) => pieces.filter((piece) => piece.grainRequired).map((piece) => piece.name);

test("Mesa de Noche marca solo sus piezas visibles definidas", () => {
  const pieces = piecesFor("nightstand", { widthCm: 53, heightCm: 55, depthCm: 40, drawers: 2 });
  assert.ok(pieces.filter((piece) => piece.name === "Laterales").every((piece) => piece.grainRequired));
  for (const name of ["Tapa superior", "Frente de cajón", "Travesaño frontal inferior"]) assert.ok(pieces.filter((piece) => piece.name === name).every((piece) => piece.grainRequired), name);
  for (const name of ["Parte trasera de cajón", "Lateral izquierdo de cajón", "Travesaño trasero inferior"]) assert.ok(pieces.filter((piece) => piece.name === name).every((piece) => !piece.grainRequired), name);
});

test("Casa de Gatos deja toda la melamina con orientación libre", () => {
  const pieces = piecesFor("catHouse", { widthCm: 60, heightCm: 70, depthCm: 50, drawers: 0 });
  assert.ok(pieces.every((piece) => piece.grainRequired === false));
});

test("TV Stand restringe únicamente tapa y laterales exteriores", () => {
  const pieces = piecesFor("tvStand", { widthCm: 160, heightCm: 55, depthCm: 40, drawers: 0 });
  assert.deepEqual(new Set(requiredNames(pieces)), new Set(["Tapa superior", "Lateral izquierdo", "Lateral derecho"]));
});

test("Escritorio restringe tapa, laterales y todos los frentes", () => {
  const pieces = piecesFor("desk", { widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3 });
  const required = requiredNames(pieces);
  for (const name of ["Tapa superior", "Lateral izquierdo", "Lateral derecho", "Frente cajón superior", "Frente cajón central", "Frente cajón inferior"]) assert.ok(required.includes(name), name);
  assert.ok(pieces.filter((piece) => piece.name.includes("de cajón") && !piece.name.startsWith("Frente")).every((piece) => !piece.grainRequired));
});

test("Ropero abatible restringe puertas, laterales, frentes y travesaños frontales", () => {
  const pieces = piecesFor("wardrobe", { widthCm: 250, heightCm: 230, depthCm: 60, wardrobeConfig: DEFAULT_WARDROBE_CONFIG });
  assert.equal(pieces.filter((piece) => piece.name.startsWith("Puerta ") && piece.grainRequired).length, 6);
  assert.equal(pieces.filter((piece) => piece.name.startsWith("Frente Cajón") && piece.grainRequired).length, 6);
  assert.equal(pieces.filter((piece) => piece.name.startsWith("Travesaño frontal inferior") && piece.grainRequired).length, 3);
  assert.ok(pieces.filter((piece) => piece.name.startsWith("Travesaño trasero") || piece.name.startsWith("Repisa") || piece.name.startsWith("Parte trasera Cajón")).every((piece) => !piece.grainRequired));
});

test("Ropero corredizo restringe sus tres hojas", () => {
  const pieces = piecesFor("wardrobe", { widthCm: 250, heightCm: 230, depthCm: 60, wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, doorType: "sliding" } });
  assert.equal(pieces.filter((piece) => piece.name.startsWith("Puerta corrediza") && piece.grainRequired).length, 3);
});

test("matriz de rotación respeta configuración global y metadata por pieza", () => {
  const required = { length: 80, width: 30, grainRequired: true };
  const free = { ...required, grainRequired: false };
  assert.equal(canRotatePiece(required, { allowRotation: true, respectGrain: true }), false);
  assert.equal(canRotatePiece(free, { allowRotation: true, respectGrain: true }), true);
  assert.equal(canRotatePiece(required, { allowRotation: true, respectGrain: false }), true);
  assert.equal(canRotatePiece(free, { allowRotation: false, respectGrain: false }), false);
  assert.equal(getPieceOrientations(free, { allowRotation: true, respectGrain: true }).length, 2);
});

test("una pieza libre ahorra una placa al ocupar un hueco mediante giro", () => {
  const material = { ...configs.melamine, lengthCm: 10, widthCm: 6, boardLabel: "Fixture" };
  const base = [{ id: "square", name: "Cuadrada", length: 6, width: 6, areaCm2: 36, material, grainRequired: true }];
  const settings = { mode: "fast", kerfMm: 0, marginsCm: { top: 0, bottom: 0, left: 0, right: 0 }, allowRotation: true, respectGrain: true, useScrapBank: false };
  const restricted = optimizeCuts([...base, { id: "target", name: "Objetivo", length: 6, width: 4, areaCm2: 24, material, grainRequired: true }], { boardConfig: material, optimizerSettings: settings });
  const free = optimizeCuts([...base, { id: "target", name: "Objetivo", length: 6, width: 4, areaCm2: 24, material, grainRequired: false }], { boardConfig: material, optimizerSettings: settings });
  assert.equal(restricted.boards.length, 2);
  assert.equal(free.boards.length, 1);
  assert.equal(free.boards[0].pieces.find((piece) => piece.id === "target").rotated, true);
});

test("Producción, consolidación y fijado conservan grainRequired", () => {
  const orderPieces = getOrderPieces([{ furnitureType: "catHouse", label: "Casa", quantity: 1, params: { furnitureType: "catHouse", widthCm: 60, heightCm: 70, depthCm: 50, drawers: 0, shelves: 0 } }], configs);
  assert.ok(orderPieces.every((piece) => piece.grainRequired === false));
  const mixed = [{ ...orderPieces[0], grainRequired: true }, { ...orderPieces[0], id: "free-copy", grainRequired: false }];
  assert.equal(consolidatePieces(mixed).length, 2);
  const result = { melamine: { boards: [{ pieces: mixed, freeRects: [] }] } };
  const fixed = createFixedProduction(result, configs, { allowRotation: true, respectGrain: true, marginsCm: {} });
  assert.deepEqual(fixed.results.melamine.boards[0].pieces.map((piece) => piece.grainRequired), [true, false]);
});

test("Producción incremental conserva piezas fijadas y rota solo el añadido libre", () => {
  const settings = { kerfMm: 0, allowRotation: true, respectGrain: true };
  const fixedPiece = { id: "fixed", length: 6, width: 6, areaCm2: 36, grainRequired: true, rotated: false, locked: true };
  const board = { pieces: [fixedPiece], freeRects: [{ x: 6, y: 0, width: 4, height: 6 }], usedArea: 36, usableArea: 60 };
  const addition = { id: "addition", length: 6, width: 4, areaCm2: 24, grainRequired: false };
  const placement = findBestFreePlacement([board], addition, settings);
  assert.equal(placement.orientation.rotated, true);
  const updated = insertIntoFreeRect(board, placement, addition, settings);
  assert.equal(updated.pieces[0].rotated, false);
  assert.equal(updated.pieces[0].locked, true);
  assert.equal(updated.pieces[1].grainRequired, false);
  assert.equal(updated.pieces[1].rotated, true);
  assert.equal(findBestFreePlacement([board], { ...addition, grainRequired: true }, settings), null);
});

test("cartón prensado declara veta libre y puede rotar con respectGrain", () => {
  const hardboard = piecesFor("catHouse", { widthCm: 60, heightCm: 70, depthCm: 50, drawers: 0 }).find((piece) => piece.material.id === "hardboard");
  assert.equal(hardboard.grainRequired, false);
  assert.equal(canRotatePiece(hardboard, { allowRotation: true, respectGrain: true }), true);
});
