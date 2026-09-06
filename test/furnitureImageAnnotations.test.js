import test from "node:test";
import assert from "node:assert/strict";
import {
  annotationsToFurnitureProposal,
  countAnnotations,
  createAnnotation,
  normalizeAnnotation,
  removeAnnotation,
  updateAnnotation,
} from "../src/utils/furnitureImageAnnotations.js";
import { validateFurnitureProposal } from "../src/utils/imageFurnitureProposal.js";

const dimensions = { widthCm: 250, heightCm: 230, depthCm: 60 };
const mark = (id, type, x = .1, y = .1, width = .2, height = .2) => ({ id, type, x, y, width, height });

test("crea una anotación válida con coordenadas normalizadas", () => {
  assert.deepEqual(createAnnotation({ id: "a", type: "drawer", startX: .4, startY: .5, endX: .1, endY: .2 }), mark("a", "drawer", .1, .2, .3, .3));
});

test("clampa coordenadas, rechaza tipos inválidos y evita dimensiones no positivas", () => {
  assert.deepEqual(normalizeAnnotation(mark("a", "door", -.2, .8, 2, .5)), mark("a", "door", 0, .8, 1, .2));
  assert.equal(normalizeAnnotation(mark("a", "hinge")), null);
  assert.equal(normalizeAnnotation(mark("a", "door", 1, 1, 0, 0)), null);
  assert.equal(createAnnotation({ id: "a", type: "shelf", startX: .1, startY: .1, endX: .101, endY: .101 }), null);
});

test("cuenta, cambia el tipo y elimina sin alterar el orden estable", () => {
  const original = [mark("a", "drawer"), mark("b", "door"), mark("c", "drawer")];
  const changed = updateAnnotation(original, "b", { type: "shelf" });
  assert.deepEqual(changed.map(({ id }) => id), ["a", "b", "c"]);
  assert.deepEqual(countAnnotations(changed), { sections: 0, drawers: 2, doors: 0, shelves: 1 });
  assert.deepEqual(removeAnnotation(changed, "a").map(({ id }) => id), ["b", "c"]);
  assert.equal(original[1].type, "door");
});

test("acepta solapamientos porque describen estructura visible", () => {
  const overlapping = [mark("section", "section", 0, 0, .5, 1), mark("door", "door", .1, .1, .3, .8)];
  assert.deepEqual(countAnnotations(overlapping), { sections: 1, drawers: 0, doors: 1, shelves: 0 });
});

test("las coordenadas son independientes de la resolución de pantalla", () => {
  const annotation = mark("a", "drawer", .1, .25, .4, .1);
  const pixels = (width, height) => ({ x: annotation.x * width, y: annotation.y * height, width: annotation.width * width, height: annotation.height * height });
  assert.deepEqual(pixels(1000, 800), { x: 100, y: 200, width: 400, height: 80 });
  assert.deepEqual(pixels(500, 400), { x: 50, y: 100, width: 200, height: 40 });
});

test("genera Mesa de Noche manual con dos cajones", () => {
  const proposal = annotationsToFurnitureProposal({ detectedType: "nightstand", dimensions: { widthCm: 53, heightCm: 55, depthCm: 40 }, annotations: [mark("a", "drawer"), mark("b", "drawer")] });
  assert.equal(proposal.provider, "manual");
  assert.equal(proposal.confidence, 1);
  assert.equal(proposal.structure.drawers, 2);
  assert.deepEqual(validateFurnitureProposal(proposal), []);
});

test("genera Ropero manual con 3 cuerpos, 6 cajones, 3 puertas y 3 repisas", () => {
  const annotations = [
    ...Array.from({ length: 3 }, (_, index) => mark(`section-${index}`, "section")),
    ...Array.from({ length: 6 }, (_, index) => mark(`drawer-${index}`, "drawer")),
    ...Array.from({ length: 3 }, (_, index) => mark(`door-${index}`, "door")),
    ...Array.from({ length: 3 }, (_, index) => mark(`shelf-${index}`, "shelf", .1, .5 + index * .01, .4, .005)),
  ];
  const proposal = annotationsToFurnitureProposal({ detectedType: "wardrobe", dimensions, annotations });
  assert.deepEqual({ sections: proposal.structure.sections, drawers: proposal.structure.drawers, doors: proposal.structure.doors, shelves: proposal.structure.shelves }, { sections: 3, drawers: 6, doors: 3, shelves: 3 });
  assert.equal(proposal.structure.sectionLayout.length, 3);
  assert.deepEqual(validateFurnitureProposal(proposal), []);
});

test("informa valores incompatibles sin descartarlos", () => {
  const nightstand = annotationsToFurnitureProposal({ detectedType: "nightstand", dimensions, annotations: [mark("a", "drawer"), mark("b", "drawer"), mark("door", "door")] });
  assert.match(validateFurnitureProposal(nightstand).join(" "), /no utiliza puertas/);
  const wardrobe = annotationsToFurnitureProposal({ detectedType: "wardrobe", dimensions, annotations: [mark("section", "section")] });
  assert.match(validateFurnitureProposal(wardrobe).join(" "), /exactamente 3 cuerpos/);
});
