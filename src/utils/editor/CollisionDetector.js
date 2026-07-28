const EPSILON = .001;

export function piecesCollide(piece, other, kerfCm = 0) {
  return !(
    piece.x + piece.length + kerfCm <= other.x + EPSILON ||
    other.x + other.length + kerfCm <= piece.x + EPSILON ||
    piece.y + piece.width + kerfCm <= other.y + EPSILON ||
    other.y + other.width + kerfCm <= piece.y + EPSILON
  );
}

export function findCollision(piece, pieces, kerfCm = 0) {
  return pieces.find((other) => other.id !== piece.id && piecesCollide(piece, other, kerfCm)) || null;
}
