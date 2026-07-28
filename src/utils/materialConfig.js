export const MATERIAL_IDS = {
  MELAMINE: "melamine",
  HARDBOARD: "hardboard",
};

export const DEFAULT_MATERIAL_CONFIG = {
  [MATERIAL_IDS.MELAMINE]: {
    id: MATERIAL_IDS.MELAMINE,
    label: "Melamina",
    boardLabel: "Placa Melamina",
    widthCm: 185,
    lengthCm: 275,
    thicknessMm: 15,
    price: 605,
    color: "#8b5a2b",
  },
  [MATERIAL_IDS.HARDBOARD]: {
    id: MATERIAL_IDS.HARDBOARD,
    label: "Cartón prensado",
    boardLabel: "Placa Cartón",
    widthCm: 185,
    lengthCm: 275,
    thicknessMm: 3,
    price: 85,
    color: "#b98b5d",
  },
};

export const MATERIAL_ORDER = [MATERIAL_IDS.MELAMINE, MATERIAL_IDS.HARDBOARD];

export function createMaterialConfig() {
  return Object.fromEntries(
    MATERIAL_ORDER.map((id) => [id, { ...DEFAULT_MATERIAL_CONFIG[id] }]),
  );
}
