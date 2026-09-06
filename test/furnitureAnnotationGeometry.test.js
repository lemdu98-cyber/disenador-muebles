import test from "node:test";
import assert from "node:assert/strict";
import { deriveFurnitureLayoutFromAnnotations, deriveSectionRatios } from "../src/utils/furnitureAnnotationGeometry.js";
import { annotationsToFurnitureProposal } from "../src/utils/furnitureImageAnnotations.js";
import { proposalToNormalizedConfig } from "../src/utils/imageFurnitureProposal.js";

const dimensions = { widthCm: 250, heightCm: 230, depthCm: 60 };
const section = (id, x, width, y = .05, height = .9) => ({ id, type: "section", x, y, width, height });
const element = (id, type, x, y, width, height) => ({ id, type, x, y, width, height });

test("deriva ratios 30/40/30 y medidas visuales 75/100/75 cm", () => {
  const result = deriveSectionRatios({ annotations: [section("a", 0, .3), section("b", .3, .4), section("c", .7, .3)], dimensions });
  assert.equal(result.canNormalize, true);
  assert.deepEqual(result.sectionLayout.map(({ widthRatio }) => widthRatio), [.3, .4, .3]);
  assert.deepEqual(result.sectionLayout.map(({ approxWidthCm }) => approxWidthCm), [75, 100, 75]);
  assert.equal(result.sectionLayout.reduce((sum, item) => sum + item.widthRatio, 0), 1);
});

test("tolera y normaliza huecos pequeños", () => {
  const result = deriveSectionRatios({ annotations: [section("a", .01, .29), section("b", .31, .39), section("c", .71, .28)], dimensions });
  assert.equal(result.canNormalize, true);
  assert.equal(result.warnings.length, 0);
  assert.ok(Math.abs(result.sectionLayout.reduce((sum, item) => sum + item.widthRatio, 0) - 1) < 1e-6);
});

test("un hueco grande produce warning y conserva ratios visuales", () => {
  const result = deriveSectionRatios({ annotations: [section("a", 0, .3), section("b", .42, .28), section("c", .7, .3)], dimensions });
  assert.equal(result.canNormalize, false);
  assert.match(result.warnings.join(" "), /hueco grande/);
  assert.equal(result.sectionLayout[0].visualWidthRatio, result.sectionLayout[0].widthRatio);
});

test("tolera solapamiento pequeño y advierte uno considerable", () => {
  const small = deriveSectionRatios({ annotations: [section("a", 0, .31), section("b", .3, .41), section("c", .7, .3)], dimensions });
  assert.equal(small.canNormalize, true);
  const large = deriveSectionRatios({ annotations: [section("a", 0, .4), section("b", .25, .5), section("c", .6, .4)], dimensions });
  assert.equal(large.canNormalize, false);
  assert.match(large.warnings.join(" "), /superponen/);
  assert.equal(large.quality, "invalid");
});

test("ordena secciones de izquierda a derecha independientemente del array", () => {
  const result = deriveSectionRatios({ annotations: [section("right", .7, .3), section("left", 0, .3), section("middle", .3, .4)], dimensions });
  assert.deepEqual(result.sectionLayout.map(({ annotationId }) => annotationId), ["left", "middle", "right"]);
});

test("asigna elementos por centro y los ordena de arriba hacia abajo", () => {
  const annotations = [section("left", 0, .5), section("right", .5, .5), element("lower", "drawer", .1, .6, .25, .15), element("upper", "drawer", .1, .2, .25, .15), element("shelf", "shelf", .6, .4, .3, .03)];
  const result = deriveFurnitureLayoutFromAnnotations({ annotations, dimensions });
  assert.deepEqual(result.elementAssignments.map(({ annotationId, sectionIndex, assignment }) => [annotationId, sectionIndex, assignment]), [["upper", 0, "assigned"], ["lower", 0, "assigned"], ["shelf", 1, "assigned"]]);
});

test("marca como ambiguo un elemento que cruza límites", () => {
  const result = deriveFurnitureLayoutFromAnnotations({ annotations: [section("left", 0, .5), section("right", .5, .5), element("door", "door", .35, .1, .3, .8)], dimensions });
  assert.equal(result.elementAssignments[0].assignment, "ambiguous");
  assert.equal(result.elementAssignments[0].sectionIndex, null);
  assert.match(result.warnings.join(" "), /ambiguo/);
});

test("sin secciones mantiene layout vertical y la propuesta sigue convirtiéndose", () => {
  const annotations = [element("one", "drawer", .1, .2, .8, .25), element("two", "drawer", .1, .5, .8, .25)];
  const proposal = annotationsToFurnitureProposal({ detectedType: "nightstand", dimensions: { widthCm: 53, heightCm: 55, depthCm: 40 }, annotations });
  assert.equal(proposal.structure.sectionLayout, undefined);
  assert.equal(proposal.structure.elementLayout.length, 2);
  assert.equal(proposal.structure.drawers, 2);
  assert.equal(proposalToNormalizedConfig(proposal).quantities.drawers, 2);
});

test("ignora rectángulos externos inválidos antes del análisis", () => {
  const result = deriveFurnitureLayoutFromAnnotations({ annotations: [section("valid", 0, 1), { id: "nan", type: "drawer", x: Number.NaN, y: 0, width: .2, height: .2 }], dimensions });
  assert.equal(result.sectionLayout.length, 1);
  assert.equal(result.elementAssignments.length, 0);
});

test("el ropero incorpora sectionLayout sin convertirlo en piezas", () => {
  const annotations = [section("a", 0, .3), section("b", .3, .4), section("c", .7, .3), ...Array.from({ length: 3 }, (_, i) => element(`door-${i}`, "door", i === 0 ? .02 : i === 1 ? .32 : .72, .08, i === 1 ? .36 : .26, .75)), ...Array.from({ length: 6 }, (_, i) => element(`drawer-${i}`, "drawer", i < 3 ? .05 : .75, .55 + (i % 3) * .1, .2, .08)), ...Array.from({ length: 3 }, (_, i) => element(`shelf-${i}`, "shelf", .35, .35 + i * .08, .3, .02))];
  const proposal = annotationsToFurnitureProposal({ detectedType: "wardrobe", dimensions, annotations });
  assert.deepEqual(proposal.structure.sectionLayout.map(({ approxWidthCm }) => approxWidthCm), [75, 100, 75]);
  const normalized = proposalToNormalizedConfig(proposal);
  assert.equal(normalized.furnitureType, "wardrobe");
  assert.equal(normalized.furniture.sectionLayout, undefined);
  assert.deepEqual(normalized.furniture.wardrobeConfig.sectionWidthRatios, [.3, .4, .3]);
});
