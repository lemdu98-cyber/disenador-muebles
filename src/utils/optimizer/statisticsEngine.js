export function calculateOptimizationStatistics({ boards, boardConfig, settings, algorithmsEvaluated, attempts, elapsedMs }) {
  const active = boards.filter((board) => board.pieces.length);
  const newBoards = active.filter((board) => board.source === "new");
  const pieceArea = active.reduce((sum, board) => sum + board.usedArea, 0);
  const usableBoardArea = Math.max(1, (boardConfig.lengthCm - settings.marginsCm.left - settings.marginsCm.right) * (boardConfig.widthCm - settings.marginsCm.top - settings.marginsCm.bottom));
  const theoreticalMinimum = Math.ceil(pieceArea / usableBoardArea);
  const utilizations = active.map((board) => board.utilization);
  return {
    elapsedMs,
    algorithmsEvaluated,
    attempts,
    theoreticalMinimum,
    boardsUsed: newBoards.length,
    differenceFromTheoretical: Math.max(0, newBoards.length - theoreticalMinimum),
    bestBoard: utilizations.length ? Math.max(...utilizations) : 0,
    worstBoard: utilizations.length ? Math.min(...utilizations) : 0,
    averageUtilization: utilizations.length ? utilizations.reduce((sum, value) => sum + value, 0) / utilizations.length : 0,
  };
}
