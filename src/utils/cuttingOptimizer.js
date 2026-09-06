import { MELAMINE_BOARD } from "./cutPieces.js";
import { runCuttingEngine } from "./optimizer/cuttingEngine.js";

/** Compatibility facade for the modular multi-strategy cutting engine. */
export function optimizeCuts(pieces, { scrapBank = [], boardConfig = MELAMINE_BOARD, optimizerSettings } = {}) {
  return runCuttingEngine(pieces, { scrapBank, boardConfig, optimizerSettings });
}
