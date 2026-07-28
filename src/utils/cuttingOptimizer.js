import { MELAMINE_BOARD } from "./cutPieces";
import { runCuttingEngine } from "./optimizer/cuttingEngine";

/** Compatibility facade for the modular multi-strategy cutting engine. */
export function optimizeCuts(pieces, { scrapBank = [], boardConfig = MELAMINE_BOARD, optimizerSettings } = {}) {
  return runCuttingEngine(pieces, { scrapBank, boardConfig, optimizerSettings });
}
