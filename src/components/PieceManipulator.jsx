export default function PieceManipulator({ piece, canRotate, onRotate, validationMessage, onUnplace, boardOptions = [], onMoveBoard }) {
  return <div className="piece-manipulator">
    <span>{piece ? piece.name : "Seleccione una pieza"}</span>
    <button type="button" onClick={onRotate} disabled={!piece || !canRotate}>Rotar 90°</button>
    {onUnplace && <button type="button" onClick={onUnplace} disabled={!piece || piece.locked && !piece.incremental}>Enviar a sin colocar</button>}
    {piece && boardOptions.length > 0 && <label>Mover a placa<select value="" onChange={(event) => { if (event.target.value !== "") onMoveBoard(Number(event.target.value)); }} disabled={piece.locked && !piece.incremental}><option value="">Seleccionar…</option>{boardOptions.map((option) => <option key={option.index} value={option.index}>{option.label}</option>)}</select></label>}
    {piece && !canRotate && <small>Rotación bloqueada por veta o espacio disponible.</small>}
    {validationMessage && <small className="invalid-message">{validationMessage}</small>}
  </div>;
}
