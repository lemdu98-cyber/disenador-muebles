import { useEffect, useMemo, useState } from "react";
import BoardLayout from "./BoardLayout";
import BoardEditor from "./BoardEditor";
import { addTemporaryBoard, cloneManualLayout, movePieceBetweenBoards, placeUnplacedPiece, pushLayoutHistory, redoLayoutHistory, removeEmptyBoard, sendPieceToUnplaced, undoLayoutHistory, validateManualLayout } from "../utils/editor/ManualLayout.js";

const snapshotBoards = (boards) => boards.map((board) => ({ ...board, pieces: board.pieces.map((piece) => ({ ...piece })), freeRects: board.freeRects.map((rect) => ({ ...rect })) }));

export default function MaterialBoards({ config, result, classification, costs, settings, onSettingsChange, hasManualLayout, onSaveManualLayout, onResetManualLayout, onEditingValidityChange }) {
  const visibleBoards = result.boards.filter((board) => board.pieces.length);
  const [editing, setEditing] = useState(false), [layout, setLayout] = useState({ boards: [], unplaced: [] });
  const [initialLayout, setInitialLayout] = useState(null);
  const [past, setPast] = useState([]), [future, setFuture] = useState([]);
  const optimizerSettings = result.optimizerSettings;
  const validation = useMemo(() => validateManualLayout({ ...layout, optimizerSettings }), [layout, optimizerSettings]);
  useEffect(() => { onEditingValidityChange?.({ editing, valid: validation.isValid }); }, [editing, validation.isValid, onEditingValidityChange]);
  const originalCount = initialLayout?.boards.length || visibleBoards.length;
  const usedArea = layout.boards.reduce((sum, board) => sum + board.pieces.reduce((boardSum, piece) => boardSum + piece.areaCm2, 0), 0);
  const usableArea = layout.boards.reduce((sum, board) => sum + (board.usableArea || 0), 0);
  const utilization = usableArea ? usedArea / usableArea * 100 : 0;

  const startEditing = () => {
    const initial = { boards: snapshotBoards(visibleBoards), unplaced: result.unplaced.map((piece) => ({ ...piece })) };
    setInitialLayout(cloneManualLayout(initial));
    setLayout(initial); setPast([]); setFuture([]); setEditing(true);
  };
  const applyHistory = (history) => { setPast(history.past); setLayout(history.present); setFuture(history.future); };
  const commit = (next) => applyHistory(pushLayoutHistory({ past, present: layout, future }, next));
  const undo = () => applyHistory(undoLayoutHistory({ past, present: layout, future }));
  const redo = () => applyHistory(redoLayoutHistory({ past, present: layout, future }));
  const cancel = () => { setEditing(false); setPast([]); setFuture([]); };
  const resetDraft = () => {
    if (past.length && !window.confirm("Se perderán los cambios manuales. ¿Restablecer la distribución automática?")) return;
    setLayout(cloneManualLayout(initialLayout)); setPast([]); setFuture([]);
  };
  const save = () => { if (!validation.isValid) return; onSaveManualLayout(layout.boards); setEditing(false); };
  useEffect(() => {
    if (!editing) return undefined;
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return <section className={`summary-card material-boards material-${config.id}`}>
    <div className="section-title editor-section-title"><div><p className="eyebrow">PLACAS DE {config.label.toUpperCase()}</p><h2>Optimización independiente</h2></div><div className="editor-actions">
      {!editing && <button type="button" onClick={startEditing} disabled={!visibleBoards.length || visibleBoards.some((board) => board.status === "cut" || board.status === "confirmed") || (!optimizerSettings.freeEditMode && visibleBoards.some((board) => board.status && board.status !== "draft"))}>Editar distribución</button>}
      {editing && <><button type="button" onClick={undo} disabled={!past.length}>Deshacer</button><button type="button" onClick={redo} disabled={!future.length}>Rehacer</button><button type="button" className="primary-action" onClick={save} disabled={!validation.isValid}>Guardar distribución</button><button type="button" onClick={cancel}>Cancelar</button><button type="button" onClick={resetDraft}>Restablecer distribución automática</button>{optimizerSettings.freeEditMode && <button type="button" onClick={() => commit(addTemporaryBoard(layout, config, optimizerSettings))}>Añadir placa</button>}</>}
      {!editing && hasManualLayout && <button type="button" onClick={onResetManualLayout}>Restablecer optimización</button>}
    </div></div>
    {hasManualLayout && !editing && <p className="manual-layout-status">Distribución manual guardada para este pedido.</p>}
    <div className="scrap-settings"><label>Ancho recuperable mínimo (cm)<input type="number" min="1" value={settings.minWidthCm} onChange={(event) => onSettingsChange({ ...settings, minWidthCm: Math.max(1, Number(event.target.value) || 1) })} /></label><label>Alto recuperable mínimo (cm)<input type="number" min="1" value={settings.minHeightCm} onChange={(event) => onSettingsChange({ ...settings, minHeightCm: Math.max(1, Number(event.target.value) || 1) })} /></label></div>
    <div className="board-total"><span>{config.lengthCm} × {config.widthCm} cm · {config.thicknessMm} mm</span><b>{costs.newBoardCount} placas · {costs.cost.toFixed(2)} Bs</b></div>
    {editing && <section className={`manual-validation ${validation.isValid ? "valid" : "invalid"}`}><h3>Estado de la distribución</h3>{validation.isValid ? <b>Distribución válida</b> : <div className="validation-counts"><span>Colisiones: {validation.counts.collisions}</span><span>Fuera de placa: {validation.counts.outOfBounds}</span><span>Piezas sin colocar: {validation.counts.unplaced}</span><span>Veta incorrecta: {validation.counts.grainViolations}</span></div>}<div className="live-layout-stats"><span>Placas utilizadas: {layout.boards.length}</span><span>Utilización total: {utilization.toFixed(1)} %</span></div>{layout.boards.length > originalCount && <p>Esta distribución utiliza {layout.boards.length - originalCount} placa(s) más que la optimización original.</p>}{layout.boards.length < originalCount && <p>Has reducido la producción en {originalCount - layout.boards.length} placa(s).</p>}</section>}
    {editing ? <><div className="board-list">{layout.boards.map((board, index) => <div key={`${board.source}-${board.number}`}><BoardEditor board={board} boardIndex={index} boards={layout.boards} optimizerSettings={optimizerSettings} issuesByPiece={validation.issuesByPiece} onChange={(nextBoard) => commit({ ...layout, boards: layout.boards.map((item, itemIndex) => itemIndex === index ? nextBoard : item) })} onMovePiece={(pieceId, from, to) => commit(movePieceBetweenBoards(layout, pieceId, from, to))} onUnplace={(pieceId, from) => commit(sendPieceToUnplaced(layout, pieceId, from))} />{optimizerSettings.freeEditMode && board.pieces.length === 0 && <button type="button" onClick={() => commit(removeEmptyBoard(layout, index))} disabled={board.status && board.status !== "draft"}>Eliminar placa vacía</button>}</div>)}</div><section className="unplaced-zone"><h3>Piezas sin colocar ({layout.unplaced.length})</h3>{layout.unplaced.length ? layout.unplaced.map((piece) => <div key={piece.id}><span>{piece.name} · {piece.length} × {piece.width} cm</span>{layout.boards.map((board, index) => <button type="button" key={board.number} onClick={() => commit(placeUnplacedPiece(layout, piece.id, index))}>Colocar en {board.label}</button>)}</div>) : <p>Sin piezas pendientes.</p>}</section></> : visibleBoards.length ? <BoardLayout boards={visibleBoards} /> : <p className="empty-state">No hay piezas de {config.label.toLowerCase()} en el pedido.</p>}
    <div className="scrap-result"><div><b>Área recuperable</b><span>{classification.recoverable.length} retazos · {(costs.recoverableArea / 10000).toFixed(2)} m²</span></div><div><b>Desperdicio</b><span>{classification.waste.length} recortes · {(costs.wasteArea / 10000).toFixed(2)} m²</span></div></div>
    {result.unplaced.length > 0 && !editing && <p className="optimizer-warning">{result.unplaced.length} pieza(s) no caben en la placa configurada.</p>}
  </section>;
}
