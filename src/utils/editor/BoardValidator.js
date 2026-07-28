import { findCollision } from "./CollisionDetector";
import { generateCutSequence } from "../optimizer/cutSequenceGenerator";

const EPSILON = .001;

export function validatePiecePlacement(piece, pieces, board) {
  const margins = board.marginsCm || { top: 0, bottom: 0, left: 0, right: 0 };
  const kerf = Math.max(0, board.kerfMm || 0) / 10;
  const inside = piece.x >= margins.left - EPSILON &&
    piece.y >= margins.top - EPSILON &&
    piece.x + piece.length <= board.lengthCm - margins.right + EPSILON &&
    piece.y + piece.width <= board.widthCm - margins.bottom + EPSILON;
  if (!inside) return { valid: false, reason: "La pieza invade los márgenes o sale de la placa." };
  const collision = findCollision(piece, pieces, kerf);
  if (collision) return { valid: false, reason: `Conflicto con ${collision.name}.` };
  return { valid: true, reason: "" };
}

function subtractRect(free, occupied) {
  const left = Math.max(free.x, occupied.x);
  const top = Math.max(free.y, occupied.y);
  const right = Math.min(free.x + free.width, occupied.x + occupied.width);
  const bottom = Math.min(free.y + free.height, occupied.y + occupied.height);
  if (left >= right || top >= bottom) return [free];
  return [
    { x: free.x, y: free.y, width: free.width, height: top - free.y },
    { x: free.x, y: bottom, width: free.width, height: free.y + free.height - bottom },
    { x: free.x, y: top, width: left - free.x, height: bottom - top },
    { x: right, y: top, width: free.x + free.width - right, height: bottom - top },
  ].filter((rect) => rect.width > EPSILON && rect.height > EPSILON);
}

export function rebuildBoardGeometry(board) {
  const margins = board.marginsCm || { top: 0, bottom: 0, left: 0, right: 0 };
  const kerf = Math.max(0, board.kerfMm || 0) / 10;
  let freeRects = [{
    x: margins.left,
    y: margins.top,
    width: Math.max(0, board.lengthCm - margins.left - margins.right),
    height: Math.max(0, board.widthCm - margins.top - margins.bottom),
  }];
  board.pieces.forEach((piece) => {
    const occupied = {
      x: Math.max(margins.left, piece.x - kerf / 2),
      y: Math.max(margins.top, piece.y - kerf / 2),
      width: piece.length + kerf,
      height: piece.width + kerf,
    };
    freeRects = freeRects.flatMap((free) => subtractRect(free, occupied));
  });
  const usedArea = board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const cuttingSequence = generateCutSequence({ ...board, freeRects });
  return { ...board, freeRects, usedArea, cuttingSequence, cutCount: cuttingSequence.length, manuallyEdited: true };
}
