import Piece from "./Piece";
import { MELAMINE_BOARD } from "../utils/cutPieces";
import { downloadBoardImage } from "../utils/boardImageExporter";
import { BOARD_STATE_ICONS, BOARD_STATE_LABELS, BOARD_STATES } from "../utils/production/BoardStateManager";

export default function Board({ board }) {
  const usedArea = board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const boardLength = board.lengthCm || MELAMINE_BOARD.lengthCm;
  const boardWidth = board.widthCm || MELAMINE_BOARD.widthCm;
  const boardArea = board.usableArea || boardLength * boardWidth;
  const utilization = board.utilization ?? (usedArea / boardArea) * 100;
  const status = board.status || BOARD_STATES.DRAFT;
  return <article className="board-card">
    <div className="board-heading"><b>{board.label || `Placa #${board.number}`}</b><span>{utilization.toFixed(2)}% aprovechado</span></div>
    <div className={`board-status board-status-${status}`}>{BOARD_STATE_ICONS[status]} {BOARD_STATE_LABELS[status]}</div>
    <div className="board-algorithm">{board.algorithm || "Optimización guillotina"} · {board.pieces.length} piezas · {board.cutCount || 0} cortes</div>
    <div className="board-layout" aria-label={`Distribución de ${board.label || `placa ${board.number}`}`}><div className="board-inner" style={{ aspectRatio: `${boardLength} / ${boardWidth}` }}>{board.pieces.map((piece) => <Piece key={piece.id} piece={piece} boardNumber={board.number} boardLength={boardLength} boardWidth={boardWidth} />)}</div></div>
    <div className="board-metrics">
      <span>Utilizada: {(usedArea / 10000).toFixed(2)} m²</span>
      <span>Recuperable: {((board.recoverableArea || 0) / 10000).toFixed(2)} m²</span>
      <span>Desperdicio: {((board.wasteArea || 0) / 10000).toFixed(2)} m²</span>
    </div>
    {board.cuttingSequence?.length > 0 && <details className="cut-sequence"><summary>Secuencia de corte</summary><ol>{board.cuttingSequence.map((step) => <li key={step.step}>{step.instruction}</li>)}</ol></details>}
    <button className="board-download" type="button" onClick={() => downloadBoardImage({ ...board, lengthCm: boardLength, widthCm: boardWidth })}>Descargar imagen</button>
  </article>;
}
