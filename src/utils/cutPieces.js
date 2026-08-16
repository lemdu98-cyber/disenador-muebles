import { MATERIALS } from "./materials.js";
import { calculateBackPanelDimensions } from "./backPanel.js";
import { calculateDrawerBottomDimensions } from "./drawerBottom.js";
import { calculateDrawerSlideDimensions } from "./drawerSlides.js";
import { calculateDrawerFrontDimensions } from "./drawerFront.js";
import { calculateNightstandStructure } from "./nightstandStructure.js";
import { calculateDeskStructure } from "./deskStructure.js";
import { calculateTvStandStructure } from "./tvStandStructure.js";
import { calculateWardrobeStructure } from "./wardrobeStructure.js";

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

/** Complete manufacturing list. Dimensions are centimetres and each piece owns its material. */
export function getCutPieces({ furnitureType, widthCm, heightCm, depthCm, drawers, shelves, materialConfigs, drawerSlideConfig, drawerFrontConfig, nightstandStructureConfig, deskConfig, tvStandConfig, wardrobeConfig }) {
  const pieces = [];
  const melamine = materialConfigs?.melamine || MATERIALS.MELAMINE;
  const hardboard = materialConfigs?.hardboard || MATERIALS.HARDBOARD;
  const thicknessCm = melamine.thicknessMm / 10;
  const innerWidth = widthCm - thicknessCm * 2;
  const innerHeight = heightCm - thicknessCm * 2;
  const effectiveDrawers = furnitureType === "tvStand" ? 0 : drawers;
  const drawerDimensions = calculateDrawerSlideDimensions({ furnitureType, widthCm, depthCm, drawers: effectiveDrawers, thicknessCm, drawerSlideConfig, deskConfig, wardrobeConfig });
  if (!drawerDimensions.hasEnoughDepth) return [];
  const nightstandStructure = calculateNightstandStructure({
    widthCm, heightCm, depthCm, thicknessCm, drawers, drawerFrontConfig, structureConfig: nightstandStructureConfig,
  });
  const deskStructure = calculateDeskStructure({
    widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm: hardboard.thicknessMm / 10,
    drawers, drawerDimensions, deskConfig,
  });
  const tvStandStructure = calculateTvStandStructure({ widthCm, heightCm, depthCm, thicknessCm, tvStandConfig });
  const wardrobeStructure = calculateWardrobeStructure({ widthCm, heightCm, depthCm, thicknessCm, bottomThicknessCm: hardboard.thicknessMm / 10, drawers, shelves, drawerDimensions, wardrobeConfig });
  if (furnitureType === "nightstand" && !nightstandStructure.valid) return [];
  if (furnitureType === "desk" && !deskStructure.valid) return [];
  if (furnitureType === "tvStand" && !tvStandStructure.valid) return [];
  if (furnitureType === "wardrobe" && !wardrobeStructure.valid) return [];
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
    const structure = tvStandStructure;
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Lateral izquierdo", 1, structure.sideHeightCm, depthCm, melamine);
    addPieces(pieces, "Lateral derecho", 1, structure.sideHeightCm, depthCm, melamine);
    addPieces(pieces, "Base inferior", 1, structure.innerWidthCm, depthCm, melamine);
    if (structure.config.dividerEnabled) addPieces(pieces, "Divisor vertical central", 1, structure.dividerHeightCm, structure.shelfDepthCm, melamine);
    if (structure.config.dividerEnabled) {
      addPieces(pieces, "Repisa izquierda", 1, structure.shelfSpanCm, structure.shelfDepthCm, melamine);
      addPieces(pieces, "Repisa derecha", 1, structure.shelfSpanCm, structure.shelfDepthCm, melamine);
      addPieces(pieces, "Soporte vertical izquierdo", 1, structure.supportHeightCm, structure.supportDepthCm, melamine);
      addPieces(pieces, "Soporte vertical derecho", 1, structure.supportHeightCm, structure.supportDepthCm, melamine);
    } else addPieces(pieces, "Repisa interior", 1, structure.shelfSpanCm, structure.shelfDepthCm, melamine);
    if (structure.config.upperRearEnabled) addPieces(pieces, "Travesaño trasero superior", 1, structure.innerWidthCm, structure.upperRearHeightCm, melamine);
    if (structure.config.lowerRearEnabled) addPieces(pieces, "Travesaño trasero inferior", 1, structure.innerWidthCm, structure.lowerRearHeightCm, melamine);
    addPieces(pieces, "Fondo trasero completo", 1, widthCm, heightCm, hardboard, {
      mounting: "external-rear",
      location: "Parte posterior exterior completa",
      installation: "Clavado sobre todo el perímetro posterior",
    });
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
    const s = wardrobeStructure;
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine);
    addPieces(pieces, "Lateral izquierdo", 1, s.sideHeightCm, depthCm, melamine);
    addPieces(pieces, "Lateral derecho", 1, s.sideHeightCm, depthCm, melamine);
    addPieces(pieces, "Divisor vertical Cuerpo 1 / Cuerpo 2", 1, s.sideHeightCm, depthCm, melamine);
    addPieces(pieces, "Divisor vertical Cuerpo 2 / Cuerpo 3", 1, s.sideHeightCm, depthCm, melamine);
    for (let body = 1; body <= 3; body += 1) {
      addPieces(pieces, `Travesaño frontal inferior Cuerpo ${body}`, 1, s.openingWidthCm, s.lowerCrossbarHeightCm, melamine, { mounting: "structural-front", location: `Parte frontal inferior del Cuerpo ${body}`, installation: "Atornillado entre paneles verticales y apoyado al piso" });
      addPieces(pieces, `Travesaño trasero inferior Cuerpo ${body}`, 1, s.openingWidthCm, s.lowerCrossbarHeightCm, melamine, { mounting: "structural-rear", location: `Parte trasera inferior del Cuerpo ${body}`, installation: "Atornillado entre paneles verticales, delante del fondo" });
      addPieces(pieces, `Repisa superior Cuerpo ${body}`, 1, s.openingWidthCm, depthCm - thicknessCm, melamine);
      addPieces(pieces, `Puerta Cuerpo ${body}`, 1, s.doorHeightCm, s.doorWidthCm, melamine);
      addPieces(pieces, `Fondo cartón prensado Cuerpo ${body}`, 1, s.backLayouts[body - 1].widthCm, heightCm, hardboard, { mounting: "external-rear", location: `Parte posterior exterior del Cuerpo ${body}`, installation: "Clavado sobre el perímetro posterior correspondiente" });
    }
    addPieces(pieces, "Repisa sobre cajones Cuerpo 1", 1, s.openingWidthCm, depthCm - thicknessCm, melamine);
    addPieces(pieces, "Repisa intermedia 1 Cuerpo 1", 1, s.openingWidthCm, depthCm - thicknessCm, melamine);
    addPieces(pieces, "Repisa intermedia 2 Cuerpo 1", 1, s.openingWidthCm, depthCm - thicknessCm, melamine);
    addPieces(pieces, "Repisa sobre cajones Cuerpo 3", 1, s.openingWidthCm, depthCm - thicknessCm, melamine);
    for (let shelf = 1; shelf <= shelves; shelf += 1) addPieces(pieces, `Repisa zapatos ${shelf} Cuerpo 2`, 1, s.openingWidthCm, depthCm - thicknessCm, melamine);
    const front = calculateDrawerFrontDimensions({ boxWidthCm: s.drawerBoxWidthCm, boxFrontHeightCm: s.drawerFrontHeightCm, drawerFrontConfig });
    const bottom = calculateDrawerBottomDimensions({ externalWidth: s.drawerBoxWidthCm, externalDepth: s.drawerDepthCm, panelThickness: thicknessCm, bottomThickness: hardboard.thicknessMm / 10 });
    for (const body of [1, 3]) for (let drawer = 1; drawer <= 3; drawer += 1) {
      addPieces(pieces, `Frente Cajón ${drawer} Cuerpo ${body}`, 1, front.widthCm, front.heightCm, melamine);
      addPieces(pieces, `Lateral izquierdo Cajón ${drawer} Cuerpo ${body}`, 1, s.drawerDepthCm, s.drawerSideHeightCm, melamine);
      addPieces(pieces, `Lateral derecho Cajón ${drawer} Cuerpo ${body}`, 1, s.drawerDepthCm, s.drawerSideHeightCm, melamine);
      addPieces(pieces, `Parte trasera Cajón ${drawer} Cuerpo ${body}`, 1, s.drawerBackWidthCm, s.drawerSideHeightCm, melamine);
      addPieces(pieces, `Base cartón prensado Cajón ${drawer} Cuerpo ${body}`, 1, bottom.width, bottom.depth, hardboard, { location: bottom.location, installation: bottom.installation, mounting: bottom.mounting });
    }
  }
  return pieces;
}

export const getFurnitureLabel = (type) => ({ wardrobe: "Ropero", desk: "Escritorio", tvStand: "Mueble TV", nightstand: "Mesa de noche", catHouse: "Casa para Gatos" }[type] || "Mueble");
