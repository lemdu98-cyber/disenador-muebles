import test from "node:test";
import assert from "node:assert/strict";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG, getTvStandSectionGeometry, normalizeTvStandSectionWidthRatios } from "../src/utils/tvStandStructure.js";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { isManufacturableCutDimension } from "../src/utils/manufacturingGrid.js";
import { optimizeAllMaterials } from "../src/utils/materialOptimizer.js";
import { annotationsToFurnitureProposal } from "../src/utils/furnitureImageAnnotations.js";
import { proposalToNormalizedConfig } from "../src/utils/imageFurnitureProposal.js";

const materials = createMaterialConfig();
const base = { furnitureType: "tvStand", widthCm: 180, heightCm: 55, depthCm: 45, drawers: 0, shelves: 0 };
const section = (id, x, width) => ({ id, type: "section", x, y: .05, width, height: .9 });
function result(ratios, edgeBanding = {}) {
  const tvStandConfig = { ...DEFAULT_TV_STAND_CONFIG, sectionWidthRatios: ratios };
  const structure = calculateTvStandStructure({ ...base, thicknessCm: 1.5, tvStandConfig });
  const pieces = getCutPieces({ ...base, tvStandConfig, materialConfigs: materials, edgeBanding });
  return { structure, pieces };
}

test("normaliza dos proporciones y rechaza contratos inválidos", () => {
  for (const input of [[35, 65], [.35, .65], [7, 13]]) assert.deepEqual(normalizeTvStandSectionWidthRatios(input).ratios, [.35, .65]);
  for (const input of [[1], [1, 1, 1], [0, 1], [-1, 2], [Number.NaN, 1]]) assert.equal(normalizeTvStandSectionWidthRatios(input).valid, false);
});

test("default conserva dos mitades y cierra el ancho manufacturable", () => {
  const geometry = getTvStandSectionGeometry({ widthCm: 180, thicknessCm: 1.5, sectionWidthRatios: [.5, .5] });
  assert.equal(geometry.innerOpeningWidthCm, 175.5);
  assert.deepEqual(geometry.sectionWidthsCm, [88, 87.5]);
  assert.equal(geometry.sectionWidthsCm.reduce((sum, value) => sum + value, 0), 175.5);
  assert.ok(Math.abs(geometry.dividerCenterXCm) <= .25);
});

test("35/65 gobierna divisor, repisas, soportes y conserva piezas continuas", () => {
  const { structure, pieces } = result([35, 65]);
  const named = (name) => pieces.find((piece) => piece.name === name);
  assert.deepEqual(structure.sectionWidthsCm, [61.5, 114]);
  assert.equal(structure.dividerCenterXCm, -26.25);
  assert.deepEqual([named("Repisa izquierda").length, named("Repisa derecha").length], [61.5, 114]);
  assert.equal(structure.supportCentersXCm.length, 2);
  assert.deepEqual([named("Travesaño trasero superior").length, named("Travesaño trasero inferior").length], [177, 177]);
  assert.deepEqual([named("Fondo trasero completo").length, named("Fondo trasero completo").width], [180, 55]);
});

test("25/75 y 60/40 aceptan ambos sentidos; 5/95 se bloquea", () => {
  assert.deepEqual(result([25, 75]).structure.sectionWidthsCm, [44, 131.5]);
  assert.deepEqual(result([60, 40]).structure.sectionWidthsCm, [105.5, 70]);
  assert.equal(result([5, 95]).structure.valid, false);
  assert.match(result([5, 95]).structure.error, /35 cm/);
});

test("anotaciones invertidas 35/65 se ordenan y layouts malos no aplican", () => {
  const dimensions = { widthCm: 180, heightCm: 55, depthCm: 45 };
  const valid = annotationsToFurnitureProposal({ detectedType: "tvStand", dimensions, annotations: [section("right", .35, .65), section("left", 0, .35)] });
  assert.deepEqual(valid.structure.sectionLayout.map(({ annotationId }) => annotationId), ["left", "right"]);
  assert.deepEqual(proposalToNormalizedConfig(valid).furniture.tvStandConfig.sectionWidthRatios, [.35, .65]);
  for (const annotations of [[section("a", 0, .3), section("b", .45, .55)], [section("a", 0, .6), section("b", .4, .6)]]) {
    assert.throws(() => proposalToNormalizedConfig(annotationsToFurnitureProposal({ detectedType: "tvStand", dimensions, annotations })), /2 secciones válidas/);
  }
});

test("grid, veta, canteado y optimizador sobreviven los ratios", () => {
  const id = "melamine-Tapa superior-1";
  for (const ratios of [[35, 65], [25, 75], [60, 40]]) {
    const { pieces } = result(ratios, { [id]: { top: true } });
    assert.ok(pieces.every(({ length, width }) => isManufacturableCutDimension(length) && isManufacturableCutDimension(width)));
    assert.equal(pieces.find(({ id: pieceId }) => pieceId === id).edgeBanding.top, true);
    assert.ok(pieces.filter(({ name }) => ["Tapa superior", "Lateral izquierdo", "Lateral derecho"].includes(name)).every(({ grainRequired }) => grainRequired));
    const optimized = optimizeAllMaterials(pieces, materials);
    assert.equal(optimized.melamine.unplaced.length + optimized.hardboard.unplaced.length, 0);
  }
});
