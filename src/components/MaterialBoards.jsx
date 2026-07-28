import BoardLayout from "./BoardLayout";

export default function MaterialBoards({ config, result, classification, costs, settings, onSettingsChange }) {
  const visibleBoards = result.boards.filter((board) => board.pieces.length);
  return <section className={`summary-card material-boards material-${config.id}`}>
    <div className="section-title">
      <div>
        <p className="eyebrow">PLACAS DE {config.label.toUpperCase()}</p>
        <h2>Optimización independiente</h2>
      </div>
    </div>
    <div className="scrap-settings">
      <label>Ancho recuperable mínimo (cm)<input type="number" min="1" value={settings.minWidthCm} onChange={(event) => onSettingsChange({ ...settings, minWidthCm: Math.max(1, Number(event.target.value) || 1) })} /></label>
      <label>Alto recuperable mínimo (cm)<input type="number" min="1" value={settings.minHeightCm} onChange={(event) => onSettingsChange({ ...settings, minHeightCm: Math.max(1, Number(event.target.value) || 1) })} /></label>
    </div>
    <div className="board-total">
      <span>{config.lengthCm} × {config.widthCm} cm · {config.thicknessMm} mm</span>
      <b>{costs.newBoardCount} placas · {costs.cost.toFixed(2)} Bs</b>
    </div>
    <div className="optimization-stats">
      <div><span>Algoritmo elegido</span><b>{result.selectedAlgorithm}</b></div>
      <div><span>Tiempo</span><b>{result.statistics.elapsedMs.toFixed(1)} ms</b></div>
      <div><span>Algoritmos evaluados</span><b>{result.statistics.algorithmsEvaluated}</b></div>
      <div><span>Intentos</span><b>{result.statistics.attempts}</b></div>
      <div><span>Mínimo teórico</span><b>{result.statistics.theoreticalMinimum} placas</b></div>
      <div><span>Diferencia</span><b>+{result.statistics.differenceFromTheoretical}</b></div>
      <div><span>Mejor placa</span><b>{result.statistics.bestBoard.toFixed(2)}%</b></div>
      <div><span>Peor placa</span><b>{result.statistics.worstBoard.toFixed(2)}%</b></div>
      <div><span>Promedio</span><b>{result.statistics.averageUtilization.toFixed(2)}%</b></div>
    </div>
    {visibleBoards.length ? <BoardLayout boards={visibleBoards} /> : <p className="empty-state">No hay piezas de {config.label.toLowerCase()} en el pedido.</p>}
    <div className="scrap-result">
      <div><b>Área recuperable</b><span>{classification.recoverable.length} retazos · {(costs.recoverableArea / 10000).toFixed(2)} m²</span></div>
      <div><b>Desperdicio</b><span>{classification.waste.length} recortes · {(costs.wasteArea / 10000).toFixed(2)} m²</span></div>
    </div>
    {result.unplaced.length > 0 && <p className="optimizer-warning">{result.unplaced.length} pieza(s) no caben en la placa configurada.</p>}
  </section>;
}
