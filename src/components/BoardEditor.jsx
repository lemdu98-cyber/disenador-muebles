import { useMemo, useRef, useState } from "react";
import EditablePiece from "./EditablePiece";
import PieceManipulator from "./PieceManipulator";
import { snapPiecePosition } from "../utils/editor/SnapEngine";
import { rebuildBoardGeometry, validatePiecePlacement } from "../utils/editor/BoardValidator";
import { canRotatePiece } from "../utils/optimizer/grainEngine";

export default function BoardEditor({ board, onChange, optimizerSettings }) {
  const boardRef = useRef(null);
  const previewRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [preview, setPreview] = useState(null);
  const selected = board.pieces.find((piece) => piece.id === selectedId) || null;
  const displayedPieces = useMemo(() => board.pieces.map((piece) => piece.id === preview?.piece.id ? preview.piece : piece), [board.pieces, preview]);

  const previewPlacement = (nextPiece, rect) => {
    const thresholdCm = Math.max(board.lengthCm / rect.width, board.widthCm / rect.height) * 8;
    const snapped = snapPiecePosition(nextPiece, board.pieces, board, thresholdCm);
    const validation = validatePiecePlacement(snapped, board.pieces, board);
    const nextPreview = { piece: snapped, ...validation };
    previewRef.current = nextPreview;
    setPreview(nextPreview);
  };
  const finishPlacement = () => {
    const currentPreview = previewRef.current;
    if (currentPreview?.valid) {
      onChange(rebuildBoardGeometry({
        ...board,
        pieces: board.pieces.map((piece) => piece.id === currentPreview.piece.id ? currentPreview.piece : piece),
      }));
    }
    previewRef.current = null;
    setPreview(null);
  };
  const rotate = () => {
    if (!selected || !canRotatePiece(selected, optimizerSettings)) return;
    const rotated = { ...selected, length: selected.width, width: selected.length, rotated: !selected.rotated };
    const validation = validatePiecePlacement(rotated, board.pieces, board);
    if (validation.valid) onChange(rebuildBoardGeometry({ ...board, pieces: board.pieces.map((piece) => piece.id === selected.id ? rotated : piece) }));
    else {
      const nextPreview = { piece: rotated, ...validation };
      previewRef.current = nextPreview;
      setPreview(nextPreview);
    }
  };
  const rotationAllowed = selected && canRotatePiece(selected, optimizerSettings) &&
    validatePiecePlacement({ ...selected, length: selected.width, width: selected.length }, board.pieces, board).valid;

  return <article className="board-card board-editor">
    <div className="board-heading"><b>{board.label}</b><span>Edición manual</span></div>
    <PieceManipulator piece={selected} canRotate={rotationAllowed} onRotate={rotate} validationMessage={preview?.valid === false ? preview.reason : ""} />
    <div className="board-layout editing" ref={boardRef}><div className="board-inner" style={{ aspectRatio: `${board.lengthCm} / ${board.widthCm}` }}>
      {displayedPieces.map((piece) => <EditablePiece
        key={piece.id}
        piece={piece}
        board={board}
        boardRef={boardRef}
        selected={piece.id === selectedId}
        invalid={piece.id === preview?.piece.id && !preview.valid}
        onSelect={setSelectedId}
        onDragMove={previewPlacement}
        onDragEnd={finishPlacement}
      />)}
    </div></div>
  </article>;
}
