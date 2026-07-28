export function evaluateSolution(solution) {
  const activeBoards = solution.boards.filter((board) => board.pieces.length);
  const newBoardCount = activeBoards.filter((board) => board.source === "new").length;
  const usedArea = activeBoards.reduce((sum, board) => sum + board.usedArea, 0);
  const usableArea = activeBoards.reduce((sum, board) => sum + board.usableArea, 0);
  const wasteArea = Math.max(0, usableArea - usedArea);
  const utilization = usableArea ? usedArea / usableArea * 100 : 0;
  const cutCount = activeBoards.reduce((sum, board) => sum + board.cutCount, 0);
  const complexity = activeBoards.reduce((sum, board) => sum + board.freeRects.length, 0);
  const unplacedPenalty = solution.unplaced.length * 1e15;
  const score = unplacedPenalty + newBoardCount * 1e12 - utilization * 1e7 + wasteArea * 1e3 + cutCount * 100 + complexity;
  return { score, newBoardCount, usedArea, usableArea, wasteArea, utilization, cutCount, complexity };
}

export const isBetterSolution = (candidate, current) => !current || candidate.evaluation.score < current.evaluation.score;
