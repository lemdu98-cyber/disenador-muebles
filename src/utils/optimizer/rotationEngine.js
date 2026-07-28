import { canRotatePiece } from "./grainEngine";

export function getPieceOrientations(piece, settings) {
  const orientations = [{ length: piece.length, width: piece.width, rotated: false }];
  if (canRotatePiece(piece, settings) && Math.abs(piece.length - piece.width) > .001) {
    orientations.push({ length: piece.width, width: piece.length, rotated: true });
  }
  return orientations;
}
