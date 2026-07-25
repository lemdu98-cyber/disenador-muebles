import { MELAMINE_BOARD } from "./cutPieces";

const EPSILON = 0.001;

const canFit = (free, length, width) => length <= free.width + EPSILON && width <= free.height + EPSILON;

function placeInBoard(board, piece) {
  let best = null;
  board.freeRects.forEach((free, index) => {
    [[piece.length, piece.width, false], [piece.width, piece.length, true]].forEach(([length, width, rotated]) => {
      if (!canFit(free, length, width)) return;
      const waste = free.width * free.height - length * width;
      const shortSide = Math.min(free.width - length, free.height - width);
      if (!best || waste < best.waste - EPSILON || (Math.abs(waste - best.waste) < EPSILON && shortSide < best.shortSide)) {
        best = { index, free, length, width, rotated, waste, shortSide };
      }
    });
  });
  if (!best) return false;

  const { index, free, length, width, rotated } = best;
  board.freeRects.splice(index, 1);
  const right = { x: free.x + length, y: free.y, width: free.width - length, height: width };
  const bottom = { x: free.x, y: free.y + width, width: free.width, height: free.height - width };
  if (right.width > EPSILON && right.height > EPSILON) board.freeRects.push(right);
  if (bottom.width > EPSILON && bottom.height > EPSILON) board.freeRects.push(bottom);
  board.pieces.push({ ...piece, x: free.x, y: free.y, length, width, rotated });
  return true;
}

const newBoard = (number) => ({ number, pieces: [], freeRects: [{ x: 0, y: 0, width: MELAMINE_BOARD.lengthCm, height: MELAMINE_BOARD.widthCm }] });

/** Best-fit decreasing guillotine packing. Coordinates and dimensions are in cm. */
export function optimizeCuts(pieces) {
  const boards = [];
  const unplaced = [];
  const sorted = [...pieces].sort((a, b) => b.areaCm2 - a.areaCm2 || Math.max(b.length, b.width) - Math.max(a.length, a.width));
  sorted.forEach((piece) => {
    if (piece.length > MELAMINE_BOARD.lengthCm && piece.length > MELAMINE_BOARD.widthCm || piece.width > MELAMINE_BOARD.lengthCm && piece.width > MELAMINE_BOARD.widthCm) {
      unplaced.push(piece);
      return;
    }
    const existing = boards.find((board) => placeInBoard(board, piece));
    if (!existing) {
      const board = newBoard(boards.length + 1);
      if (placeInBoard(board, piece)) boards.push(board);
      else unplaced.push(piece);
    }
  });
  return { boards, unplaced };
}
