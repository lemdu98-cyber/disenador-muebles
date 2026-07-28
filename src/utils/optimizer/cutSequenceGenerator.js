export function generateCutSequence(board) {
  return board.pieces.flatMap((piece) => {
    const steps = [];
    if (piece.x > 0 || piece.x + piece.length < board.lengthCm) {
      steps.push(`Cortar franja vertical a ${piece.x.toFixed(1)} cm para ${piece.name}.`);
    }
    if (piece.y > 0 || piece.y + piece.width < board.widthCm) {
      steps.push(`Dividir franja a ${piece.y.toFixed(1)} cm y separar ${piece.name} (${piece.length.toFixed(1)} × ${piece.width.toFixed(1)} cm).`);
    }
    return steps.length ? steps : [`Separar ${piece.name} (${piece.length.toFixed(1)} × ${piece.width.toFixed(1)} cm).`];
  }).map((instruction, index) => ({ step: index + 1, instruction }));
}
