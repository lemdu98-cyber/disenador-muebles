import BoardLayout from "./BoardLayout";
import { MELAMINE_BOARD } from "../utils/cutPieces";

export default function ProductionOptimizer({ boards, unplaced, recoverable, waste, costs, settings, setSettings }) {
  return <section className="summary-card production-optimizer"><div className="section-title"><div><h2>Optimización de placas</h2><p className="summary-title">Guillotine cutting con giro de 90° y prioridad al banco de retazos.</p></div></div>
    <div className="scrap-settings"><label>Ancho mínimo (cm)<input type="number" min="1" value={settings.minWidthCm} onChange={(event) => setSettings({ ...settings, minWidthCm: Math.max(1, Number(event.target.value) || 1) })} /></label><label>Alto mínimo (cm)<input type="number" min="1" value={settings.minHeightCm} onChange={(event) => setSettings({ ...settings, minHeightCm: Math.max(1, Number(event.target.value) || 1) })} /></label></div>
    <div className="board-total"><span>Placa estándar: {MELAMINE_BOARD.lengthCm} × {MELAMINE_BOARD.widthCm} cm</span><b>{costs.newBoardCount} placas · {costs.cost.toFixed(2)} Bs</b></div>
    {boards.length ? <BoardLayout boards={boards.filter((board) => board.pieces.length)} /> : <p className="empty-state">Agregue unidades al pedido para optimizar.</p>}
    <div className="scrap-result"><div><b>Material recuperable</b><span>{recoverable.length} retazos · {(costs.recoverableArea / 10000).toFixed(2)} m² · {costs.recoverableValue.toFixed(2)} Bs</span></div><div><b>Desperdicio real</b><span>{waste.length} recortes · {(costs.wasteArea / 10000).toFixed(2)} m² · {costs.wasteCost.toFixed(2)} Bs</span></div></div>
    {unplaced.length > 0 && <p className="optimizer-warning">{unplaced.length} pieza(s) no caben en una placa ni retazo disponible.</p>}
  </section>;
}
