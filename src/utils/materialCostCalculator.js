const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Produces a reconciled economic allocation for any sheet material.
 * Waste receives only the tiny floating-point residual needed to make totals exact.
 */
export function calculateMaterialEconomicSummary({
  boardCount,
  boardPrice,
  totalArea,
  usedArea,
  recoverableArea,
  wasteArea,
}) {
  const totalCost = boardCount * boardPrice;
  if (!totalArea || !boardCount) {
    return {
      totalCost,
      totalArea: 0,
      usedArea: 0,
      remainingArea: 0,
      recoverableArea: 0,
      wasteArea: 0,
      usedPercentage: 0,
      remainingPercentage: 0,
      recoverablePercentage: 0,
      wastePercentage: 0,
      usedValue: 0,
      remainingValue: 0,
      recoverableValue: 0,
      wasteValue: 0,
    };
  }

  const economicUsedArea = clamp(usedArea, 0, totalArea);
  const freeArea = Math.max(0, totalArea - economicUsedArea);
  const classifiedFreeArea = Math.max(0, recoverableArea) + Math.max(0, wasteArea);
  const economicRecoverableArea = classifiedFreeArea
    ? freeArea * Math.max(0, recoverableArea) / classifiedFreeArea
    : 0;
  const economicWasteArea = freeArea - economicRecoverableArea;

  const usedPercentage = economicUsedArea / totalArea * 100;
  const recoverablePercentage = economicRecoverableArea / totalArea * 100;
  const wastePercentage = 100 - usedPercentage - recoverablePercentage;
  const remainingPercentage = 100 - usedPercentage;
  const usedValue = totalCost * usedPercentage / 100;
  const recoverableValue = totalCost * recoverablePercentage / 100;
  const wasteValue = totalCost - usedValue - recoverableValue;

  return {
    totalCost,
    totalArea,
    usedArea: economicUsedArea,
    remainingArea: freeArea,
    recoverableArea: economicRecoverableArea,
    wasteArea: economicWasteArea,
    usedPercentage,
    remainingPercentage,
    recoverablePercentage,
    wastePercentage,
    usedValue,
    remainingValue: totalCost - usedValue,
    recoverableValue,
    wasteValue,
  };
}

export function calculateMaterialCosts({ pieces, boards, recoverable = [], waste = [], config }) {
  const boardArea = config.lengthCm * config.widthCm;
  const newBoards = boards.filter((board) => board.source === "new");
  const activeBoards = boards.filter((board) => board.pieces.length);
  const purchasedArea = newBoards.length * boardArea;
  const materialArea = activeBoards.reduce((sum, board) => sum + board.lengthCm * board.widthCm, 0);
  const usedArea = pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const purchasedUsedArea = newBoards.reduce(
    (sum, board) => sum + board.pieces.reduce((pieceSum, piece) => pieceSum + piece.areaCm2, 0),
    0,
  );
  const recoverableArea = recoverable.reduce((sum, scrap) => sum + scrap.areaCm2, 0);
  const wasteArea = waste.reduce((sum, scrap) => sum + scrap.areaCm2, 0);
  const purchasedRecoverableArea = recoverable.filter((scrap) => scrap.boardSource === "new").reduce((sum, scrap) => sum + scrap.areaCm2, 0);
  const purchasedWasteArea = waste.filter((scrap) => scrap.boardSource === "new").reduce((sum, scrap) => sum + scrap.areaCm2, 0);
  const economic = calculateMaterialEconomicSummary({
    boardCount: newBoards.length,
    boardPrice: config.price,
    totalArea: purchasedArea,
    usedArea: purchasedUsedArea,
    recoverableArea: purchasedRecoverableArea,
    wasteArea: purchasedWasteArea,
  });

  return {
    boardArea,
    newBoardCount: newBoards.length,
    purchasedArea,
    materialArea,
    usedArea,
    freeArea: Math.max(0, materialArea - usedArea),
    recoverableArea,
    wasteArea,
    cost: economic.totalCost,
    usedValue: economic.usedValue,
    recoverableValue: economic.recoverableValue,
    wasteCost: economic.wasteValue,
    utilizationPercent: materialArea ? (usedArea / materialArea) * 100 : 0,
    percent: (area) => materialArea ? (area / materialArea) * 100 : 0,
    economic,
  };
}
