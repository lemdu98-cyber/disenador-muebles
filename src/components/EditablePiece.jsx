import { useRef } from "react";

const COLORS = ["#e76f51", "#2a9d8f", "#457b9d", "#e9c46a", "#9b5de5", "#f4a261", "#43aa8b", "#577590"];

export default function EditablePiece({ piece, board, boardRef, selected, invalid, onSelect, onDragMove, onDragEnd }) {
  const drag = useRef(null);
  const color = COLORS[(piece.name.length + board.number) % COLORS.length];
  const onPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { clientX: event.clientX, clientY: event.clientY, x: piece.x, y: piece.y };
    onSelect(piece.id);
  };
  const onPointerMove = (event) => {
    if (!drag.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    onDragMove({
      ...piece,
      x: drag.current.x + (event.clientX - drag.current.clientX) / rect.width * board.lengthCm,
      y: drag.current.y + (event.clientY - drag.current.clientY) / rect.height * board.widthCm,
    }, rect);
  };
  const finishDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    onDragEnd();
  };

  return <button
    type="button"
    className={`editable-piece${selected ? " selected" : ""}${invalid ? " invalid" : ""}`}
    style={{
      left: `${piece.x / board.lengthCm * 100}%`,
      top: `${piece.y / board.widthCm * 100}%`,
      width: `${piece.length / board.lengthCm * 100}%`,
      height: `${piece.width / board.widthCm * 100}%`,
      backgroundColor: color,
    }}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={finishDrag}
    onPointerCancel={finishDrag}
    title={`${piece.name}: ${piece.length.toFixed(1)} × ${piece.width.toFixed(1)} cm`}
  ><span>{piece.name}</span><small>{piece.length.toFixed(1)} × {piece.width.toFixed(1)}</small></button>;
}
