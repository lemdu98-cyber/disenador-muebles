import { getCutPieces, getFurnitureLabel } from "./cutPieces";

export const FURNITURE_TYPES = ["wardrobe", "desk", "tvStand", "nightstand", "catHouse"];

const DEFAULT_ORDER_DIMENSIONS = {
  wardrobe: { widthCm: 250, heightCm: 230, depthCm: 60, doors: 3, drawers: 6, shelves: 3 },
  desk: { widthCm: 140, heightCm: 75, depthCm: 60, doors: 2, drawers: 3, shelves: 3 },
  tvStand: { widthCm: 180, heightCm: 55, depthCm: 45, doors: 0, drawers: 0, shelves: 0 },
  nightstand: { widthCm: 50, heightCm: 55, depthCm: 40, doors: 2, drawers: 2, shelves: 3 },
  catHouse: { widthCm: 40, heightCm: 40, depthCm: 40, doors: 2, drawers: 0, shelves: 3 },
};

export function createOrderItems(design) {
  return FURNITURE_TYPES.map((furnitureType) => ({
    furnitureType,
    label: getFurnitureLabel(furnitureType),
    quantity: 0,
    // Shared material/structural settings are copied, while every furniture type
    // starts with its own valid manufacturing dimensions.
    params: { ...design, ...DEFAULT_ORDER_DIMENSIONS[furnitureType], furnitureType },
  }));
}

export function getOrderPieces(orderItems, materialConfigs) {
  return orderItems.flatMap((item) => {
    if (!item.quantity) return [];
    return Array.from({ length: item.quantity }, (_, unit) => getCutPieces({ ...item.params, materialConfigs }).map((piece) => ({
      ...piece,
      id: `${item.furnitureType}-${unit + 1}-${piece.id}`,
      furnitureType: item.furnitureType,
      furnitureLabel: item.label,
      unit: unit + 1,
    }))).flat();
  });
}

export function groupPiecesByFurniture(orderItems, materialConfigs) {
  return orderItems.filter((item) => item.quantity).map((item) => {
    const pieces = getCutPieces({ ...item.params, materialConfigs });
    const groups = Object.values(pieces.reduce((result, piece) => {
      const key = `${piece.name}|${piece.length}|${piece.width}`;
      (result[key] ||= []).push(piece);
      return result;
    }, {}));
    return { ...item, groups };
  });
}

export function consolidatePieces(pieces) {
  return Object.values(pieces.reduce((result, piece) => {
    const length = Number(piece.length.toFixed(1));
    const width = Number(piece.width.toFixed(1));
    const key = `${piece.material.id}|${piece.material.thicknessMm}|${length}|${width}`;
    (result[key] ||= { length, width, quantity: 0, areaCm2: length * width, names: new Set(), material: piece.material });
    result[key].quantity += 1;
    result[key].names.add(piece.name);
    return result;
  }, {})).sort((a, b) => b.areaCm2 - a.areaCm2);
}
