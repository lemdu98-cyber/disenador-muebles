export const MATERIALS = {
  MELAMINE: { id: "melamine", label: "Melamina", thicknessMm: 15, color: "#8b5a2b", optimizable: true, costed: true },
  HARDBOARD: { id: "hardboard", label: "Cartón prensado", thicknessMm: 3, color: "#b98b5d", optimizable: false, costed: false },
};

export const isMelaminePiece = (piece) => piece.material?.id === MATERIALS.MELAMINE.id;
