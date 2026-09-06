import { materialFingerprint } from "./LockedBoardsManager.js";
import { canAcceptPieces } from "./BoardStateManager.js";

export function isCompatibleLockedBoard(board, materialConfig) {
  return canAcceptPieces(board)
    && board.materialId === materialConfig.id
    && board.compatibilityKey === materialFingerprint(materialConfig)
    && board.lengthCm === materialConfig.lengthCm
    && board.widthCm === materialConfig.widthCm;
}
