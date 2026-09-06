import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { isManufacturableCutDimension } from "../src/utils/manufacturingGrid.js";
import { optimizeAllMaterials } from "../src/utils/materialOptimizer.js";
import { calculateMaterialCosts } from "../src/utils/materialCostCalculator.js";
import { getOrderPieces } from "../src/utils/orderUtils.js";
import { deserializeDesignConfig, serializeDesignConfig } from "../src/utils/designPersistence.js";
import { annotationsToFurnitureProposal } from "../src/utils/furnitureImageAnnotations.js";
import { proposalToNormalizedConfig } from "../src/utils/imageFurnitureProposal.js";

const materials = createMaterialConfig();
const design = { furnitureType: "catHouse", widthCm: 40, heightCm: 40, depthCm: 40, drawers: 0, shelves: 0, doors: 0, materialConfigs: materials };
const pieces = (edgeBanding = {}) => getCutPieces({ ...design, edgeBanding });

test("Casa de Gatos contiene exactamente cuatro paneles de melamina y una trasera", () => {
  const result = pieces();
  assert.equal(result.length, 5);
  assert.deepEqual(result.filter(({ material }) => material.id === "melamine").map(({ name }) => name), ["Lateral izquierdo", "Lateral derecho", "Base inferior", "Tapa superior"]);
  assert.deepEqual(result.filter(({ material }) => material.id === "hardboard").map(({ name, length, width }) => [name, length, width]), [["Trasera de cartón prensado", 40, 40]]);
  assert.ok(result.every(({ name }) => !/frente|puerta|entrada|marco/i.test(name)));
});

test("los cinco paneles son rectangulares, manufacturables y sin veta obligatoria", () => {
  const result = pieces();
  assert.deepEqual(result.map(({ name, length, width }) => [name, length, width]), [
    ["Lateral izquierdo", 37, 40], ["Lateral derecho", 37, 40],
    ["Base inferior", 40, 40], ["Tapa superior", 40, 40], ["Trasera de cartón prensado", 40, 40],
  ]);
  assert.ok(result.every(({ length, width }) => isManufacturableCutDimension(length) && isManufacturableCutDimension(width)));
  assert.ok(result.every(({ grainRequired }) => grainRequired === false));
});

test("el canteado manual conserva los IDs de los cuatro paneles existentes", () => {
  const id = "melamine-Tapa superior-1";
  const result = pieces({ [id]: { top: true, right: false, bottom: false, left: false } });
  assert.equal(result.find((piece) => piece.id === id).edgeBanding.top, true);
});

test("persistencia nueva elimina entradas obsoletas y legacy las ignora", () => {
  const state = { ...design, catHouseConfig: { entryType: "circular", entryDiameterCm: 22, entryShape: "arc", color: "#fff" }, edgeBanding: {} };
  const saved = serializeDesignConfig(state);
  assert.deepEqual(saved.furniture.catHouseConfig, {});
  const legacy = deserializeDesignConfig("catHouse", { dimensions: design, quantities: {}, furniture: { catHouseConfig: { entryType: "square", entryWidthCm: 20, entryHeightCm: 25, entryPosition: { x: .5, y: .5 } } }, materials: {} });
  assert.deepEqual(legacy.furniture.catHouseConfig, {});
});

test("la propuesta híbrida de Casa de Gatos transporta solo tipo y dimensiones", () => {
  const proposal = annotationsToFurnitureProposal({ detectedType: "catHouse", dimensions: { widthCm: 40, heightCm: 40, depthCm: 40 }, annotations: [] });
  const normalized = proposalToNormalizedConfig(proposal);
  assert.equal(normalized.furnitureType, "catHouse");
  assert.deepEqual(normalized.dimensions, { widthCm: 40, heightCm: 40, depthCm: 40 });
  assert.deepEqual(normalized.quantities, {});
  assert.deepEqual(normalized.furniture, {});
});

test("optimizador, costos y Producción consumen únicamente las cinco piezas", () => {
  const result = pieces();
  const optimized = optimizeAllMaterials(result, materials);
  assert.equal(optimized.melamine.unplaced.length + optimized.hardboard.unplaced.length, 0);
  const melamineCosts = calculateMaterialCosts({ ...optimized.melamine, config: materials.melamine });
  assert.equal(melamineCosts.usedArea, result.filter(({ material }) => material.id === "melamine").reduce((sum, piece) => sum + piece.areaCm2, 0));
  const order = getOrderPieces([{ furnitureType: "catHouse", label: "Casa de Gatos", quantity: 1, params: design }], materials);
  assert.equal(order.length, 5);
  assert.deepEqual(order.map(({ name }) => name), result.map(({ name }) => name));
});
