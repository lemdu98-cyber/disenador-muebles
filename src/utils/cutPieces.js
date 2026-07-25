export const MELAMINE_BOARD = {
  lengthCm: 275,
  widthCm: 185,
  thicknessMm: 15,
  price: 605,
};

const THICKNESS_CM = MELAMINE_BOARD.thicknessMm / 10;
const positive = (value) => Math.max(0, Number(value.toFixed(1)));

const addPieces = (pieces, name, quantity, length, width) => {
  const safeLength = positive(length);
  const safeWidth = positive(width);
  for (let index = 0; index < quantity; index += 1) {
    pieces.push({
      id: `${name}-${index + 1}`,
      name,
      length: safeLength,
      width: safeWidth,
      areaCm2: safeLength * safeWidth,
    });
  }
};

/** Returns the complete manufacturing cut list, in centimetres. */
export function getCutPieces({ furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves }) {
  const pieces = [];
  const innerWidth = widthCm - THICKNESS_CM * 2;
  const innerHeight = heightCm - THICKNESS_CM * 2;

  if (furnitureType === "desk") {
    const drawerColumnWidth = Math.min(widthCm * 0.3, 48);
    addPieces(pieces, "Tapa", 1, widthCm, depthCm);
    addPieces(pieces, "Patas laterales", 2, heightCm - THICKNESS_CM, depthCm);
    addPieces(pieces, "Faldón posterior", 1, widthCm - 16, 22);
    if (drawers > 0) {
      addPieces(pieces, "Laterales de cajonera", 2, heightCm - THICKNESS_CM, depthCm * 0.78);
      addPieces(pieces, "Frentes de cajón", drawers, drawerColumnWidth - THICKNESS_CM * 2, Math.min(22, (heightCm - THICKNESS_CM - 8) / drawers));
    }
  } else if (furnitureType === "tvStand") {
    const drawerWidth = drawers > 0 ? Math.min(widthCm * 0.38, 72) : 0;
    const storageHeight = heightCm * 0.48;
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm);
    addPieces(pieces, "Laterales", 2, innerHeight, depthCm);
    addPieces(pieces, "Fondo", 1, innerWidth, innerHeight);
    addPieces(pieces, "División horizontal", 1, innerWidth, depthCm - THICKNESS_CM);
    addPieces(pieces, "Puertas", doors, (widthCm - drawerWidth - THICKNESS_CM * 2) / doors, storageHeight - THICKNESS_CM * 2);
    if (drawers > 0) addPieces(pieces, "Frentes de cajón", drawers, drawerWidth - 1.2, storageHeight / drawers - 1.2);
    if (shelves > 0) addPieces(pieces, "Repisas del nicho", shelves, innerWidth, depthCm - THICKNESS_CM);
  } else if (furnitureType === "nightstand") {
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm);
    addPieces(pieces, "Laterales", 2, innerHeight, depthCm);
    addPieces(pieces, "Fondo", 1, innerWidth, innerHeight);
    if (drawers > 0) addPieces(pieces, "Frentes de cajón", drawers, innerWidth - 1.2, (innerHeight - 4.5) / drawers);
    else addPieces(pieces, "Repisa interior", 1, innerWidth, depthCm - THICKNESS_CM);
  } else {
    addPieces(pieces, "Laterales", 2, heightCm, depthCm);
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm);
    addPieces(pieces, "Puertas", doors, widthCm / doors, heightCm);
    addPieces(pieces, "Repisas", shelves, widthCm - 10, depthCm);
  }
  return pieces;
}

export const getFurnitureLabel = (type) => ({ wardrobe: "Ropero", desk: "Escritorio", tvStand: "Mueble TV", nightstand: "Mesa de noche" }[type] || "Mueble");
