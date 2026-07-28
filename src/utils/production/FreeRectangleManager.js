import { kerfCm, splitFreeRect } from "../optimizer/kerfCalculator";
import { getPieceOrientations } from "../optimizer/rotationEngine";

const EPSILON = 0.001;

export function findBestFreePlacement(boards, piece, settings) {
  const candidates = [];
  boards.forEach((board, boardIndex) => board.freeRects.forEach((free, freeIndex) => {
    getPieceOrientations(piece, settings).forEach((orientation) => {
      if (orientation.length > free.width + EPSILON || orientation.width > free.height + EPSILON) return;
      candidates.push({
        boardIndex, freeIndex, free, orientation,
        waste: free.width * free.height - orientation.length * orientation.width,
      });
    });
  }));
  return candidates.sort((a, b) => a.waste - b.waste || a.free.y - b.free.y || a.free.x - b.free.x)[0] || null;
}

export function insertIntoFreeRect(board, placement, piece, settings) {
  const next = { ...board, pieces: [...board.pieces], freeRects: board.freeRects.map((rect) => ({ ...rect })) };
  next.freeRects.splice(
    placement.freeIndex,
    1,
    ...splitFreeRect(placement.free, placement.orientation, kerfCm(settings)),
  );
  next.pieces.push({
    ...piece,
    x: placement.free.x,
    y: placement.free.y,
    length: placement.orientation.length,
    width: placement.orientation.width,
    rotated: placement.orientation.rotated,
    locked: true,
    incremental: true,
  });
  next.usedArea = next.pieces.reduce((sum, item) => sum + item.areaCm2, 0);
  next.utilization = next.usableArea ? next.usedArea / next.usableArea * 100 : 0;
  return next;
}
