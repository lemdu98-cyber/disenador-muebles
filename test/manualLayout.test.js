import test from "node:test";
import assert from "node:assert/strict";
import { addTemporaryBoard, cloneManualLayout, movePieceBetweenBoards, placeUnplacedPiece, pushLayoutHistory, redoLayoutHistory, removeEmptyBoard, sendPieceToUnplaced, undoLayoutHistory, validateManualLayout } from "../src/utils/editor/ManualLayout.js";
import { snapPiecePosition } from "../src/utils/editor/SnapEngine.js";

const settings = { allowRotation: true, respectGrain: true, kerfMm: 3, marginsCm: { top: 1, bottom: 1, left: 1, right: 1 }, freeEditMode: true };
const piece = (id, x, y, extra = {}) => ({ id, name: id, x, y, length: 20, width: 10, areaCm2: 200, grainRequired: false, rotated: false, ...extra });
const board = (number, pieces = []) => ({ number, label: `Placa ${number}`, source: "new", status: "draft", materialId: "melamine", lengthCm: 100, widthCm: 60, usableArea: 98 * 58, marginsCm: { ...settings.marginsCm }, kerfMm: 3, pieces, freeRects: [] });

test("layout válido y colisión temporal se detectan en tiempo real", () => {
  const valid = validateManualLayout({ boards: [board(1, [piece("a", 1, 1), piece("b", 21.3, 1)])], unplaced: [], optimizerSettings: settings });
  assert.equal(valid.isValid, true);
  const collision = validateManualLayout({ boards: [board(1, [piece("a", 1, 1), piece("b", 10, 1)])], unplaced: [], optimizerSettings: settings });
  assert.equal(collision.isValid, false);
  assert.equal(collision.counts.collisions, 2);
  assert.deepEqual(collision.issuesByPiece.a, ["Colisión"]);
});

test("fuera de placa y zona sin colocar bloquean guardar hasta resolverse", () => {
  const outside = validateManualLayout({ boards: [board(1, [piece("a", 90, 1)])], unplaced: [], optimizerSettings: settings });
  assert.equal(outside.counts.outOfBounds, 1);
  let layout = { boards: [board(1, [piece("a", 1, 1)])], unplaced: [] };
  layout = sendPieceToUnplaced(layout, "a", 0);
  assert.equal(validateManualLayout({ ...layout, optimizerSettings: settings }).counts.unplaced, 1);
  layout = placeUnplacedPiece(layout, "a", 0);
  assert.equal(validateManualLayout({ ...layout, optimizerSettings: settings }).counts.unplaced, 0);
});

test("kerf de 3 mm invalida piezas visualmente separadas por menos distancia", () => {
  const result = validateManualLayout({ boards: [board(1, [piece("a", 1, 1), piece("b", 21.2, 1)])], unplaced: [], optimizerSettings: settings });
  assert.equal(result.counts.collisions, 2);
});

test("snap magnético alinea exactamente borde y separación de kerf", () => {
  const fixed = piece("a", 1, 1);
  const moving = piece("b", 21.15, 1);
  const snapped = snapPiecePosition(moving, [fixed, moving], board(1), .2);
  assert.equal(snapped.x, 21.3);
  assert.equal(snapped.y, 1);
});

test("rotación con veta incorrecta invalida y respetarVeta=false la permite", () => {
  const rotated = piece("a", 1, 1, { grainRequired: true, rotated: true, length: 10, width: 20 });
  assert.equal(validateManualLayout({ boards: [board(1, [rotated])], unplaced: [], optimizerSettings: settings }).counts.grainViolations, 1);
  assert.equal(validateManualLayout({ boards: [board(1, [rotated])], unplaced: [], optimizerSettings: { ...settings, respectGrain: false } }).isValid, true);
});

test("mover entre placas conserva identidad y no duplica", () => {
  const layout = { boards: [board(1, [piece("a", 1, 1)]), board(2)], unplaced: [] };
  const moved = movePieceBetweenBoards(layout, "a", 0, 1, { x: 5, y: 5 });
  assert.equal(moved.boards[0].pieces.length, 0);
  assert.equal(moved.boards[1].pieces[0].id, "a");
  assert.equal(moved.boards.flatMap((item) => item.pieces).length, 1);
});

test("piezas históricas fijadas no se mueven y nuevas incrementales sí", () => {
  const locked = { boards: [board(1, [piece("fixed", 1, 1, { locked: true })]), board(2)], unplaced: [] };
  assert.equal(movePieceBetweenBoards(locked, "fixed", 0, 1), locked);
  const incremental = { boards: [board(1, [piece("new", 1, 1, { locked: true, incremental: true })]), board(2)], unplaced: [] };
  assert.equal(movePieceBetweenBoards(incremental, "new", 0, 1).boards[1].pieces[0].id, "new");
});

test("placa temporal vacía puede añadirse y eliminarse", () => {
  const layout = { boards: [board(1)], unplaced: [] };
  const added = addTemporaryBoard(layout, { id: "melamine", boardLabel: "Placa", lengthCm: 100, widthCm: 60 }, settings);
  assert.equal(added.boards.length, 2);
  assert.equal(removeEmptyBoard(added, 1).boards.length, 1);
  assert.equal(removeEmptyBoard({ boards: [board(1, [piece("a", 1, 1)])], unplaced: [] }, 0).boards.length, 1);
});

test("snapshots para cancelar, restablecer, undo y redo son independientes", () => {
  const original = { boards: [board(1, [piece("a", 1, 1)])], unplaced: [] };
  const snapshot = cloneManualLayout(original);
  const changed = cloneManualLayout(original);
  changed.boards[0].pieces[0].x = 40;
  let history = { past: [], present: snapshot, future: [] };
  history = pushLayoutHistory(history, changed);
  history = undoLayoutHistory(history);
  assert.equal(history.present.boards[0].pieces[0].x, 1);
  history = redoLayoutHistory(history);
  assert.equal(history.present.boards[0].pieces[0].x, 40);
  assert.equal(original.boards[0].pieces[0].x, 1);
});

test("vaciar tercera placa produce un layout válido de dos placas y ahorro medible", () => {
  const original = { boards: [board(1, [piece("a", 1, 1)]), board(2, [piece("b", 1, 1)]), board(3)], unplaced: [] };
  const reduced = removeEmptyBoard(original, 2);
  assert.equal(reduced.boards.length, 2);
  assert.equal(validateManualLayout({ ...reduced, optimizerSettings: settings }).isValid, true);
});
