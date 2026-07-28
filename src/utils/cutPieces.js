import { MATERIALS } from "./materials";
import { calculateBackPanelDimensions } from "./backPanel";
import { calculateDrawerBottomDimensions } from "./drawerBottom";

export const MELAMINE_BOARD = { lengthCm: 275, widthCm: 185, thicknessMm: 15, price: 605 };
const safe = (value) => Math.max(0, Number(value.toFixed(1)));

const addPieces = (pieces, name, quantity, length, width, material, details = {}) => {
  for (let index = 0; index < quantity; index += 1) {
    const safeLength = safe(length);
    const safeWidth = safe(width);
    pieces.push({
      id: `${material.id}-${name}-${index + 1}`,
      name,
      length: safeLength,
      width: safeWidth,
      areaCm2: safeLength * safeWidth,
      material,
      grainDirection: "free",
      ...details,
    });
  }
};

const addDrawerPieces = (pieces, quantity, frontWidth, frontHeight, drawerDepth, melamine, hardboard, thicknessCm) => {
  const sideHeight = Math.max(8, frontHeight - 2);
  const innerWidth = Math.max(8, frontWidth - thicknessCm * 2);
  const bottom = calculateDrawerBottomDimensions({
    externalWidth: frontWidth,
    externalDepth: drawerDepth,
    internalWidth: innerWidth,
    internalDepth: Math.max(0, drawerDepth - thicknessCm * 2),
    panelThickness: thicknessCm,
    bottomThickness: hardboard.thicknessMm / 10,
  });
  addPieces(pieces, "Frente de cajón", quantity, frontWidth, frontHeight, melamine);
  addPieces(pieces, "Lateral izquierdo de cajón", quantity, drawerDepth, sideHeight, melamine);
  addPieces(pieces, "Lateral derecho de cajón", quantity, drawerDepth, sideHeight, melamine);
  addPieces(pieces, "Parte trasera de cajón", quantity, innerWidth, sideHeight, melamine);
  addPieces(
    pieces,
    "Base de cartón prensado del cajón",
    quantity,
    bottom.width,
    bottom.depth,
    hardboard,
    { location: bottom.location, installation: bottom.installation, mounting: bottom.mounting },
  );
};

/** Complete manufacturing list. Dimensions are centimetres and each piece owns its material. */
export function getCutPieces({ furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves, materialConfigs }) {
  const pieces = [];
  const melamine = materialConfigs?.melamine || MATERIALS.MELAMINE;
  const hardboard = materialConfigs?.hardboard || MATERIALS.HARDBOARD;
  const thicknessCm = melamine.thicknessMm / 10;
  const innerWidth = widthCm - thicknessCm * 2;
  const innerHeight = heightCm - thicknessCm * 2;
  const backPanel = calculateBackPanelDimensions({
    externalWidth: widthCm,
    externalHeight: heightCm,
    innerWidth,
    innerHeight,
    panelThickness: thicknessCm,
    backPanelThickness: hardboard.thicknessMm / 10,
    hasTop: true,
    hasBottom: furnitureType !== "nightstand" && furnitureType !== "desk",
    constructionMode: "external",
    furnitureDepth: depthCm,
  });
  const addBackPanel = () => addPieces(
    pieces,
    "Fondo de cartón prensado",
    1,
    backPanel.width,
    backPanel.height,
    hardboard,
    { location: backPanel.location, installation: backPanel.installation, mounting: backPanel.mounting },
  );

  if (furnitureType === "desk") {
    const columnWidth = Math.min(widthCm * 0.3, 48);
    const drawerDepth = depthCm * 0.78;
    addPieces(pieces, "Tapa", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Patas laterales", 2, heightCm - thicknessCm, depthCm, melamine);
    addPieces(pieces, "Faldón posterior", 1, widthCm - 16, 22, melamine);
    addBackPanel();
    if (drawers > 0) {
      addPieces(pieces, "Laterales de cajonera", 2, heightCm - thicknessCm, drawerDepth, melamine);
      addDrawerPieces(pieces, drawers, columnWidth - thicknessCm * 2, Math.min(22, (heightCm - thicknessCm - 8) / drawers), drawerDepth - thicknessCm, melamine, hardboard, thicknessCm);
    }
  } else if (furnitureType === "tvStand") {
    const drawerWidth = drawers > 0 ? Math.min(widthCm * 0.38, 72) : 0;
    const storageHeight = heightCm * 0.48;
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm, melamine);
    addPieces(pieces, "Laterales", 2, innerHeight, depthCm, melamine);
    addBackPanel();
    addPieces(pieces, "División horizontal", 1, innerWidth, depthCm - thicknessCm, melamine);
    addPieces(pieces, "Puertas", doors, (widthCm - drawerWidth - thicknessCm * 2) / doors, storageHeight - thicknessCm * 2, melamine);
    if (drawers > 0) addDrawerPieces(pieces, drawers, drawerWidth - 1.2, storageHeight / drawers - 1.2, depthCm - thicknessCm * 2, melamine, hardboard, thicknessCm);
    if (shelves > 0) addPieces(pieces, "Repisas del nicho", shelves, innerWidth, depthCm - thicknessCm, melamine);
  } else if (furnitureType === "nightstand") {
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Laterales", 2, heightCm - thicknessCm, depthCm, melamine);
    addBackPanel();
    if (drawers > 0) addDrawerPieces(pieces, drawers, innerWidth - 1.2, (innerHeight - 4.5) / drawers, depthCm - thicknessCm * 2, melamine, hardboard, thicknessCm);
    else addPieces(pieces, "Repisa interior", 1, innerWidth, depthCm - thicknessCm, melamine);
  } else {
    addPieces(pieces, "Laterales", 2, heightCm, depthCm, melamine);
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm, melamine);
    addBackPanel();
    addPieces(pieces, "Puertas", doors, widthCm / doors, heightCm, melamine);
    addPieces(pieces, "Repisas", shelves, widthCm - 10, depthCm, melamine);
    if (drawers > 0) addDrawerPieces(pieces, drawers, widthCm * .5, Math.min(25, innerHeight / Math.max(drawers, 1) - 1), depthCm - thicknessCm * 2, melamine, hardboard, thicknessCm);
  }
  return pieces;
}

export const getFurnitureLabel = (type) => ({ wardrobe: "Ropero", desk: "Escritorio", tvStand: "Mueble TV", nightstand: "Mesa de noche" }[type] || "Mueble");
