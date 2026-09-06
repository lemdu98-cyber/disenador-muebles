import test from "node:test";
import assert from "node:assert/strict";
import { assertSupportedDesign, deserializeDesignConfig, serializeDesignConfig } from "../src/utils/designPersistence.js";

const state = {
  furnitureType: "nightstand", widthCm: 200, heightCm: 220, depthCm: 60,
  doors: 3, drawers: 6, shelves: 4,
  drawerSlideConfig: { type: "telescopic" }, drawerFrontConfig: { gapMm: 2 },
  catHouseConfig: { entryType: "circle" }, nightstandStructureConfig: { showOpenDrawers: true, rearEnabled: true },
  deskConfig: { drawerPosition: "left" }, tvStandConfig: { showStructure: true, dividerEnabled: true },
  wardrobeConfig: { showOpenDoors: true, doorType: "sliding" },
  materialConfigs: {
    melamine: { thicknessMm: 15, price: 605, widthCm: 185, color: "brown", boardLabel: "Placa" },
    hardboard: { thicknessMm: 3, price: 59, lengthCm: 244 },
  },
  optimizerSettings: { kerfMm: 3 },
};

test("mesa de noche guarda solo sus cantidades y configuraciones constructivas", () => {
  const config = serializeDesignConfig(state);
  assert.deepEqual(config.quantities, { drawers: 6 });
  assert.deepEqual(Object.keys(config.furniture).sort(), ["drawerFrontConfig", "drawerSlideConfig", "nightstandStructureConfig"]);
  assert.equal(config.furniture.nightstandStructureConfig.showOpenDrawers, undefined);
});

for (const [furnitureType, expected, absent] of [
  ["desk", "deskConfig", "wardrobeConfig"],
  ["tvStand", "tvStandConfig", "deskConfig"],
  ["catHouse", "catHouseConfig", "tvStandConfig"],
  ["wardrobe", "wardrobeConfig", "nightstandStructureConfig"],
]) test(`${furnitureType} serializa únicamente su configuración específica`, () => {
  const config = serializeDesignConfig({ ...state, furnitureType });
  assert.ok(config.furniture[expected]);
  assert.equal(config.furniture[absent], undefined);
});

test("ropero conserva repisas, cajones y configuraciones compartidas", () => {
  const config = serializeDesignConfig({ ...state, furnitureType: "wardrobe" });
  assert.deepEqual(config.quantities, { drawers: 6, shelves: 4 });
  assert.ok(config.furniture.drawerSlideConfig);
  assert.ok(config.furniture.drawerFrontConfig);
  assert.deepEqual(config.furniture.wardrobeConfig.sectionWidthRatios, [1 / 3, 1 / 3, 1 / 3]);
});

test("ropero guarda/restaura ratios y los diseños antiguos reciben tercios", () => {
  const config = serializeDesignConfig({ ...state, furnitureType: "wardrobe", wardrobeConfig: { ...state.wardrobeConfig, sectionWidthRatios: [30, 40, 30] } });
  assert.deepEqual(config.furniture.wardrobeConfig.sectionWidthRatios, [.3, .4, .3]);
  const restored = deserializeDesignConfig("wardrobe", config);
  assert.deepEqual(restored.furniture.wardrobeConfig.sectionWidthRatios, [.3, .4, .3]);
  const legacy = deserializeDesignConfig("wardrobe", { dimensions: {}, quantities: {}, furniture: { wardrobeConfig: { doorType: "hinged" } }, materials: {} });
  assert.deepEqual(legacy.furniture.wardrobeConfig.sectionWidthRatios, [1 / 3, 1 / 3, 1 / 3]);
});

test("solo persiste espesores de material y omite precios, placas y optimizador", () => {
  const config = serializeDesignConfig(state);
  assert.deepEqual(config.materials, { melamineThicknessMm: 15, hardboardThicknessMm: 3 });
  assert.equal(config.optimizer, undefined);
});

test("deserializa el formato anterior e ignora configuraciones ajenas", () => {
  const oldConfig = {
    dimensions: { widthCm: 52, heightCm: 55, depthCm: 40 },
    quantities: { doors: 2, drawers: 2, shelves: 3 },
    furniture: {
      drawerSlideConfig: { lengthMm: 300 }, drawerFrontConfig: { gapMm: 3 },
      nightstandStructureConfig: { rearEnabled: false }, deskConfig: { drawerPosition: "left" },
      tvStandConfig: {}, catHouseConfig: {}, wardrobeConfig: {},
    },
    materials: {
      melamine: { thicknessMm: 18, price: 999 }, hardboard: { thicknessMm: 4, price: 88 },
    },
    optimizer: { kerfMm: 9 },
  };
  const result = deserializeDesignConfig("nightstand", oldConfig);
  assert.deepEqual(result.quantities, { drawers: 2 });
  assert.equal(result.furniture.deskConfig, undefined);
  assert.deepEqual(result.materialThicknesses, { melamine: 18, hardboard: 4 });
});

test("rechaza versiones futuras", () => {
  assert.throws(() => assertSupportedDesign({ schema_version: 2, config: {} }), /no compatible/);
});

test("persiste canteado por ID estable y los diseños antiguos usan configuración vacía", () => {
  const edgeBanding = { "melamine-Frente de cajón-1": { top: true, right: false, bottom: true, left: false } };
  const config = serializeDesignConfig({ ...state, edgeBanding });
  assert.deepEqual(deserializeDesignConfig("nightstand", config).edgeBanding, edgeBanding);
  assert.deepEqual(deserializeDesignConfig("nightstand", { dimensions: {}, quantities: {}, furniture: {}, materials: {} }).edgeBanding, {});
});

test("persiste ratios asimétricos 20/35/45 junto al canteado", () => {
  const edgeBanding = { "melamine-Frente Cajón 1 Cuerpo 1-1": { top: true, right: false, bottom: false, left: false } };
  const config = serializeDesignConfig({ ...state, furnitureType: "wardrobe", wardrobeConfig: { sectionWidthRatios: [20, 35, 45] }, edgeBanding });
  const restored = deserializeDesignConfig("wardrobe", config);
  assert.deepEqual(restored.furniture.wardrobeConfig.sectionWidthRatios, [.2, .35, .45]);
  assert.deepEqual(restored.edgeBanding, edgeBanding);
});

test("persiste lado y ratio de cajonera y migra el formato absoluto anterior", () => {
  const config = serializeDesignConfig({ ...state, furnitureType: "desk", widthCm: 140, deskConfig: { drawerModuleSide: "right", drawerModuleWidthRatio: .34 } });
  assert.equal(deserializeDesignConfig("desk", config).furniture.deskConfig.drawerModuleWidthRatio, .34);
  assert.equal(deserializeDesignConfig("desk", config).furniture.deskConfig.drawerModuleSide, "right");
  const legacy = deserializeDesignConfig("desk", { dimensions: { widthCm: 160 }, quantities: { drawers: 3 }, furniture: { deskConfig: { drawerPosition: "left", drawerModuleWidthCm: 40 } }, materials: { melamineThicknessMm: 15 } });
  assert.equal(legacy.furniture.deskConfig.drawerModuleSide, "left");
  assert.equal(legacy.furniture.deskConfig.drawerModuleWidthRatio, 37 / 155.5);
});

test("persiste 35/65 del TV Stand y diseños antiguos reciben 50/50", () => {
  const config = serializeDesignConfig({ ...state, furnitureType: "tvStand", tvStandConfig: { sectionWidthRatios: [35, 65] } });
  assert.deepEqual(deserializeDesignConfig("tvStand", config).furniture.tvStandConfig.sectionWidthRatios, [.35, .65]);
  const legacy = deserializeDesignConfig("tvStand", { dimensions: {}, quantities: {}, furniture: { tvStandConfig: { dividerEnabled: true } }, materials: {} });
  assert.deepEqual(legacy.furniture.tvStandConfig.sectionWidthRatios, [.5, .5]);
});

test("persiste 40/60 de Mesa de Noche y legacy usa ratios iguales según cajones", () => {
  const saved = serializeDesignConfig({ ...state, furnitureType: "nightstand", drawers: 2, nightstandStructureConfig: { drawerHeightRatios: [.4, .6] } });
  assert.deepEqual(deserializeDesignConfig("nightstand", saved).furniture.nightstandStructureConfig.drawerHeightRatios, [.4, .6]);
  const legacyTwo = deserializeDesignConfig("nightstand", { dimensions: { widthCm: 50, heightCm: 55, depthCm: 40 }, quantities: { drawers: 2 }, furniture: {} });
  const legacyThree = deserializeDesignConfig("nightstand", { dimensions: { widthCm: 50, heightCm: 55, depthCm: 40 }, quantities: { drawers: 3 }, furniture: {} });
  assert.deepEqual(legacyTwo.furniture.nightstandStructureConfig.drawerHeightRatios, [.5, .5]);
  assert.deepEqual(legacyThree.furniture.nightstandStructureConfig.drawerHeightRatios, [1 / 3, 1 / 3, 1 / 3]);
});
