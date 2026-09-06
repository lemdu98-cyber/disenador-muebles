import test from "node:test";
import assert from "node:assert/strict";
import { getEdgeBandingLabels } from "../src/utils/edgeBanding.js";
import { drawEdgeBandingLabels } from "../src/utils/boardImageExporter.js";

const melamine = { id: "melamine" };
const labels = (edgeBanding, extra = {}) => getEdgeBandingLabels({ material: melamine, edgeBanding, ...extra });

for (const [side, orientation] of [["top", "horizontal"], ["bottom", "horizontal"], ["left", "vertical"], ["right", "vertical"]]) {
  test(`CANTEO ${side} se posiciona con orientación ${orientation}`, () => {
    assert.deepEqual(labels({ [side]: true }), [{ sourceSide: side, side, orientation, text: "CANTEO" }]);
  });
}

test("admite múltiples etiquetas", () => assert.equal(labels({ top: true, right: true, bottom: true, left: true }).length, 4));
test("una rotación transforma lados visibles sin cambiar el origen", () => assert.deepEqual(labels({ top: true, left: true }, { rotated: true }), [
  { sourceSide: "top", side: "right", orientation: "vertical", text: "CANTEO" },
  { sourceSide: "left", side: "top", orientation: "horizontal", text: "CANTEO" },
]));
test("cartón prensado no produce etiquetas", () => assert.deepEqual(getEdgeBandingLabels({ material: { id: "hardboard" }, edgeBanding: { top: true } }), []));

test("el exportador consume la representación compartida y dibuja cada CANTEO", () => {
  const drawn = [];
  const context = { save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, translate() {}, rotate() {}, fillText(text) { drawn.push(text); } };
  drawEdgeBandingLabels(context, { material: melamine, edgeBanding: { top: true, right: true } }, 0, 0, 200, 100);
  assert.deepEqual(drawn, ["CANTEO", "CANTEO"]);
});
