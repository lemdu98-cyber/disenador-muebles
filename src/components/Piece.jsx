const COLORS = ["#e76f51", "#2a9d8f", "#457b9d", "#e9c46a", "#9b5de5", "#f4a261", "#43aa8b", "#577590"];

export default function Piece({ piece, boardNumber, boardLength, boardWidth }) {
  const color = COLORS[(piece.name.length + boardNumber) % COLORS.length];
  return <div className="cut-piece" style={{ left: `${(piece.x / boardLength) * 100}%`, top: `${(piece.y / boardWidth) * 100}%`, width: `${(piece.length / boardLength) * 100}%`, height: `${(piece.width / boardWidth) * 100}%`, backgroundColor: color }} title={`${piece.name}: ${piece.length} × ${piece.width} cm${piece.rotated ? " (girada 90°)" : ""}`}><span>{piece.name}</span><small>{piece.length.toFixed(1)} × {piece.width.toFixed(1)}{piece.rotated ? " ↻" : ""}</small></div>;
}
