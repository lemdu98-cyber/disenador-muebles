import { MELAMINE_BOARD } from "./cutPieces";

export function calculateOrderCosts({ pieces, boards, recoverable, waste }) {
  const boardArea = MELAMINE_BOARD.lengthCm * MELAMINE_BOARD.widthCm;
  const newBoards = boards.filter((board) => board.source === "new");
  const purchasedArea = newBoards.length * boardArea;
  const materialArea = boards.filter((board) => board.pieces.length).reduce((sum, board) => sum + (board.lengthCm || MELAMINE_BOARD.lengthCm) * (board.widthCm || MELAMINE_BOARD.widthCm), 0);
  const usedArea = pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const recoverableArea = recoverable.reduce((sum, scrap) => sum + scrap.areaCm2, 0);
  const wasteArea = waste.reduce((sum, scrap) => sum + scrap.areaCm2, 0);
  const cost = newBoards.length * MELAMINE_BOARD.price;
  const valuePerCm2 = MELAMINE_BOARD.price / boardArea;
  return { boardArea, newBoardCount: newBoards.length, purchasedArea, materialArea, usedArea, recoverableArea, wasteArea, cost,
    usedValue: usedArea * valuePerCm2, recoverableValue: recoverableArea * valuePerCm2, wasteCost: wasteArea * valuePerCm2,
    percent: (area) => materialArea ? area / materialArea * 100 : 0 };
}
