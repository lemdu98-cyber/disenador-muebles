import { OPTIMIZATION_MODES, DEFAULT_OPTIMIZER_SETTINGS } from "./optimizerConfig";
import { getPieceOrientations } from "./rotationEngine";
import { getUsableBoardRect, kerfCm, splitFreeRect } from "./kerfCalculator";
import { binPackingStrategies } from "./binPacking";
import { guillotineStrategy } from "./guillotineOptimizer";
import { maxRectsStrategy } from "./maxRects";
import { skylineStrategy } from "./skylineOptimizer";
import { evaluateSolution, isBetterSolution } from "./boardEvaluator";
import { generateCutSequence } from "./cutSequenceGenerator";
import { calculateOptimizationStatistics } from "./statisticsEngine";

const STRATEGIES = [...binPackingStrategies, guillotineStrategy, maxRectsStrategy, skylineStrategy];
const EPSILON = .001;

const compareTuples = (left, right) => {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (Math.abs(difference) > EPSILON) return difference;
  }
  return 0;
};

const hash = (value) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0) / 4294967296;
};

function orderPieces(pieces, strategy, attempt) {
  const ordered = [...pieces];
  if (strategy.id === "shelf") {
    ordered.sort((a, b) => Math.max(b.width, b.length) - Math.max(a.width, a.length) || b.areaCm2 - a.areaCm2);
  } else if (strategy.id === "skyline") {
    ordered.sort((a, b) => Math.min(b.width, b.length) - Math.min(a.width, a.length) || b.areaCm2 - a.areaCm2);
  } else {
    ordered.sort((a, b) => b.areaCm2 - a.areaCm2 || Math.max(b.length, b.width) - Math.max(a.length, a.width));
  }
  if (attempt >= STRATEGIES.length) {
    ordered.sort((a, b) => {
      const areaBand = Math.floor(b.areaCm2 / 500) - Math.floor(a.areaCm2 / 500);
      return areaBand || hash(`${attempt}-${a.id}`) - hash(`${attempt}-${b.id}`);
    });
  }
  return ordered;
}

function createBoard(number, boardConfig, settings, source = "new", stock = null) {
  const lengthCm = stock?.lengthCm || boardConfig.lengthCm;
  const widthCm = stock?.widthCm || boardConfig.widthCm;
  const usableRect = getUsableBoardRect(lengthCm, widthCm, settings.marginsCm);
  return {
    number,
    source,
    stockId: stock?.id || null,
    label: source === "scrap" ? `Retazo ${stock.code || stock.id}` : `${boardConfig.boardLabel || "Placa"} #${number}`,
    pieces: [],
    freeRects: usableRect.width > 0 && usableRect.height > 0 ? [usableRect] : [],
    lengthCm,
    widthCm,
    usableArea: usableRect.width * usableRect.height,
    materialId: boardConfig.id,
    marginsCm: settings.marginsCm,
    kerfMm: settings.kerfMm,
    cutCount: 0,
    usedArea: 0,
  };
}

function candidatesForBoard(board, piece, settings, strategy, boardIndex) {
  const candidates = [];
  board.freeRects.forEach((free, freeIndex) => {
    getPieceOrientations(piece, settings).forEach((orientation) => {
      if (orientation.length > free.width + EPSILON || orientation.width > free.height + EPSILON) return;
      const waste = free.width * free.height - orientation.length * orientation.width;
      const shortSide = Math.min(free.width - orientation.length, free.height - orientation.width);
      const longSide = Math.max(free.width - orientation.length, free.height - orientation.width);
      const boardWaste = board.usableArea - board.usedArea - piece.areaCm2;
      const score = strategy.score({ waste, shortSide, longSide, free, orientation, boardIndex, freeIndex, boardWaste });
      candidates.push({ board, boardIndex, free, freeIndex, orientation, waste, score });
    });
  });
  return candidates;
}

function choosePlacement(boards, piece, settings, strategy) {
  const candidates = boards.flatMap((board, boardIndex) => candidatesForBoard(board, piece, settings, strategy, boardIndex));
  if (!candidates.length) return null;
  const scrapCandidates = candidates.filter((candidate) => candidate.board.source === "scrap");
  const pool = scrapCandidates.length ? scrapCandidates : candidates;
  if (scrapCandidates.length) {
    return pool.sort((a, b) => a.waste - b.waste || compareTuples(a.score, b.score))[0];
  }
  return pool.sort((a, b) => compareTuples(a.score, b.score))[0];
}

function applyPlacement(candidate, piece, settings) {
  const { board, free, freeIndex, orientation } = candidate;
  board.freeRects.splice(freeIndex, 1, ...splitFreeRect(free, orientation, kerfCm(settings)));
  board.pieces.push({
    ...piece,
    x: free.x,
    y: free.y,
    length: orientation.length,
    width: orientation.width,
    rotated: orientation.rotated,
  });
  board.usedArea += piece.areaCm2;
}

function packOnce(pieces, boardConfig, scrapBank, settings, strategy, attempt) {
  const scraps = settings.useScrapBank
    ? scrapBank.filter((scrap) => scrap.status === "Disponible" && (!scrap.materialId || scrap.materialId === boardConfig.id))
      .sort((a, b) => a.lengthCm * a.widthCm - b.lengthCm * b.widthCm)
    : [];
  const boards = scraps.map((scrap, index) => createBoard(index + 1, boardConfig, settings, "scrap", scrap));
  const unplaced = [];

  orderPieces(pieces, strategy, attempt).forEach((piece) => {
    let placement = choosePlacement(boards, piece, settings, strategy);
    if (!placement) {
      const board = createBoard(boards.length + 1, boardConfig, settings);
      const newBoardPlacement = choosePlacement([board], piece, settings, strategy);
      if (!newBoardPlacement) {
        unplaced.push(piece);
        return;
      }
      boards.push(board);
      placement = newBoardPlacement;
    }
    applyPlacement(placement, piece, settings);
  });

  const activeBoards = boards.filter((board) => board.pieces.length).map((board, index) => {
    const utilization = board.usableArea ? board.usedArea / board.usableArea * 100 : 0;
    const cuttingSequence = generateCutSequence(board);
    return {
      ...board,
      number: index + 1,
      label: board.source === "scrap" ? board.label : `${boardConfig.boardLabel || "Placa"} #${index + 1}`,
      algorithm: strategy.label,
      utilization,
      cutCount: cuttingSequence.length,
      cuttingSequence,
    };
  });
  const solution = { boards: activeBoards, unplaced, strategy };
  solution.evaluation = evaluateSolution(solution);
  return solution;
}

export function runCuttingEngine(pieces, {
  scrapBank = [],
  boardConfig,
  optimizerSettings = DEFAULT_OPTIMIZER_SETTINGS,
} = {}) {
  const startedAt = performance.now();
  const settings = {
    ...DEFAULT_OPTIMIZER_SETTINGS,
    ...optimizerSettings,
    marginsCm: { ...DEFAULT_OPTIMIZER_SETTINGS.marginsCm, ...optimizerSettings.marginsCm },
  };
  const attempts = OPTIMIZATION_MODES[settings.mode]?.attempts || OPTIMIZATION_MODES.standard.attempts;
  let best = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const strategy = STRATEGIES[attempt % STRATEGIES.length];
    const candidate = packOnce(pieces, boardConfig, scrapBank, settings, strategy, attempt);
    if (isBetterSolution(candidate, best)) best = candidate;
  }
  const boards = best?.boards || [];
  const elapsedMs = performance.now() - startedAt;
  const statistics = calculateOptimizationStatistics({
    boards,
    boardConfig,
    settings,
    algorithmsEvaluated: Math.min(STRATEGIES.length, attempts),
    attempts,
    elapsedMs,
  });
  return {
    boards,
    unplaced: best?.unplaced || [],
    scrapUsage: boards.filter((board) => board.source === "scrap").map((board) => board.stockId),
    selectedAlgorithm: best?.strategy.label || "Sin piezas",
    score: best?.evaluation.score || 0,
    statistics,
    optimizerSettings: settings,
  };
}
