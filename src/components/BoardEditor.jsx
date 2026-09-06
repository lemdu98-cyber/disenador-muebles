import { useEffect, useMemo, useRef, useState } from "react";
import EditablePiece from "./EditablePiece";
import PieceManipulator from "./PieceManipulator";
import { snapPiecePosition } from "../utils/editor/SnapEngine.js";
import { rebuildBoardGeometry, validatePiecePlacement } from "../utils/editor/BoardValidator.js";
import { canRotatePiece } from "../utils/optimizer/grainEngine.js";

export default function BoardEditor({ board, boardIndex, boards, onChange, onMovePiece, onUnplace, optimizerSettings, issuesByPiece = {} }) {
  const boardRef = useRef(null), previewRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null), [preview, setPreview] = useState(null);
  const selected = board.pieces.find((piece) => piece.id === selectedId) || null;
  const displayedPieces = useMemo(() => board.pieces.map((piece) => piece.id === preview?.piece.id ? preview.piece : piece), [board.pieces, preview]);
  const freeMode = Boolean(optimizerSettings.freeEditMode);

  const previewPlacement = (nextPiece, rect) => {
    const thresholdCm = Math.max(board.lengthCm / rect.width, board.widthCm / rect.height) * 8;
    const positioned = optimizerSettings.magneticSnap === false ? nextPiece : snapPiecePosition(nextPiece, board.pieces, board, thresholdCm);
    const nextPreview = { piece: positioned, ...validatePiecePlacement(positioned, board.pieces, board) };
    previewRef.current = nextPreview;
    setPreview(nextPreview);
  };
  const finishPlacement = () => {
    const current = previewRef.current;
    if (current && (current.valid || freeMode)) onChange(rebuildBoardGeometry({ ...board, pieces: board.pieces.map((piece) => piece.id === current.piece.id ? current.piece : piece) }));
    previewRef.current = null;
    setPreview(null);
  };
  const rotate = () => {
    if (!selected || selected.locked && !selected.incremental || !canRotatePiece(selected, optimizerSettings)) return;
    const rotated = { ...selected, length: selected.width, width: selected.length, rotated: !selected.rotated };
    const validation = validatePiecePlacement(rotated, board.pieces, board);
    if (validation.valid || freeMode) onChange(rebuildBoardGeometry({ ...board, pieces: board.pieces.map((piece) => piece.id === selected.id ? rotated : piece) }));
    else setPreview({ piece: rotated, ...validation });
  };
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") { setSelectedId(null); setPreview(null); previewRef.current = null; }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
  const rotationAllowed = selected && !(selected.locked && !selected.incremental) && canRotatePiece(selected, optimizerSettings) && (freeMode || validatePiecePlacement({ ...selected, length: selected.width, width: selected.length }, board.pieces, board).valid);
  const boardOptions = boards.map((item, index) => ({ index, label: item.label })).filter((option) => option.index !== boardIndex);

  return <article className={`board-card board-editor${freeMode ? " free-edit" : ""}`}>
    <div className="board-heading"><b>{board.label}</b><span>{board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0) / board.usableArea * 100 || 0}% · {issuesByPiece && Object.values(issuesByPiece).filter(Boolean).length ? "Revisar" : "Edición manual"}</span></div>
    <PieceManipulator piece={selected} canRotate={rotationAllowed} onRotate={rotate} onUnplace={freeMode && selected ? () => onUnplace(selected.id, boardIndex) : null} boardOptions={freeMode ? boardOptions : []} onMoveBoard={(target) => onMovePiece(selected.id, boardIndex, target)} validationMessage={preview?.valid === false ? preview.reason : ""} />
    <div className="board-layout editing" ref={boardRef}><div className="board-inner" style={{ aspectRatio: `${board.lengthCm} / ${board.widthCm}` }}>
      {displayedPieces.map((piece) => <EditablePiece key={piece.id} piece={piece} board={board} boardRef={boardRef} selected={piece.id === selectedId} invalid={piece.id === preview?.piece.id && !preview.valid} issues={issuesByPiece[piece.id] || []} onSelect={setSelectedId} onDragMove={previewPlacement} onDragEnd={finishPlacement} />)}
    </div></div>
  </article>;
}
