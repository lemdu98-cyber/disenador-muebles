export default function PieceManipulator({ piece, canRotate, onRotate, validationMessage }) {
  return <div className="piece-manipulator">
    <span>{piece ? piece.name : "Seleccione una pieza"}</span>
    <button type="button" onClick={onRotate} disabled={!piece || !canRotate}>Rotar 90°</button>
    {piece && !canRotate && <small>Rotación bloqueada por veta o espacio disponible.</small>}
    {validationMessage && <small className="invalid-message">{validationMessage}</small>}
  </div>;
}
