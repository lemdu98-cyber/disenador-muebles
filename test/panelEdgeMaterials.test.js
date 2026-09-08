import test from "node:test";
import assert from "node:assert/strict";
import { BOX_FACE_ORDER, getMelamineFaceColors, getPanelEdgeFaceMap, RAW_MELAMINE_EDGE_COLOR } from "../src/utils/panelEdgeMaterials.js";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { optimizeAllMaterials } from "../src/utils/materialOptimizer.js";

const finish = "#8b5a2b";
const colors = (orientation, edgeBanding) => getMelamineFaceColors({ color: finish, edgeBanding, orientation });

test("sin canteado las cuatro caras de espesor quedan crudas", () => {
  for (const orientation of ["horizontal", "front", "side"]) {
    const result = colors(orientation, {});
    const mapped = Object.values(getPanelEdgeFaceMap(orientation));
    assert.equal(mapped.filter((face) => result[face] === RAW_MELAMINE_EDGE_COLOR).length, 4);
    assert.equal(result.filter((color) => color === finish).length, 2);
  }
});

test("cuatro cantos aplicados usan acabado de melamina en las seis caras", () => {
  for (const orientation of ["horizontal", "front", "side"]) assert.deepEqual(colors(orientation, { top: true, right: true, bottom: true, left: true }), Array(6).fill(finish));
});

test("top modifica solamente su cara física", () => {
  const raw = colors("front", {});
  const top = colors("front", { top: true });
  assert.deepEqual(top.map((color, index) => color === raw[index]), [true, true, false, true, true, true]);
  assert.equal(top[getPanelEdgeFaceMap("front").top], finish);
});

test("top y right no afectan bottom ni left", () => {
  for (const orientation of ["horizontal", "front", "side"]) {
    const result = colors(orientation, { top: true, right: true });
    const map = getPanelEdgeFaceMap(orientation);
    assert.equal(result[map.top], finish);
    assert.equal(result[map.right], finish);
    assert.equal(result[map.bottom], RAW_MELAMINE_EDGE_COLOR);
    assert.equal(result[map.left], RAW_MELAMINE_EDGE_COLOR);
  }
});

test("el mapping cubre horizontal, frontal y lateral sin compartir índices universales", () => {
  assert.deepEqual(BOX_FACE_ORDER, ["right", "left", "top", "bottom", "front", "back"]);
  assert.deepEqual(getPanelEdgeFaceMap("horizontal"), { top: 5, right: 0, bottom: 4, left: 1 });
  assert.deepEqual(getPanelEdgeFaceMap("front"), { top: 2, right: 0, bottom: 3, left: 1 });
  assert.deepEqual(getPanelEdgeFaceMap("side"), { top: 5, right: 2, bottom: 4, left: 3 });
  assert.throws(() => getPanelEdgeFaceMap("unknown"), /desconocida/);
});

test("cambiar edgeBanding produce inmediatamente otra asignación de caras", () => {
  const before = colors("front", { top: true, left: true, right: true, bottom: false });
  const after = colors("front", { top: true, left: true, right: true, bottom: true });
  assert.equal(before[getPanelEdgeFaceMap("front").bottom], RAW_MELAMINE_EDGE_COLOR);
  assert.equal(after[getPanelEdgeFaceMap("front").bottom], finish);
  assert.equal(before.filter((color, index) => color !== after[index]).length, 1);
});

test("la visualización no modifica cortes, metros ni optimización y excluye hardboard", () => {
  const materialConfigs = createMaterialConfig();
  const base = { furnitureType: "nightstand", widthCm: 50, heightCm: 55, depthCm: 40, drawers: 2, shelves: 0, materialConfigs, drawerFrontConfig: { type: "overlay", gapMm: 2 } };
  const plain = getCutPieces(base);
  const banded = getCutPieces({ ...base, edgeBanding: { "melamine-Frente de cajón-1": { top: true, left: true, right: true, bottom: false } } });
  assert.deepEqual(banded.map(({ id, length, width, material }) => [id, length, width, material.id]), plain.map(({ id, length, width, material }) => [id, length, width, material.id]));
  assert.ok(banded.filter(({ material }) => material.id === "hardboard").every(({ edgeBanding }) => edgeBanding === undefined));
  const before = optimizeAllMaterials(plain, materialConfigs), after = optimizeAllMaterials(banded, materialConfigs);
  assert.deepEqual(Object.fromEntries(Object.entries(before).map(([id, value]) => [id, [value.boards.length, value.unplaced.length]])), Object.fromEntries(Object.entries(after).map(([id, value]) => [id, [value.boards.length, value.unplaced.length]])));
});
