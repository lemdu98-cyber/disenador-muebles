import { BOARD_STATES } from "./BoardStateManager";

export function materialFingerprint(config) {
  return JSON.stringify({
    materialId: config.id,
    thicknessMm: config.thicknessMm,
    lengthCm: config.lengthCm,
    widthCm: config.widthCm,
    color: config.color || null,
    texture: config.texture || null,
  });
}

export function lockResults(results, materialConfigs, optimizerSettings) {
  return Object.fromEntries(Object.entries(results).map(([materialId, result]) => [
    materialId,
    {
      ...result,
      boards: result.boards.map((board) => ({
        ...board,
        status: BOARD_STATES.FIXED,
        compatibilityKey: materialFingerprint(materialConfigs[materialId]),
        materialSnapshot: {
          id: materialConfigs[materialId].id,
          label: materialConfigs[materialId].label,
          thicknessMm: materialConfigs[materialId].thicknessMm,
          lengthCm: materialConfigs[materialId].lengthCm,
          widthCm: materialConfigs[materialId].widthCm,
          color: materialConfigs[materialId].color || null,
          texture: materialConfigs[materialId].texture || null,
        },
        optimizerSettings: structuredClone(optimizerSettings),
        pieces: board.pieces.map((piece) => ({ ...piece, locked: true })),
        freeRects: board.freeRects.map((rect) => ({ ...rect })),
      })),
    },
  ]));
}

export function getKnownPieceIds(results) {
  return new Set(Object.values(results).flatMap((result) => result.boards.flatMap((board) => board.pieces.map((piece) => piece.id))));
}
