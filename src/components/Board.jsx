import Piece from "./Piece";
import { MELAMINE_BOARD } from "../utils/cutPieces";

export default function Board({ board }) {
  const usedArea = board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const boardArea = MELAMINE_BOARD.lengthCm * MELAMINE_BOARD.widthCm;
  const utilization = (usedArea / boardArea) * 100;
  return <article className="board-card">
    <div className="board-heading"><b>Placa #{board.number}</b><span>{utilization.toFixed(1)}% aprovechado</span></div>
    <div className="board-layout" aria-label={`Distribución de placa ${board.number}`}>
      {board.pieces.map((piece) => <Piece key={piece.id} piece={piece} boardNumber={board.number} boardLength={MELAMINE_BOARD.lengthCm} boardWidth={MELAMINE_BOARD.widthCm} />)}
    </div>
    <div className="board-stats"><span>Usada: {(usedArea / 10000).toFixed(2)} m²</span><span>Desperdicio: {((boardArea - usedArea) / 10000).toFixed(2)} m²</span></div>
  </article>;
}
