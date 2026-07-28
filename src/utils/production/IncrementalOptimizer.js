import { optimizeMaterial } from "../materialOptimizer";
import { calculateOptimizationStatistics } from "../optimizer/statisticsEngine";
import { generateCutSequence } from "../optimizer/cutSequenceGenerator";
import { BOARD_STATES } from "./BoardStateManager";
import { isCompatibleLockedBoard } from "./BoardValidator";
import { findBestFreePlacement, insertIntoFreeRect } from "./FreeRectangleManager";

export function optimizeIncrementally({ currentResult, newPieces, materialConfig, optimizerSettings, scrapBank = [] }) {
  let boards = currentResult.boards.map((board) => ({
    ...board,
    pieces: board.pieces.map((piece) => ({ ...piece })),
    freeRects: board.freeRects.map((rect) => ({ ...rect })),
  }));
  const remaining = [];
  let insertedExisting = 0;

  newPieces.sort((a, b) => b.areaCm2 - a.areaCm2).forEach((piece) => {
    const compatible = boards.map((board, index) => ({ board, index }))
      .filter(({ board }) => isCompatibleLockedBoard(board, materialConfig));
    const placement = findBestFreePlacement(compatible.map(({ board }) => board), piece, optimizerSettings);
    if (!placement) {
      remaining.push(piece);
      return;
    }
    const actualIndex = compatible[placement.boardIndex].index;
    boards[actualIndex] = insertIntoFreeRect(boards[actualIndex], placement, piece, optimizerSettings);
    insertedExisting += 1;
  });

  const overflow = optimizeMaterial(remaining, materialConfig, { scrapBank, optimizerSettings });
  const nextNumber = boards.reduce((maximum, board) => Math.max(maximum, board.number), 0);
  const newBoards = overflow.boards.map((board, index) => ({
    ...board,
    number: nextNumber + index + 1,
    label: board.source === "scrap" ? board.label : `${materialConfig.boardLabel || "Placa"} #${nextNumber + index + 1}`,
    status: BOARD_STATES.DRAFT,
    pieces: board.pieces.map((piece) => ({ ...piece, locked: false, incremental: true })),
  }));
  boards = [...boards, ...newBoards].map((board) => {
    const cuttingSequence = generateCutSequence(board);
    return { ...board, cutCount: cuttingSequence.length, cuttingSequence };
  });
  const settings = { ...optimizerSettings, marginsCm: { ...optimizerSettings.marginsCm } };
  return {
    ...currentResult,
    pieces: [...currentResult.pieces, ...newPieces],
    boards,
    unplaced: overflow.unplaced,
    selectedAlgorithm: `Incremental · ${overflow.selectedAlgorithm}`,
    optimizerSettings: settings,
    statistics: calculateOptimizationStatistics({
      boards, boardConfig: materialConfig, settings,
      algorithmsEvaluated: overflow.statistics.algorithmsEvaluated,
      attempts: overflow.statistics.attempts,
      elapsedMs: overflow.statistics.elapsedMs,
    }),
    scrapUsage: [...new Set([...(currentResult.scrapUsage || []), ...(overflow.scrapUsage || [])])],
    incrementalSummary: {
      added: newPieces.length,
      insertedExisting,
      sentToNewBoards: remaining.length - overflow.unplaced.length,
    },
  };
}
