import test from "node:test";
import assert from "node:assert/strict";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE, normalizeDrawerHeightRatios } from "../src/utils/nightstandStructure.js";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { isManufacturableCutDimension } from "../src/utils/manufacturingGrid.js";
import { optimizeAllMaterials } from "../src/utils/materialOptimizer.js";
import { annotationsToFurnitureProposal } from "../src/utils/furnitureImageAnnotations.js";
import { proposalToNormalizedConfig, validateFurnitureProposal } from "../src/utils/imageFurnitureProposal.js";
import { calculateDrawerOpenOffsetCm } from "../src/utils/drawerVisualization.js";

const materials = createMaterialConfig();
const base = { furnitureType: "nightstand", widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, doors: 0, shelves: 0, drawerFrontConfig: { type: "overlay", gapMm: 2 }, drawerSlideConfig: { type: "telescopic", lengthMm: 350 } };
const drawer = (id, x, y, width, height) => ({ id, type: "drawer", x, y, width, height });
function result(ratios, drawerCount = ratios.length, edgeBanding = {}) {
  const nightstandStructureConfig = { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: ratios };
  const structure = calculateNightstandStructure({ ...base, drawers: drawerCount, thicknessCm: 1.5, structureConfig: nightstandStructureConfig });
  const pieces = getCutPieces({ ...base, drawers: drawerCount, nightstandStructureConfig, materialConfigs: materials, edgeBanding });
  return { structure, pieces };
}

test("normaliza ratios verticales y exige uno por cajón", () => {
  assert.deepEqual(normalizeDrawerHeightRatios([40, 60], 2).ratios, [.4, .6]);
  assert.ok(normalizeDrawerHeightRatios([1, 1, 1], 3).ratios.every((ratio) => Math.abs(ratio - 1 / 3) < 1e-12));
  for (const ratios of [[1], [1, 1, 1], [0, 1], [-1, 2], [Number.NaN, 1]]) assert.equal(normalizeDrawerHeightRatios(ratios, 2).valid, false);
});

test("50/50 reproduce exactamente la geometría histórica", () => {
  const { structure, pieces } = result([.5, .5]);
  assert.equal(structure.distributableFrontHeightCm, 44);
  assert.deepEqual(structure.drawerFrontHeightsCm, [22, 22]);
  assert.deepEqual(structure.drawerSideHeightsCm, [20, 20]);
  assert.deepEqual(structure.drawerGeometry.drawerLayouts.map(({ frontCenterYCm }) => frontCenterYCm), [14.5, -8.8]);
  assert.deepEqual(pieces.filter(({ name }) => name === "Frente de cajón").map(({ width }) => width), [22, 22]);
});

test("40/60 distribuye frentes, cajas y centros acumulativamente", () => {
  const { structure, pieces } = result([.4, .6]);
  assert.deepEqual(structure.drawerFrontHeightsCm, [17.5, 26.5]);
  assert.deepEqual(structure.drawerBoxHeightsCm, [17.8, 26.8]);
  assert.deepEqual(structure.drawerSideHeightsCm, [16, 25]);
  assert.deepEqual(structure.drawerGeometry.drawerLayouts.map(({ frontCenterYCm }) => frontCenterYCm), [16.75, -6.55]);
  assert.deepEqual(pieces.filter(({ name }) => name === "Lateral izquierdo de cajón").map(({ width }) => width), [16, 25]);
  assert.deepEqual(pieces.filter(({ name }) => name === "Base de cartón prensado del cajón").map(({ length, width }) => [length, width]), [[44.5, 36.5], [44.5, 36.5]]);
});

test("35/65 y 60/40 funcionan en ambos sentidos y 5/95 se bloquea", () => {
  assert.deepEqual(result([.35, .65]).structure.drawerFrontHeightsCm, [15.5, 28.5]);
  assert.deepEqual(result([.6, .4]).structure.drawerFrontHeightsCm, [26.5, 17.5]);
  const extreme = result([.05, .95]).structure;
  assert.equal(extreme.valid, false);
  assert.match(extreme.error, /Cajón 1 demasiado bajo/);
});

test("tres cajones admiten 25/35/40 y conservan suma y posiciones", () => {
  const { structure } = result([.25, .35, .4], 3);
  assert.equal(structure.valid, true);
  assert.equal(structure.drawerFrontHeightsCm.reduce((sum, height) => sum + height, 0), structure.distributableFrontHeightCm);
  assert.deepEqual(structure.drawerFrontHeightsCm, [10.5, 14.5, 17]);
  const centers = structure.drawerGeometry.drawerLayouts.map(({ frontCenterYCm }) => frontCenterYCm);
  assert.ok(centers[0] > centers[1] && centers[1] > centers[2]);
});

test("mostrar cajones abiertos conserva la geometría individual y solo desplaza Z", () => {
  const closed = result([.4, .6]).structure;
  const open = calculateNightstandStructure({ ...base, thicknessCm: 1.5, structureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, drawerHeightRatios: [.4, .6], showOpenDrawers: true } });
  assert.deepEqual(open.drawerGeometry.drawerLayouts, closed.drawerGeometry.drawerLayouts);
  assert.ok(calculateDrawerOpenOffsetCm(35, open.config.showOpenDrawers) > 0);
});

test("anotaciones se ordenan arriba-abajo e infieren 40/60 con gap razonable", () => {
  const dimensions = { widthCm: 50, heightCm: 55, depthCm: 40 };
  const proposal = annotationsToFurnitureProposal({ detectedType: "nightstand", dimensions, annotations: [drawer("lower", .1, .36, .8, .3), drawer("upper", .1, .1, .8, .2)] });
  assert.deepEqual(proposal.structure.drawerLayout.annotationIds, ["upper", "lower"]);
  assert.deepEqual(proposalToNormalizedConfig(proposal).furniture.nightstandStructureConfig.drawerHeightRatios, [.4, .6]);
});

test("gap, solapamiento y desalineación excesivos bloquean la columna", () => {
  const dimensions = { widthCm: 50, heightCm: 55, depthCm: 40 };
  const cases = [
    [drawer("a", .1, .1, .8, .15), drawer("b", .1, .5, .8, .25)],
    [drawer("a", .1, .1, .8, .3), drawer("b", .1, .34, .8, .3)],
    [drawer("a", .05, .1, .35, .2), drawer("b", .6, .31, .35, .3)],
  ];
  for (const annotations of cases) {
    const proposal = annotationsToFurnitureProposal({ detectedType: "nightstand", dimensions, annotations });
    assert.equal(proposal.structure.drawerLayout.valid, false);
    assert.notDeepEqual(validateFurnitureProposal(proposal), []);
  }
});

test("grid, IDs, canteado, veta y optimizador sobreviven alturas asimétricas", () => {
  const front1 = "melamine-Frente de cajón-1", front2 = "melamine-Frente de cajón-2";
  for (const ratios of [[.4, .6], [.35, .65], [.6, .4]]) {
    const { pieces } = result(ratios, 2, { [front1]: { top: true }, [front2]: { bottom: true } });
    assert.ok(pieces.every(({ length, width }) => isManufacturableCutDimension(length) && isManufacturableCutDimension(width)));
    assert.equal(pieces.find(({ id }) => id === front1).edgeBanding.top, true);
    assert.equal(pieces.find(({ id }) => id === front2).edgeBanding.bottom, true);
    assert.ok(pieces.filter(({ name }) => name === "Frente de cajón").every(({ grainRequired }) => grainRequired));
    const optimized = optimizeAllMaterials(pieces, materials);
    assert.equal(optimized.melamine.unplaced.length + optimized.hardboard.unplaced.length, 0);
  }
});
