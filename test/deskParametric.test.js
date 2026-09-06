import test from "node:test";
import assert from "node:assert/strict";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG, DEFAULT_DESK_DRAWER_MODULE_RATIO, getDeskSectionGeometry } from "../src/utils/deskStructure.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { isManufacturableCutDimension } from "../src/utils/manufacturingGrid.js";
import { optimizeAllMaterials } from "../src/utils/materialOptimizer.js";
import { annotationsToFurnitureProposal } from "../src/utils/furnitureImageAnnotations.js";
import { proposalToNormalizedConfig, validateFurnitureProposal } from "../src/utils/imageFurnitureProposal.js";

const materials = createMaterialConfig();
const base = { furnitureType: "desk", widthCm: 140, heightCm: 75, depthCm: 60, drawers: 3, shelves: 0, thicknessCm: 1.5, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG };
function result(side, ratio, edgeBanding = {}) {
  const deskConfig = { ...DEFAULT_DESK_CONFIG, drawerModuleSide: side, drawerModuleWidthRatio: ratio };
  const drawerDimensions = calculateDrawerSlideDimensions({ ...base, deskConfig });
  const structure = calculateDeskStructure({ ...base, deskConfig, drawerDimensions });
  const pieces = getCutPieces({ ...base, deskConfig, materialConfigs: materials, edgeBanding });
  return { deskConfig, drawerDimensions, structure, pieces };
}
const drawer = (id, x, y, width) => ({ id, type: "drawer", x, y, width, height: .1 });

test("el default conserva cajonera derecha de 40 cm del escritorio anterior", () => {
  const geometry = getDeskSectionGeometry({ widthCm: 140, thicknessCm: 1.5, deskConfig: DEFAULT_DESK_CONFIG });
  assert.equal(DEFAULT_DESK_DRAWER_MODULE_RATIO, 37 / 135.5);
  assert.equal(geometry.drawerModuleSide, "right");
  assert.equal(geometry.moduleWidthCm, 40);
  assert.equal(geometry.drawerOpeningWidthCm, 37);
});

test("30 % izquierda produce cortes reales y 30 % derecha los espeja", () => {
  const left = result("left", .3), right = result("right", .3);
  assert.deepEqual({ module: left.structure.moduleWidthCm, free: left.structure.legroomWidthCm, divider: left.structure.dividerCenterXCm }, { module: 43.5, free: 95, divider: -27.25 });
  assert.equal(right.structure.dividerCenterXCm, 27.25);
  assert.equal(left.structure.moduleCenterXCm, -right.structure.moduleCenterXCm);
  assert.deepEqual(left.pieces.map(({ name, length, width }) => [name, length, width]), right.pieces.map(({ name, length, width }) => [name, length, width]));
  const named = (name) => left.pieces.find((piece) => piece.name === name);
  assert.deepEqual({ front: named("Frente cajón superior").length, back: named("Parte trasera de cajón").length, bottom: named("Base de cartón prensado del cajón").length, brace: named("Refuerzo inferior módulo de cajones").length }, { front: 43.5, back: 35, bottom: 38, brace: 40.5 });
});

test("40 % agranda cajones, reduce espacio libre y sigue en grid", () => {
  const thirty = result("left", .3), forty = result("left", .4);
  assert.equal(forty.structure.moduleWidthCm, 57);
  assert.equal(forty.structure.legroomWidthCm, 81.5);
  assert.ok(forty.structure.drawerOpeningWidthCm > thirty.structure.drawerOpeningWidthCm);
  assert.ok(forty.pieces.every(({ length, width }) => isManufacturableCutDimension(length) && isManufacturableCutDimension(width)));
});

test("ratios extremos fallan por cajonera o espacio de piernas", () => {
  assert.equal(result("left", .1).structure.valid, false);
  assert.match(result("left", .1).structure.error, /al menos/);
  assert.equal(result("right", .8).structure.valid, false);
  assert.match(result("right", .8).structure.error, /silla|piernas/);
});

test("canteado, veta y optimización sobreviven lado y ratio", () => {
  const id = "melamine-Frente cajón superior-1";
  for (const [side, ratio] of [["left", .3], ["right", .35], ["left", .4]]) {
    const { pieces } = result(side, ratio, { [id]: { top: true } });
    assert.equal(pieces.find(({ id: pieceId }) => pieceId === id).edgeBanding.top, true);
    assert.ok(pieces.filter(({ name }) => ["Tapa superior", "Lateral izquierdo", "Lateral derecho"].includes(name) || name.startsWith("Frente cajón")).every(({ grainRequired }) => grainRequired));
    const optimized = optimizeAllMaterials(pieces, materials);
    assert.equal(optimized.melamine.unplaced.length + optimized.hardboard.unplaced.length, 0);
  }
});

test("anotaciones izquierda y derecha infieren módulo sin depender del orden vertical", () => {
  const make = (drawers) => annotationsToFurnitureProposal({ detectedType: "desk", dimensions: { widthCm: 140, heightCm: 75, depthCm: 60 }, annotations: drawers });
  const left = make([drawer("bottom", .05, .7, .28), drawer("top", .05, .2, .28), drawer("middle", .05, .45, .28)]);
  const right = make([drawer("middle", .68, .45, .26), drawer("bottom", .68, .7, .26), drawer("top", .68, .2, .26)]);
  assert.deepEqual(proposalToNormalizedConfig(left).furniture.deskConfig, { drawerModuleSide: "left", drawerModuleWidthRatio: .28 });
  assert.deepEqual(proposalToNormalizedConfig(right).furniture.deskConfig, { drawerModuleSide: "right", drawerModuleWidthRatio: .26 });
});

test("dos secciones invertidas refuerzan left 35 % y cajones dispersos bloquean aplicación", () => {
  const sections = [{ id: "right", type: "section", x: .35, y: .05, width: .65, height: .9 }, { id: "left", type: "section", x: 0, y: .05, width: .35, height: .9 }];
  const proposal = annotationsToFurnitureProposal({ detectedType: "desk", dimensions: { widthCm: 140, heightCm: 75, depthCm: 60 }, annotations: [...sections, drawer("a", .04, .2, .27), drawer("b", .04, .4, .27), drawer("c", .04, .6, .27)] });
  assert.deepEqual(proposalToNormalizedConfig(proposal).furniture.deskConfig, { drawerModuleSide: "left", drawerModuleWidthRatio: .35 });
  const incoherent = annotationsToFurnitureProposal({ detectedType: "desk", dimensions: proposal.dimensions, annotations: [drawer("a", .05, .2, .25), drawer("b", .7, .5, .25), drawer("c", .05, .7, .25)] });
  assert.equal(incoherent.structure.layoutQuality, "invalid");
  assert.notDeepEqual(validateFurnitureProposal(incoherent), []);
});
