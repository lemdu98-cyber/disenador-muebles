import Piece from "./Piece";
import { MELAMINE_BOARD } from "../utils/cutPieces";
import { downloadBoardImage } from "../utils/boardImageExporter";

export default function Board({ board }) {
  const usedArea = board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const boardLength = board.lengthCm || MELAMINE_BOARD.lengthCm;
  const boardWidth = board.widthCm || MELAMINE_BOARD.widthCm;
  const boardArea = boardLength * boardWidth;
  const utilization = (usedArea / boardArea) * 100;
  return <article className="board-card"><div className="board-heading"><b>{board.label || `Placa #${board.number}`}</b><span>{utilization.toFixed(1)}% aprovechado</span></div><div className="board-layout" aria-label={`Distribución de ${board.label || `placa ${board.number}`}`}><div className="board-inner" style={{ aspectRatio: `${boardLength} / ${boardWidth}` }}>{board.pieces.map((piece) => <Piece key={piece.id} piece={piece} boardNumber={board.number} boardLength={boardLength} boardWidth={boardWidth} />)}</div></div><div className="board-stats"><span>Usada: {(usedArea / 10000).toFixed(2)} m²</span><span>Libre: {((boardArea - usedArea) / 10000).toFixed(2)} m²</span></div><button className="board-download" type="button" onClick={() => downloadBoardImage({ ...board, lengthCm: boardLength, widthCm: boardWidth })}>📷 Descargar imagen</button></article>;
}
