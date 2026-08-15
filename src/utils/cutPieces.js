import { MATERIALS } from "./materials.js";
import { calculateBackPanelDimensions } from "./backPanel.js";
import { calculateDrawerBottomDimensions } from "./drawerBottom.js";
import { calculateDrawerSlideDimensions } from "./drawerSlides.js";
import { calculateDrawerFrontDimensions } from "./drawerFront.js";
import { calculateNightstandStructure } from "./nightstandStructure.js";
import { calculateDeskStructure } from "./deskStructure.js";

export const MELAMINE_BOARD = { lengthCm: 275, widthCm: 185, thicknessMm: 15, price: 605 };
const safe = (value) => Math.max(0, Number(value.toFixed(2)));

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

const addDrawerPieces = (pieces, quantity, boxWidth, boxFrontHeight, drawerDepth, melamine, hardboard, thicknessCm, drawerFrontConfig) => {
  const sideHeight = Math.max(8, boxFrontHeight - 2);
  const innerWidth = Math.max(8, boxWidth - thicknessCm * 2);
  const front = calculateDrawerFrontDimensions({ boxWidthCm: boxWidth, boxFrontHeightCm: boxFrontHeight, drawerFrontConfig });
  const bottom = calculateDrawerBottomDimensions({
    externalWidth: boxWidth,
    externalDepth: drawerDepth,
    internalWidth: innerWidth,
    internalDepth: Math.max(0, drawerDepth - thicknessCm * 2),
    panelThickness: thicknessCm,
    bottomThickness: hardboard.thicknessMm / 10,
  });
  addPieces(pieces, "Frente de cajón", quantity, front.widthCm, front.heightCm, melamine);
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
export function getCutPieces({ furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves, materialConfigs, drawerSlideConfig, drawerFrontConfig, nightstandStructureConfig, deskConfig }) {
  const pieces = [];
  const melamine = materialConfigs?.melamine || MATERIALS.MELAMINE;
  const hardboard = materialConfigs?.hardboard || MATERIALS.HARDBOARD;
  const thicknessCm = melamine.thicknessMm / 10;
  const innerWidth = widthCm - thicknessCm * 2;
  const innerHeight = heightCm - thicknessCm * 2;
  const drawerDimensions = calculateDrawerSlideDimensions({ furnitureType, widthCm, depthCm, drawers, thicknessCm, drawerSlideConfig, deskConfig });
  if (!drawerDimensions.hasEnoughDepth) return [];
  const nightstandStructure = calculateNightstandStructure({
    widthCm, heightCm, depthCm, thicknessCm, drawers, drawerFrontConfig, structureConfig: nightstandStructureConfig,
  });
  const deskStructure = calculateDeskStructure({
    widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm: hardboard.thicknessMm / 10,
    drawers, drawerDimensions, deskConfig,
  });
  if (furnitureType === "nightstand" && !nightstandStructure.valid) return [];
  if (furnitureType === "desk" && !deskStructure.valid) return [];
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

  if (furnitureType === "catHouse") {
    addPieces(pieces, "Lateral izquierdo", 1, heightCm - thicknessCm * 2, depthCm, melamine);
    addPieces(pieces, "Lateral derecho", 1, heightCm - thicknessCm * 2, depthCm, melamine);
    addPieces(pieces, "Base", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Fondo trasero", 1, widthCm, heightCm, hardboard, {
      location: "Parte posterior exterior",
      installation: "Clavado por la parte posterior",
      mounting: "external",
    });
  } else if (furnitureType === "desk") {
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Lateral izquierdo", 1, deskStructure.legHeightCm, depthCm, melamine);
    addPieces(pieces, "Lateral derecho", 1, deskStructure.legHeightCm, depthCm, melamine);
    addPieces(pieces, "Travesaño trasero", 1, innerWidth, deskStructure.rearCrossbarHeightCm, melamine, {
      mounting: "structural-rear", location: "Parte posterior bajo la tapa", installation: "Atornillado entre ambos laterales",
    });
    if (drawers > 0) {
      addPieces(pieces, "Divisor módulo de cajones", 1, deskStructure.legHeightCm, depthCm - thicknessCm, melamine);
      addPieces(pieces, "Refuerzo inferior módulo de cajones", 1, deskStructure.drawerOpeningWidthCm, deskStructure.moduleBraceHeightCm, melamine, {
        mounting: "structural-module", location: "Parte frontal inferior del módulo", installation: "Atornillado entre lateral y divisor",
      });
      const bottom = calculateDrawerBottomDimensions({
        externalWidth: drawerDimensions.externalWidthCm,
        externalDepth: deskStructure.drawerDepthCm,
        panelThickness: thicknessCm,
        bottomThickness: hardboard.thicknessMm / 10,
      });
      const frontNames = ["Frente cajón superior", "Frente cajón central", "Frente cajón inferior"];
      for (let index = 0; index < drawers; index += 1) {
        addPieces(pieces, frontNames[index] || `Frente cajón ${index + 1}`, 1, deskStructure.drawerFrontWidthCm, deskStructure.drawerFrontHeightCm, melamine);
      }
      addPieces(pieces, "Lateral izquierdo de cajón", drawers, deskStructure.drawerDepthCm, deskStructure.drawerSideHeightCm, melamine);
      addPieces(pieces, "Lateral derecho de cajón", drawers, deskStructure.drawerDepthCm, deskStructure.drawerSideHeightCm, melamine);
      addPieces(pieces, "Parte trasera de cajón", drawers, drawerDimensions.backWidthCm, deskStructure.drawerSideHeightCm, melamine);
      addPieces(pieces, "Base de cartón prensado del cajón", drawers, bottom.width, bottom.depth, hardboard, {
        location: bottom.location, installation: bottom.installation, mounting: bottom.mounting,
      });
    }
  } else if (furnitureType === "tvStand") {
    const drawerWidth = drawers > 0 ? Math.min(widthCm * 0.38, 72) : 0;
    const storageHeight = heightCm * 0.48;
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm, melamine);
    addPieces(pieces, "Laterales", 2, innerHeight, depthCm, melamine);
    addBackPanel();
    addPieces(pieces, "División horizontal", 1, innerWidth, depthCm - thicknessCm, melamine);
    addPieces(pieces, "Puertas", doors, (widthCm - drawerWidth - thicknessCm * 2) / doors, storageHeight - thicknessCm * 2, melamine);
    if (drawers > 0) addDrawerPieces(pieces, drawers, drawerDimensions.externalWidthCm, storageHeight / drawers - 1.2, drawerDimensions.sideLengthCm, melamine, hardboard, thicknessCm, drawerFrontConfig);
    if (shelves > 0) addPieces(pieces, "Repisas del nicho", shelves, innerWidth, depthCm - thicknessCm, melamine);
  } else if (furnitureType === "nightstand") {
    addPieces(pieces, "Tapa superior", 1, widthCm, nightstandStructure.topDepthCm, melamine);
    addPieces(pieces, "Laterales", 2, heightCm - thicknessCm, depthCm, melamine);
    if (nightstandStructure.config.rearEnabled) addPieces(pieces, "Travesaño trasero inferior", 1, innerWidth, nightstandStructure.rearHeightCm, melamine);
    if (nightstandStructure.config.frontEnabled) addPieces(
      pieces,
      "Travesaño frontal inferior",
      1,
      innerWidth,
      nightstandStructure.frontHeightCm,
      melamine,
      {
        mounting: "structural-front",
        location: "Parte frontal inferior, entre laterales",
        installation: `Altura estructural: ${nightstandStructure.frontHeightCm} cm · Separación mínima: ${nightstandStructure.safetyGapCm} cm`,
        structuralHeightCm: nightstandStructure.frontHeightCm,
      },
    );
    addBackPanel();
    if (drawers > 0) {
      const boxWidth = drawerDimensions.externalWidthCm;
      const innerDrawerWidth = Math.max(8, boxWidth - thicknessCm * 2);
      const bottom = calculateDrawerBottomDimensions({
        externalWidth: boxWidth,
        externalDepth: drawerDimensions.sideLengthCm,
        internalWidth: innerDrawerWidth,
        internalDepth: Math.max(0, drawerDimensions.sideLengthCm - thicknessCm * 2),
        panelThickness: thicknessCm,
        bottomThickness: hardboard.thicknessMm / 10,
      });
      addPieces(pieces, "Frente de cajón", drawers, nightstandStructure.drawerFrontWidthCm, nightstandStructure.drawerFrontHeightCm, melamine);
      addPieces(pieces, "Lateral izquierdo de cajón", drawers, drawerDimensions.sideLengthCm, nightstandStructure.drawerSideHeightCm, melamine);
      addPieces(pieces, "Lateral derecho de cajón", drawers, drawerDimensions.sideLengthCm, nightstandStructure.drawerSideHeightCm, melamine);
      addPieces(pieces, "Parte trasera de cajón", drawers, innerDrawerWidth, nightstandStructure.drawerSideHeightCm, melamine);
      addPieces(pieces, "Base de cartón prensado del cajón", drawers, bottom.width, bottom.depth, hardboard, {
        location: bottom.location, installation: bottom.installation, mounting: bottom.mounting,
      });
    }
    else addPieces(pieces, "Repisa interior", 1, innerWidth, depthCm - thicknessCm, melamine);
  } else {
    addPieces(pieces, "Laterales", 2, heightCm, depthCm, melamine);
    addPieces(pieces, "Tapa y base", 2, widthCm, depthCm, melamine);
    addBackPanel();
    addPieces(pieces, "Puertas", doors, widthCm / doors, heightCm, melamine);
    addPieces(pieces, "Repisas", shelves, widthCm - 10, depthCm, melamine);
    if (drawers > 0) addDrawerPieces(pieces, drawers, drawerDimensions.externalWidthCm, Math.min(25, innerHeight / Math.max(drawers, 1) - 1), drawerDimensions.sideLengthCm, melamine, hardboard, thicknessCm, drawerFrontConfig);
  }
  return pieces;
}

export const getFurnitureLabel = (type) => ({ wardrobe: "Ropero", desk: "Escritorio", tvStand: "Mueble TV", nightstand: "Mesa de noche", catHouse: "Casa para Gatos" }[type] || "Mueble");
