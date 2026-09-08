const finite = (value) => Number.isFinite(value) ? value : 0;

/**
 * Creates a structural component. A component is deliberately smaller than a
 * cut piece: sourcePieceIds link to the existing manufacturing representation.
 */
export function createComponent({ id, type, role = type, material = "none", dimensions = null, position = null, parentId = null, manufacturable = false, sourcePieceIds = [], metadata = {} }) {
  return {
    id, type, role, material,
    dimensions: dimensions && {
      widthCm: finite(dimensions.widthCm), heightCm: finite(dimensions.heightCm), depthCm: finite(dimensions.depthCm),
    },
    position,
    parentId,
    manufacturable: Boolean(manufacturable),
    sourcePieceIds: [...sourcePieceIds],
    metadata: { ...metadata },
  };
}

export function componentFromPiece({ id, type = "panel", role, piece, parentId = null, metadata = {} }) {
  return createComponent({
    id, type, role, parentId, manufacturable: true, material: piece.material?.id ?? "none", sourcePieceIds: [piece.id],
    // The cut list only has two planar dimensions. Thickness comes from its existing material.
    dimensions: { widthCm: piece.length, heightCm: (piece.material?.thicknessMm ?? 0) / 10, depthCm: piece.width },
    metadata: { grainRequired: piece.grainRequired, edgeBanding: piece.edgeBanding, ...metadata },
  });
}
