const COLORS = ["#E76F51", "#2A9D8F", "#457B9D", "#E9C46A", "#9B5DE5", "#F4A261", "#43AA8B", "#577590"];
const EXPORT_WIDTH = 3200;

function pieceColor(piece, boardNumber) {
  return COLORS[(piece.name.length + boardNumber) % COLORS.length];
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
  context.stroke();
}

/** Generates a print-ready PNG directly from optimizer coordinates; it never captures the DOM. */
export function downloadBoardImage(board) {
  const boardLength = board.lengthCm;
  const boardWidth = board.widthCm;
  const usedArea = board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const area = boardLength * boardWidth;
  const margin = 160;
  const headerHeight = 390;
  const layoutWidth = EXPORT_WIDTH - margin * 2;
  const layoutHeight = layoutWidth * (boardWidth / boardLength);
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = Math.ceil(headerHeight + layoutHeight + margin);
  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#3C2717";
  context.font = "700 70px Arial, sans-serif";
  context.fillText(board.label || `Placa #${board.number}`, margin, 120);
  context.fillStyle = "#6C5A4C";
  context.font = "36px Arial, sans-serif";
  context.fillText(`${boardLength} × ${boardWidth} cm`, margin, 180);

  const boxWidth = 760;
  const boxHeight = 245;
  const boxX = EXPORT_WIDTH - margin - boxWidth;
  context.fillStyle = "#FFF9F2";
  context.strokeStyle = "#B18A6C";
  context.lineWidth = 3;
  roundedRect(context, boxX, 70, boxWidth, boxHeight, 20);
  context.fillStyle = "#3C2717";
  context.font = "700 38px Arial, sans-serif";
  context.fillText(board.label || `Placa #${board.number}`, boxX + 35, 122);
  context.font = "32px Arial, sans-serif";
  context.fillText(`Aprovechamiento: ${(usedArea / area * 100).toFixed(1)} %`, boxX + 35, 180);
  context.fillText(`Área utilizada: ${(usedArea / 10000).toFixed(2)} m²`, boxX + 35, 230);
  context.fillText(`Área libre: ${((area - usedArea) / 10000).toFixed(2)} m²`, boxX + 35, 280);

  const x = margin;
  const y = headerHeight;
  context.fillStyle = "#F7F1E8";
  context.fillRect(x, y, layoutWidth, layoutHeight);
  context.strokeStyle = "#3C2717";
  context.lineWidth = 10;
  context.strokeRect(x, y, layoutWidth, layoutHeight);
  board.pieces.forEach((piece) => {
    const pieceX = x + piece.x / boardLength * layoutWidth;
    const pieceY = y + piece.y / boardWidth * layoutHeight;
    const pieceWidth = piece.length / boardLength * layoutWidth;
    const pieceHeight = piece.width / boardWidth * layoutHeight;
    context.fillStyle = pieceColor(piece, board.number);
    context.fillRect(pieceX, pieceY, pieceWidth, pieceHeight);
    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 5;
    context.strokeRect(pieceX, pieceY, pieceWidth, pieceHeight);
    const shortSide = Math.min(pieceWidth, pieceHeight);
    if (shortSide < 52) return;
    const fontSize = Math.max(20, Math.min(42, shortSide / 4.2));
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `700 ${fontSize}px Arial, sans-serif`;
    context.fillText(piece.name, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 - fontSize * .65, pieceWidth - 12);
    context.font = `${Math.max(18, fontSize * .78)}px Arial, sans-serif`;
    const rotation = piece.rotated ? " · 90°" : "";
    context.fillText(`${piece.length.toFixed(1)} × ${piece.width.toFixed(1)} cm${rotation}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + fontSize * .65, pieceWidth - 12);
  });
  context.textAlign = "start";
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Placa-${String(board.number).padStart(2, "0")}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, "image/png");
}
