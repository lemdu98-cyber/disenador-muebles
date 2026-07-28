const closest = (value, targets, threshold) => {
  let result = value;
  let distance = threshold;
  targets.forEach((target) => {
    const nextDistance = Math.abs(value - target);
    if (nextDistance <= distance) {
      result = target;
      distance = nextDistance;
    }
  });
  return result;
};

export function snapPiecePosition(piece, pieces, board, thresholdCm = 1.5) {
  const margins = board.marginsCm || { top: 0, bottom: 0, left: 0, right: 0 };
  const kerf = Math.max(0, board.kerfMm || 0) / 10;
  const xTargets = [margins.left, board.lengthCm - margins.right - piece.length];
  const yTargets = [margins.top, board.widthCm - margins.bottom - piece.width];

  pieces.filter((other) => other.id !== piece.id).forEach((other) => {
    xTargets.push(other.x, other.x + other.length + kerf, other.x - piece.length - kerf);
    yTargets.push(other.y, other.y + other.width + kerf, other.y - piece.width - kerf);
  });

  return {
    ...piece,
    x: closest(piece.x, xTargets, thresholdCm),
    y: closest(piece.y, yTargets, thresholdCm),
  };
}
