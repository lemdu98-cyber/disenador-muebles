import { MATERIALS } from "./materials";

export const MELAMINE_BOARD = { lengthCm: 275, widthCm: 185, thicknessMm: 15, price: 605 };
const THICKNESS_CM = MELAMINE_BOARD.thicknessMm / 10;
const safe = (value) => Math.max(0, Number(value.toFixed(1)));

const addPieces = (pieces, name, quantity, length, width, material = MATERIALS.MELAMINE) => {
  for (let index = 0; index < quantity; index += 1) {
    const safeLength = safe(length); const safeWidth = safe(width);
    pieces.push({ id: `${material.id}-${name}-${index + 1}`, name, length: safeLength, width: safeWidth, areaCm2: safeLength * safeWidth, material });
  }
};

const addDrawerPieces = (pieces, quantity, frontWidth, frontHeight, drawerDepth) => {
  const sideHeight = Math.max(8, frontHeight - 2);
  const innerWidth = Math.max(8, frontWidth - THICKNESS_CM * 2);
  addPieces(pieces, "Frente de cajón", quantity, frontWidth, frontHeight);
  addPieces(pieces, "Lateral izquierdo de cajón", quantity, drawerDepth, sideHeight);
  addPieces(pieces, "Lateral derecho de cajón", quantity, drawerDepth, sideHeight);
  addPieces(pieces, "Parte trasera de cajón", quantity, innerWidth, sideHeight);
  addPieces(pieces, "Base de cajón", quantity, innerWidth, drawerDepth, MATERIALS.HARDBOARD);
};

/** Complete manufacturing list. Dimensions are centimetres and each piece owns its material. */
export function getCutPieces({ furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves }) {
  const pieces = [];
  const innerWidth = widthCm - THICKNESS_CM * 2;
  const innerHeight = heightCm - THICKNESS_CM * 2;
  if (furnitureType === "desk") {
    const columnWidth = Math.min(widthCm * 0.3, 48);
    const drawerDepth = depthCm * 0.78;
    addPieces(pieces, "Tapa", 1, widthCm, depthCm);
    addPieces(pieces, "Patas laterales", 2, heightCm - THICKNESS_CM, depthCm);
    addPieces(pieces, "Faldón posterior", 1, widthCm - 16, 22);
    addPieces(pieces, "Fondo de cartón prensado", 1, columnWidth, heightCm - THICKNESS_CM, MATERIALS.HARDBOARD);
    if (drawers > 0) {
      addPieces(pieces, "Laterales de cajonera", 2, heightCm - THICKNESS_CM, drawerDepth);
      addDrawerPieces(pieces, drawers, columnWidth - THICKNESS_CM * 2, Math.min(22, (heightCm - THICKNESS_CM - 8) / drawers), drawerDepth - THICKNESS_CM);
    }
  } else if (furnitureType === "tvStand") {
    const drawerWidth = drawers > 0 ? Math.min(widthCm * 0.38, 72) : 0;
    const storageHeight = heightCm * 0.48;
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm);
    addPieces(pieces, "Laterales", 2, innerHeight, depthCm);
    addPieces(pieces, "Fondo de cartón prensado", 1, innerWidth, innerHeight, MATERIALS.HARDBOARD);
    addPieces(pieces, "División horizontal", 1, innerWidth, depthCm - THICKNESS_CM);
    addPieces(pieces, "Puertas", doors, (widthCm - drawerWidth - THICKNESS_CM * 2) / doors, storageHeight - THICKNESS_CM * 2);
    if (drawers > 0) addDrawerPieces(pieces, drawers, drawerWidth - 1.2, storageHeight / drawers - 1.2, depthCm - THICKNESS_CM * 2);
    if (shelves > 0) addPieces(pieces, "Repisas del nicho", shelves, innerWidth, depthCm - THICKNESS_CM);
  } else if (furnitureType === "nightstand") {
    // The nightstand rests on its two side panels: no melamine bottom is manufactured.
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm);
    addPieces(pieces, "Laterales", 2, heightCm - THICKNESS_CM, depthCm);
    addPieces(pieces, "Fondo de cartón prensado", 1, innerWidth, innerHeight, MATERIALS.HARDBOARD);
    if (drawers > 0) addDrawerPieces(pieces, drawers, innerWidth - 1.2, (innerHeight - 4.5) / drawers, depthCm - THICKNESS_CM * 2);
    else addPieces(pieces, "Repisa interior", 1, innerWidth, depthCm - THICKNESS_CM);
  } else {
    addPieces(pieces, "Laterales", 2, heightCm, depthCm);
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm);
    addPieces(pieces, "Fondo de cartón prensado", 1, innerWidth, innerHeight, MATERIALS.HARDBOARD);
    addPieces(pieces, "Puertas", doors, widthCm / doors, heightCm);
    addPieces(pieces, "Repisas", shelves, widthCm - 10, depthCm);
    if (drawers > 0) addDrawerPieces(pieces, drawers, widthCm * .5, Math.min(25, innerHeight / Math.max(drawers, 1) - 1), depthCm - THICKNESS_CM * 2);
  }
  return pieces;
}

export const getFurnitureLabel = (type) => ({ wardrobe: "Ropero", desk: "Escritorio", tvStand: "Mueble TV", nightstand: "Mesa de noche" }[type] || "Mueble");
