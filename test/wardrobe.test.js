import test from "node:test";
import assert from "node:assert/strict";
import { getCutPieces } from "../src/utils/cutPieces.js";
import { createMaterialConfig } from "../src/utils/materialConfig.js";
import { validateAllFurniturePieces } from "../src/utils/manufacturingValidation.js";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "../src/utils/drawerSlides.js";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG, SHOE_BOTTOM_SHELF_CLEARANCE_CM } from "../src/utils/wardrobeStructure.js";
import { calculateLeftHingedDoorTransform, HINGED_DOOR_OPEN_ANGLE_RAD } from "../src/utils/wardrobeDoors.js";
import { calculateHingePositionsCm, getHardwareItems, hingesForDoorHeight } from "../src/utils/hardware.js";

const design = { furnitureType: "wardrobe", widthCm: 250, heightCm: 230, depthCm: 60, drawers: 6, shelves: 3, drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG, wardrobeConfig: DEFAULT_WARDROBE_CONFIG };
const structureFor = (overrides = {}) => {
  const input = { ...design, ...overrides, thicknessCm: 1.5 };
  const drawerDimensions = calculateDrawerSlideDimensions(input);
  return calculateWardrobeStructure({ ...input, drawerDimensions });
};

test("default wardrobe calculates three equal useful bodies", () => {
  const structure = structureFor();
  assert.equal(structure.valid, true);
  assert.equal(structure.sideHeightCm, 228.5);
  assert.equal(structure.openingWidthCm, 244 / 3);
  assert.equal(structure.panelCentersXCm.length, 4);
  assert.equal(structure.drawerLayouts.length, 6);
  assert.equal(structure.shoeShelfYCentersCm.length, 3);
  assert.equal(structure.shoeBottomShelfYCm - .75 - structure.lowerStructureTopCm, SHOE_BOTTOM_SHELF_CLEARANCE_CM);
  assert.ok(structure.shoeShelfYCentersCm[0] > structure.shoeBottomShelfYCm + .75);
});

test("cut list contains one top, six crossbars, modular backs and explicitly named drawers", () => {
  const materialConfigs = createMaterialConfig();
  const pieces = getCutPieces({ ...design, materialConfigs });
  const countMatching = (pattern) => pieces.filter((piece) => pattern.test(piece.name)).length;
  assert.equal(countMatching(/^Tapa superior$/), 1);
  assert.equal(countMatching(/^Tapa superior Cuerpo/), 0);
  assert.equal(countMatching(/^Base inferior Cuerpo/), 0);
  assert.equal(countMatching(/^Travesaño (frontal|trasero) inferior Cuerpo/), 6);
  assert.equal(countMatching(/^Repisa superior Cuerpo/), 3);
  assert.equal(countMatching(/^Puerta superior Cuerpo/), 3);
  assert.equal(countMatching(/^Puerta principal Cuerpo/), 3);
  assert.equal(countMatching(/^Fondo cartón prensado Cuerpo/), 3);
  assert.equal(countMatching(/^Frente Cajón/), 6);
  assert.equal(countMatching(/^Base cartón prensado Cajón/), 6);
  assert.equal(countMatching(/^Repisa zapatos/), 3);
  assert.equal(countMatching(/^Repisa inferior zapatero Cuerpo 2$/), 1);
  assert.equal(countMatching(/^Repisa intermedia [12] Cuerpo 1/), 2);
  assert.equal(validateAllFurniturePieces(pieces, materialConfigs).valid, true);
});

test("official hardboard defaults are centralized and remain independent from melamine", () => {
  const materials = createMaterialConfig();
  assert.deepEqual(
    { widthCm: materials.hardboard.widthCm, lengthCm: materials.hardboard.lengthCm, thicknessMm: materials.hardboard.thicknessMm, price: materials.hardboard.price },
    { widthCm: 172, lengthCm: 244, thicknessMm: 3, price: 59 },
  );
  assert.deepEqual(
    { widthCm: materials.melamine.widthCm, lengthCm: materials.melamine.lengthCm, thicknessMm: materials.melamine.thicknessMm, price: materials.melamine.price },
    { widthCm: 185, lengthCm: 275, thicknessMm: 15, price: 605 },
  );
});

test("hinged doors keep the normal top and exclude sliding-only pieces", () => {
  const pieces = getCutPieces({ ...design, materialConfigs: createMaterialConfig() });
  assert.equal(pieces.filter((piece) => piece.name === "Tapa superior" && piece.width === 60).length, 1);
  assert.equal(pieces.filter((piece) => piece.name.startsWith("Puerta superior Cuerpo")).length, 3);
  assert.equal(pieces.filter((piece) => piece.name.startsWith("Puerta principal Cuerpo")).length, 3);
  assert.equal(pieces.some((piece) => piece.name === "Soporte frontal inferior para riel"), false);
});

test("hinged upper and main doors are separated and side main doors leave drawers visible", () => {
  const structure = structureFor();
  assert.equal(structure.mainDoorHeightsCm.length, 3);
  assert.ok(structure.mainDoorHeightsCm[1] > structure.mainDoorHeightsCm[0]);
  assert.equal(structure.mainDoorHeightsCm[0], structure.mainDoorHeightsCm[2]);
  const upperBottom = structure.upperDoorCenterYCm - structure.upperDoorHeightCm / 2;
  const mainTop = structure.mainDoorCentersYCm[0] + structure.mainDoorHeightsCm[0] / 2;
  assert.ok(Math.abs((upperBottom - mainTop) - structure.hingedSectionGapCm) < 1e-9);
  const sideMainBottom = structure.mainDoorCentersYCm[0] - structure.mainDoorHeightsCm[0] / 2;
  assert.ok(sideMainBottom > structure.drawerShelfYCm + .75);
  const centerMainBottom = structure.mainDoorCentersYCm[1] - structure.mainDoorHeightsCm[1] / 2;
  assert.ok(Math.abs(centerMainBottom - (structure.lowerStructureTopCm + structure.doorGapCm)) < 1e-9);
  assert.ok(centerMainBottom > structure.lowerStructureTopCm);
});

test("body 2 main door height, cut list and hinges derive from the shortened geometry", () => {
  const structure = structureFor();
  const pieces = getCutPieces({ ...design, materialConfigs: createMaterialConfig() });
  const centerDoor = pieces.find((piece) => piece.name === "Puerta principal Cuerpo 2");
  assert.equal(centerDoor.length, structure.mainDoorHeightsCm[1]);

  const hardware = getHardwareItems({ ...design, wardrobeMainDoorHeightsCm: structure.mainDoorHeightsCm });
  const expectedMainHinges = structure.mainDoorHeightsCm.reduce((total, height) => total + hingesForDoorHeight(height), 0);
  assert.equal(hardware.find((item) => item.id === "main-door-hinges").units, expectedMainHinges);
  const positions = calculateHingePositionsCm(structure.mainDoorHeightsCm[1]);
  assert.equal(positions.length, hingesForDoorHeight(structure.mainDoorHeightsCm[1]));
  assert.ok(positions[0] > 0 && positions.at(-1) < structure.mainDoorHeightsCm[1]);

  const tallerCrossbar = structureFor({ wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, lowerCrossbarHeightCm: 12, doorGapCm: .25 } });
  const tallerCrossbarBottom = tallerCrossbar.mainDoorBottomEdgesCm[1];
  assert.ok(Math.abs(tallerCrossbarBottom - (tallerCrossbar.lowerStructureTopCm + .25)) < 1e-9);
  assert.ok(tallerCrossbar.mainDoorHeightsCm[1] < structure.mainDoorHeightsCm[1]);
});

test("all normal doors use a left pivot, right handle and a maximum 90 degree outward opening", () => {
  const closed = calculateLeftHingedDoorTransform({ centerX: 2, width: .8, open: false });
  assert.equal(closed.hingeX, 1.6);
  assert.equal(closed.panelCenterX, .4);
  assert.ok(closed.handleCenterX > closed.panelCenterX);
  assert.equal(closed.rotationY, 0);

  const open = calculateLeftHingedDoorTransform({ centerX: 2, width: .8, open: true });
  assert.equal(HINGED_DOOR_OPEN_ANGLE_RAD, Math.PI / 2);
  assert.equal(open.rotationY, -Math.PI / 2);
});

test("sliding doors extend only the top and add overlapped leaves plus the lower track support", () => {
  const wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, doorType: "sliding" };
  const materialConfigs = createMaterialConfig();
  const pieces = getCutPieces({ ...design, wardrobeConfig, materialConfigs });
  const top = pieces.find((piece) => piece.name === "Tapa superior extendida");
  const support = pieces.find((piece) => piece.name === "Soporte frontal inferior para riel");
  const doors = pieces.filter((piece) => piece.name.startsWith("Puerta corrediza"));
  assert.deepEqual([top.length, top.width], [250, 63]);
  assert.deepEqual([support.length, support.width], [250, 8]);
  assert.equal(doors.length, 3);
  assert.equal(pieces.some((piece) => piece.name.startsWith("Puerta superior Cuerpo")), false);
  assert.ok(doors[0].width > (250 / 3));
  assert.equal(pieces.some((piece) => piece.name === "Tapa superior"), false);
  assert.equal(validateAllFurniturePieces(pieces, materialConfigs).valid, true);
});

test("changing the sliding extension recalculates the top without deepening the carcass", () => {
  const structure = structureFor({ wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, doorType: "sliding", slidingDoorExtensionCm: 4 } });
  assert.equal(structure.topDepthCm, 64);
  assert.equal(structure.sideHeightCm, 228.5);
  assert.equal(structure.valid, true);
});

test("drawers and shoe shelves start above crossbars and intermediate shelves split three equal clearances", () => {
  const structure = structureFor();
  const lowestDrawerBottom = structure.drawerLayouts[0].centerYCm - structure.drawerFrontHeightCm / 2;
  assert.ok(lowestDrawerBottom > structure.lowerStructureTopCm);
  assert.ok(structure.shoeShelfYCentersCm[0] - .75 > structure.lowerStructureTopCm);
  const lowerTop = structure.drawerShelfYCm + .75;
  const upperBottom = structure.upperShelfYCm - .75;
  const [first, second] = structure.intermediateShelfYCentersCm;
  const clearances = [first - .75 - lowerTop, second - .75 - (first + .75), upperBottom - (second + .75)];
  assert.ok(clearances.every((gap) => Math.abs(gap - clearances[0]) < 1e-9));
});

test("every modular hardboard back is individually validated", () => {
  const materialConfigs = createMaterialConfig();
  materialConfigs.hardboard = { ...materialConfigs.hardboard, lengthCm: 200, widthCm: 100 };
  const pieces = getCutPieces({ ...design, materialConfigs });
  const validation = validateAllFurniturePieces(pieces, materialConfigs);
  assert.equal(validation.valid, false);
  assert.match(validation.error, /Fondo cartón prensado Cuerpo 1/);
});

test("invalid hanging and shoe spacing configurations are rejected", () => {
  const wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, shoeRegionHeightCm: 35, minimumShoeSpacingCm: 14 };
  const structure = structureFor({ shelves: 5, wardrobeConfig });
  assert.equal(structure.valid, false);
  assert.match(structure.error, /zapatero quedarían demasiado juntas/);
});
