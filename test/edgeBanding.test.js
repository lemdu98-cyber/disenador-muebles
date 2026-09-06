import test from "node:test";
import assert from "node:assert/strict";
import { calculateEdgeBandingLength, calculateTotalEdgeBanding, sanitizeEdgeBandingConfig, validateEdgeBanding } from "../src/utils/edgeBanding.js";
import { consolidatePieces } from "../src/utils/orderUtils.js";

const melamine = { id: "melamine", thicknessMm: 15 };
const hardboard = { id: "hardboard", thicknessMm: 3 };
const piece = (edgeBanding, extra = {}) => ({ id: "p", name: "Frente", length: 47, width: 23.5, areaCm2: 1104.5, grainRequired: false, material: melamine, edgeBanding, ...extra });

test("calcula cuatro lados, dos lados y ningún canto", () => {
  assert.equal(calculateEdgeBandingLength(piece({ top: true, right: true, bottom: true, left: true })), 1.41);
  assert.equal(calculateEdgeBandingLength(piece({ top: true, right: true })), .705);
  assert.equal(calculateEdgeBandingLength(piece({})), 0);
});

test("multiplica quantity y excluye cartón prensado", () => {
  const all = { top: true, right: true, bottom: true, left: true };
  assert.equal(calculateTotalEdgeBanding([piece(all, { quantity: 2 })]), 2.82);
  assert.equal(calculateEdgeBandingLength(piece(all, { material: hardboard })), 0);
});

test("valida valores corruptos y serializa solo configuraciones activas", () => {
  assert.deepEqual(validateEdgeBanding({ top: true, right: "yes", rogue: true }), { top: true, right: false, bottom: false, left: false });
  assert.deepEqual(sanitizeEdgeBandingConfig({ a: { top: true }, b: { left: false }, c: null }), { a: { top: true, right: false, bottom: false, left: false } });
});

test("la consolidación separa piezas con canteado diferente", () => {
  const groups = consolidatePieces([piece({ left: true }), piece({ right: true }, { id: "p2" })]);
  assert.equal(groups.length, 2);
});

test("la metadata sobrevive una colocación rotada sin mutar lados fuente", () => {
  const original = piece({ top: true });
  const placed = { ...original, length: original.width, width: original.length, rotated: true };
  assert.deepEqual(placed.edgeBanding, { top: true });
});
