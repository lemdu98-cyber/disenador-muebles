import test from "node:test";
import assert from "node:assert/strict";
import { MAX_IMAGE_SIZE_BYTES, validateFurnitureImage, validateFurnitureImageContent } from "../src/services/furnitureImageAnalysis.js";
import { proposalToNormalizedConfig, updateProposal, validateFurnitureProposal } from "../src/utils/imageFurnitureProposal.js";

const proposal = (detectedType, structure = {}) => ({
  detectedType, confidence: 0.91,
  dimensions: { widthCm: 53, heightCm: 55, depthCm: 40 },
  structure, notes: [], warnings: [],
});

test("comprueba la firma binaria y no confía solo en el MIME", async () => {
  const fakeFile = (type, bytes) => ({ type, slice: () => ({ arrayBuffer: async () => Uint8Array.from(bytes).buffer }) });
  assert.equal(await validateFurnitureImageContent(fakeFile("image/jpeg", [0xff, 0xd8, 0xff, 0x00])), "");
  assert.match(await validateFurnitureImageContent(fakeFile("image/jpeg", [0x47, 0x49, 0x46, 0x38])), /contenido/);
});

test("valida MIME real declarado y límite de 10 MB", () => {
  assert.equal(validateFurnitureImage({ type: "image/jpeg", size: MAX_IMAGE_SIZE_BYTES }), "");
  assert.match(validateFurnitureImage({ type: "image/gif", size: 20 }), /JPG, PNG o WEBP/);
  assert.match(validateFurnitureImage({ type: "image/png", size: MAX_IMAGE_SIZE_BYTES + 1 }), /10 MB/);
  assert.match(validateFurnitureImage(null), /Selecciona/);
});

test("unknown no puede convertirse", () => {
  const draft = proposal("unknown");
  assert.match(validateFurnitureProposal(draft)[0], /reconocer/);
  assert.throws(() => proposalToNormalizedConfig(draft), /reconocer/);
});

for (const [type, structure, quantities] of [
  ["nightstand", { drawers: 2 }, { drawers: 2 }],
  ["desk", { drawers: 3 }, { drawers: 3 }],
  ["tvStand", {}, {}],
  ["catHouse", {}, {}],
  ["wardrobe", { sections: 3, doors: 3, drawers: 6, shelves: 3 }, { drawers: 6, doors: 3, shelves: 3 }],
]) test(`convierte ${type} a configuración normalizada con defaults constructivos`, () => {
  const result = proposalToNormalizedConfig(proposal(type, structure));
  assert.equal(result.furnitureType, type);
  assert.deepEqual(result.dimensions, { widthCm: 53, heightCm: 55, depthCm: 40 });
  assert.deepEqual(result.quantities, quantities);
  assert.deepEqual(result.furniture, {});
  assert.equal(result.useConstructiveDefaults, true);
});

test("la edición del borrador no muta la propuesta ni el diseño previo", () => {
  const original = proposal("nightstand", { drawers: 2 });
  const previousDesign = { furnitureType: "desk", widthCm: 140 };
  const edited = updateProposal(original, "dimensions", "widthCm", 60);
  assert.equal(original.dimensions.widthCm, 53);
  assert.equal(edited.dimensions.widthCm, 60);
  assert.deepEqual(previousDesign, { furnitureType: "desk", widthCm: 140 });
});

test("aplica límites existentes de cajones y estructura fija del ropero", () => {
  assert.match(validateFurnitureProposal(proposal("nightstand", { drawers: 99 }))[0], /cajones/);
  assert.match(validateFurnitureProposal(proposal("wardrobe", { sections: 2, drawers: 4, shelves: 9 }))[0], /3 cuerpos/);
});
