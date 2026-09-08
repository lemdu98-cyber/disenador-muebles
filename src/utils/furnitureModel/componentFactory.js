const finite = (value) => Number.isFinite(value) ? value : 0;
const boundsFrom = (dimensions, position) => !dimensions || !position || ![dimensions.widthCm, dimensions.heightCm, dimensions.depthCm, position.xCm, position.yCm, position.zCm].every(Number.isFinite) ? null : { minX: position.xCm - dimensions.widthCm / 2, maxX: position.xCm + dimensions.widthCm / 2, minY: position.yCm - dimensions.heightCm / 2, maxY: position.yCm + dimensions.heightCm / 2, minZ: position.zCm - dimensions.depthCm / 2, maxZ: position.zCm + dimensions.depthCm / 2 };

/**
 * Creates a structural component. A component is deliberately smaller than a
 * cut piece: sourcePieceIds link to the existing manufacturing representation.
 */
export function createComponent({ id, type, role = type, material = "none", dimensions = null, position = null, bounds = null, parentId = null, manufacturable = false, sourcePieceIds = [], metadata = {} }) {
  return {
    id, type, role, material,
    dimensions: dimensions && {
      widthCm: finite(dimensions.widthCm), heightCm: finite(dimensions.heightCm), depthCm: finite(dimensions.depthCm),
    },
    position, bounds: bounds ? { ...bounds } : boundsFrom(dimensions, position),
    parentId,
    manufacturable: Boolean(manufacturable),
    sourcePieceIds: [...sourcePieceIds],
    metadata: { ...metadata },
  };
}

export function componentFromPiece({ id, type = "panel", role, piece, parentId = null, position = null, bounds = null, metadata = {} }) {
  return createComponent({
    id, type, role, parentId, manufacturable: true, material: piece.material?.id ?? "none", sourcePieceIds: [piece.id],
    // The cut list only has two planar dimensions. Thickness comes from its existing material.
    dimensions: { widthCm: piece.length, heightCm: (piece.material?.thicknessMm ?? 0) / 10, depthCm: piece.width }, position, bounds,
    metadata: { grainRequired: piece.grainRequired, edgeBanding: piece.edgeBanding, ...metadata },
  });
}
