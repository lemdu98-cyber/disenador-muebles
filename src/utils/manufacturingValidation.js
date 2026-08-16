import { MATERIAL_IDS } from "./materialConfig.js";
import { canRotatePiece } from "./optimizer/grainEngine.js";
import { DEFAULT_OPTIMIZER_SETTINGS } from "./optimizer/optimizerConfig.js";

const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function getUsableBoardDimensions(boardConfig, optimizerSettings = DEFAULT_OPTIMIZER_SETTINGS) {
  const settings = { ...DEFAULT_OPTIMIZER_SETTINGS, ...optimizerSettings, marginsCm: { ...DEFAULT_OPTIMIZER_SETTINGS.marginsCm, ...optimizerSettings?.marginsCm } };
  return {
    lengthCm: Math.max(0, finite(boardConfig?.lengthCm) - finite(settings.marginsCm.left) - finite(settings.marginsCm.right)),
    widthCm: Math.max(0, finite(boardConfig?.widthCm) - finite(settings.marginsCm.top) - finite(settings.marginsCm.bottom)),
    settings,
  };
}

export function validatePieceAgainstBoard(piece, boardConfig, optimizerSettings = DEFAULT_OPTIMIZER_SETTINGS) {
  const lengthCm = finite(piece?.length);
  const widthCm = finite(piece?.width);
  const usable = getUsableBoardDimensions(boardConfig, optimizerSettings);
  const positiveDimensions = lengthCm > 0 && widthCm > 0 && usable.lengthCm > 0 && usable.widthCm > 0;
  const fitsNormal = positiveDimensions && lengthCm <= usable.lengthCm && widthCm <= usable.widthCm;
  const rotationAllowed = positiveDimensions && canRotatePiece(piece || {}, usable.settings);
  const fitsRotated = rotationAllowed && widthCm <= usable.lengthCm && lengthCm <= usable.widthCm;
  const valid = fitsNormal || fitsRotated;
  let reason = "";
  if (!positiveDimensions) reason = "La pieza o el área útil de la placa tiene dimensiones inválidas.";
  else if (!valid && !rotationAllowed) reason = "No cabe en su orientación autorizada y la rotación está bloqueada por la configuración o la veta.";
  else if (!valid) reason = "No cabe en el área útil de la placa, ni siquiera rotada 90°.";
  return { valid, fitsNormal, fitsRotated, rotationAllowed, reason, usableBoardLengthCm: usable.lengthCm, usableBoardWidthCm: usable.widthCm };
}

export function validateFurniturePieces(pieces, boardConfig, optimizerSettings = DEFAULT_OPTIMIZER_SETTINGS) {
  const melaminePieces = (pieces || []).filter((piece) => (piece.material?.id || piece.materialId) === MATERIAL_IDS.MELAMINE);
  const invalidPieces = melaminePieces.map((piece) => ({ piece, ...validatePieceAgainstBoard(piece, boardConfig, optimizerSettings) })).filter((result) => !result.valid);
  const first = invalidPieces[0];
  const error = first ? `La pieza ${first.piece.name} (${first.piece.length} × ${first.piece.width} cm) no cabe en la placa de melamina disponible (${finite(boardConfig?.lengthCm)} × ${finite(boardConfig?.widthCm)} cm). Área útil con márgenes: ${first.usableBoardLengthCm.toFixed(1)} × ${first.usableBoardWidthCm.toFixed(1)} cm. ${first.reason}` : "";
  return { valid: invalidPieces.length === 0, invalidPieces, warnings: [], error };
}
