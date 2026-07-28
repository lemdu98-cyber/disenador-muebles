import { MATERIAL_ORDER } from "../materialConfig";
import { getKnownPieceIds, lockResults } from "./LockedBoardsManager";
import { optimizeIncrementally } from "./IncrementalOptimizer";

export function createFixedProduction(results, materialConfigs, optimizerSettings) {
  return {
    fixedAt: new Date().toISOString(),
    results: lockResults(results, materialConfigs, optimizerSettings),
  };
}

export function getAddedPieces(pieces, production) {
  if (!production) return pieces;
  const known = getKnownPieceIds(production.results);
  return pieces.filter((piece) => !known.has(piece.id));
}

export function optimizeProductionAdditions({ production, pieces, materialConfigs, optimizerSettings, scrapBank }) {
  const addedPieces = getAddedPieces(pieces, production);
  return {
    ...production,
    updatedAt: new Date().toISOString(),
    results: Object.fromEntries(MATERIAL_ORDER.map((materialId) => [
      materialId,
      optimizeIncrementally({
        currentResult: production.results[materialId],
        newPieces: addedPieces.filter((piece) => piece.material.id === materialId),
        materialConfig: materialConfigs[materialId],
        optimizerSettings,
        scrapBank,
      }),
    ])),
  };
}
