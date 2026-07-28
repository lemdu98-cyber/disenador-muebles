import { DEFAULT_MATERIAL_CONFIG } from "./materialConfig";

export const MATERIALS = {
  MELAMINE: DEFAULT_MATERIAL_CONFIG.melamine,
  HARDBOARD: DEFAULT_MATERIAL_CONFIG.hardboard,
};

export const isMelaminePiece = (piece) => piece.material?.id === MATERIALS.MELAMINE.id;
