import { getCutPieces, getFurnitureLabel } from "./cutPieces";

export const FURNITURE_TYPES = ["wardrobe", "desk", "tvStand", "nightstand"];

export function createOrderItems(design) {
  return FURNITURE_TYPES.map((furnitureType) => ({
    furnitureType,
    label: getFurnitureLabel(furnitureType),
    quantity: 0,
    // The current design is copied deliberately: future furniture types can carry their own parameters.
    params: { ...design, furnitureType },
  }));
}

export function getOrderPieces(orderItems) {
  return orderItems.flatMap((item) => {
    if (!item.quantity) return [];
    return Array.from({ length: item.quantity }, (_, unit) => getCutPieces(item.params).map((piece, index) => ({
      ...piece,
      id: `${item.furnitureType}-${unit + 1}-${index + 1}`,
      furnitureType: item.furnitureType,
      furnitureLabel: item.label,
      unit: unit + 1,
    }))).flat();
  });
}

export function groupPiecesByFurniture(orderItems) {
  return orderItems.filter((item) => item.quantity).map((item) => {
    const pieces = getCutPieces(item.params);
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
    const key = `${length}|${width}`;
    (result[key] ||= { length, width, quantity: 0, areaCm2: length * width, names: new Set() });
    result[key].quantity += 1;
    result[key].names.add(piece.name);
    return result;
  }, {})).sort((a, b) => b.areaCm2 - a.areaCm2);
}
