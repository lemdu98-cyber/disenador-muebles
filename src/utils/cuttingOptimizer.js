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

const newBoard = (number, boardConfig, source = "new", stock = null) => ({
  number,
  source,
  stockId: stock?.id || null,
  label: source === "scrap" ? `Retazo ${stock.code || stock.id}` : `${boardConfig.boardLabel || "Placa"} #${number}`,
  pieces: [],
  freeRects: [{ x: 0, y: 0, width: stock?.lengthCm || boardConfig.lengthCm, height: stock?.widthCm || boardConfig.widthCm }],
  lengthCm: stock?.lengthCm || boardConfig.lengthCm,
  widthCm: stock?.widthCm || boardConfig.widthCm,
  materialId: boardConfig.id,
});

/** Best-fit decreasing guillotine packing. Coordinates and dimensions are in cm. */
export function optimizeCuts(pieces, { scrapBank = [], boardConfig = MELAMINE_BOARD } = {}) {
  const boards = [];
  const unplaced = [];
  const scrapUsage = [];
  const sorted = [...pieces].sort((a, b) => b.areaCm2 - a.areaCm2 || Math.max(b.length, b.width) - Math.max(a.length, a.width));
  const availableScraps = scrapBank.filter((scrap) => scrap.status === "Disponible");
  availableScraps.filter((scrap) => !scrap.materialId || scrap.materialId === boardConfig.id).forEach((scrap) => boards.push(newBoard(boards.length + 1, boardConfig, "scrap", scrap)));
  sorted.forEach((piece) => {
    if (piece.length > boardConfig.lengthCm && piece.length > boardConfig.widthCm || piece.width > boardConfig.lengthCm && piece.width > boardConfig.widthCm) {
      unplaced.push(piece);
      return;
    }
    const existing = boards.find((board) => placeInBoard(board, piece));
    if (!existing) {
      const board = newBoard(boards.length + 1, boardConfig);
      if (placeInBoard(board, piece)) boards.push(board);
      else unplaced.push(piece);
    }
  });
  boards.filter((board) => board.source === "scrap" && board.pieces.length).forEach((board) => scrapUsage.push(board.stockId));
  return { boards, unplaced, scrapUsage };
}
