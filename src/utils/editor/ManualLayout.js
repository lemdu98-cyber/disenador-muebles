import { piecesCollide } from "./CollisionDetector.js";
import { canRotatePiece } from "../optimizer/grainEngine.js";
import { rebuildBoardGeometry } from "./BoardValidator.js";

const EPSILON = .001;
export const cloneManualLayout = (layout) => structuredClone(layout);
export const pushLayoutHistory = (history, next) => ({ past: [...history.past, cloneManualLayout(history.present)], present: cloneManualLayout(next), future: [] });
export const undoLayoutHistory = (history) => history.past.length ? ({ past: history.past.slice(0, -1), present: cloneManualLayout(history.past.at(-1)), future: [cloneManualLayout(history.present), ...history.future] }) : history;
export const redoLayoutHistory = (history) => history.future.length ? ({ past: [...history.past, cloneManualLayout(history.present)], present: cloneManualLayout(history.future[0]), future: history.future.slice(1) }) : history;

export function validateManualLayout({ boards = [], unplaced = [], optimizerSettings }) {
  const issuesByPiece = {};
  const collisions = new Set(), outOfBounds = new Set(), grainViolations = new Set(), invalidPieces = new Set();
  const mark = (piece, issue, collection) => {
    collection.add(piece.id);
    (issuesByPiece[piece.id] ||= []).push(issue);
  };
  boards.forEach((board) => {
    const margins = board.marginsCm || optimizerSettings.marginsCm;
    const kerfCm = Math.max(0, board.kerfMm ?? optimizerSettings.kerfMm) / 10;
    board.pieces.forEach((piece, index) => {
      const finite = [piece.x, piece.y, piece.length, piece.width].every(Number.isFinite);
      if (!finite || piece.length <= 0 || piece.width <= 0) mark(piece, "Pieza inválida", invalidPieces);
      const inside = finite && piece.x >= margins.left - EPSILON && piece.y >= margins.top - EPSILON && piece.x + piece.length <= board.lengthCm - margins.right + EPSILON && piece.y + piece.width <= board.widthCm - margins.bottom + EPSILON;
      if (!inside) mark(piece, "Fuera de placa", outOfBounds);
      if (piece.rotated && !canRotatePiece(piece, optimizerSettings)) mark(piece, "Veta incorrecta", grainViolations);
      board.pieces.slice(index + 1).forEach((other) => {
        if (!piecesCollide(piece, other, kerfCm)) return;
        mark(piece, "Colisión", collisions);
        mark(other, "Colisión", collisions);
      });
    });
  });
  unplaced.forEach((piece) => { (issuesByPiece[piece.id] ||= []).push("Sin colocar"); });
  const counts = { collisions: collisions.size, outOfBounds: outOfBounds.size, unplaced: unplaced.length, grainViolations: grainViolations.size, invalidPieces: invalidPieces.size };
  return { isValid: Object.values(counts).every((count) => count === 0), counts, issuesByPiece };
}

export function movePieceBetweenBoards(layout, pieceId, fromBoardIndex, toBoardIndex, position) {
  const next = cloneManualLayout(layout);
  const source = next.boards[fromBoardIndex], target = next.boards[toBoardIndex];
  const pieceIndex = source?.pieces.findIndex((piece) => piece.id === pieceId) ?? -1;
  if (pieceIndex < 0 || !target || source.pieces[pieceIndex].locked && !source.pieces[pieceIndex].incremental) return layout;
  const [piece] = source.pieces.splice(pieceIndex, 1);
  target.pieces.push({ ...piece, x: position?.x ?? target.marginsCm.left, y: position?.y ?? target.marginsCm.top });
  next.boards = next.boards.map(rebuildBoardGeometry);
  return next;
}

export function sendPieceToUnplaced(layout, pieceId, boardIndex) {
  const next = cloneManualLayout(layout), board = next.boards[boardIndex];
  const index = board?.pieces.findIndex((piece) => piece.id === pieceId) ?? -1;
  if (index < 0 || board.pieces[index].locked && !board.pieces[index].incremental) return layout;
  const [piece] = board.pieces.splice(index, 1);
  next.unplaced.push(piece);
  next.boards[boardIndex] = rebuildBoardGeometry(board);
  return next;
}

export function placeUnplacedPiece(layout, pieceId, boardIndex) {
  const next = cloneManualLayout(layout), index = next.unplaced.findIndex((piece) => piece.id === pieceId), board = next.boards[boardIndex];
  if (index < 0 || !board) return layout;
  const [piece] = next.unplaced.splice(index, 1);
  board.pieces.push({ ...piece, x: board.marginsCm.left, y: board.marginsCm.top });
  next.boards[boardIndex] = rebuildBoardGeometry(board);
  return next;
}

export function removeEmptyBoard(layout, boardIndex) {
  const board = layout.boards[boardIndex];
  if (!board || board.pieces.length || board.status && board.status !== "draft") return layout;
  const next = cloneManualLayout(layout);
  next.boards.splice(boardIndex, 1);
  return next;
}

export function addTemporaryBoard(layout, config, optimizerSettings) {
  const next = cloneManualLayout(layout), number = next.boards.reduce((max, board) => Math.max(max, board.number || 0), 0) + 1;
  const margins = optimizerSettings.marginsCm;
  next.boards.push(rebuildBoardGeometry({ number, label: `${config.boardLabel || "Placa"} #${number}`, source: "new", status: "draft", materialId: config.id, lengthCm: config.lengthCm, widthCm: config.widthCm, usableArea: Math.max(0, config.lengthCm - margins.left - margins.right) * Math.max(0, config.widthCm - margins.top - margins.bottom), marginsCm: { ...margins }, kerfMm: optimizerSettings.kerfMm, pieces: [], freeRects: [] }));
  return next;
}
