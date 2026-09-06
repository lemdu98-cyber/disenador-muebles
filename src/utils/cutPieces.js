import { MATERIALS } from "./materials.js";
import { calculateBackPanelDimensions } from "./backPanel.js";
import { calculateDrawerBottomDimensions } from "./drawerBottom.js";
import { calculateDrawerSlideDimensions } from "./drawerSlides.js";
import { calculateDrawerFrontDimensions } from "./drawerFront.js";
import { calculateNightstandStructure } from "./nightstandStructure.js";
import { calculateDeskStructure } from "./deskStructure.js";
import { calculateTvStandStructure } from "./tvStandStructure.js";
import { calculateWardrobeStructure } from "./wardrobeStructure.js";
import { resolveDrawerManufacturingWidth, snapCutDimensionWithConstraints, snapDistributedDimensions } from "./manufacturingGrid.js";
import { validateEdgeBanding } from "./edgeBanding.js";

export const MELAMINE_BOARD = { lengthCm: 275, widthCm: 185, thicknessMm: 15, price: 605 };
const addPieces = (pieces, name, quantity, length, width, material, details = {}) => {
  const { lengthStrategy = "nearest", widthStrategy = "nearest", maxLengthCm = Infinity, maxWidthCm = Infinity, grainRequired = false, idStart = 1, ...pieceDetails } = details;
  for (let index = 0; index < quantity; index += 1) {
    const safeLength = snapCutDimensionWithConstraints(length, { maxCm: maxLengthCm, preferredStrategy: lengthStrategy }) ?? 0;
    const safeWidth = snapCutDimensionWithConstraints(width, { maxCm: maxWidthCm, preferredStrategy: widthStrategy }) ?? 0;
    pieces.push({
      id: `${material.id}-${name}-${idStart + index}`,
      name,
      length: safeLength,
      width: safeWidth,
      areaCm2: safeLength * safeWidth,
      material,
      grainDirection: "free",
      grainRequired: material.id === "melamine" ? Boolean(grainRequired) : false,
      theoreticalLengthCm: length,
      theoreticalWidthCm: width,
      ...pieceDetails,
    });
  }
};

/** Complete manufacturing list. Dimensions are centimetres and each piece owns its material. */
export function getCutPieces({ furnitureType, widthCm, heightCm, depthCm, drawers, shelves, materialConfigs, drawerSlideConfig, drawerFrontConfig, nightstandStructureConfig, deskConfig, tvStandConfig, wardrobeConfig, edgeBanding = {} }) {
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
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine, { grainRequired: true });
    addPieces(pieces, "Lateral izquierdo", 1, deskStructure.legHeightCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: deskStructure.legHeightCm, grainRequired: true });
    addPieces(pieces, "Lateral derecho", 1, deskStructure.legHeightCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: deskStructure.legHeightCm, grainRequired: true });
    addPieces(pieces, "Travesaño trasero", 1, innerWidth, deskStructure.rearCrossbarHeightCm, melamine, {
      lengthStrategy: "floor", maxLengthCm: innerWidth,
      mounting: "structural-rear", location: "Parte posterior bajo la tapa", installation: "Atornillado entre ambos laterales",
    });
    if (drawers > 0) {
      addPieces(pieces, "Divisor módulo de cajones", 1, deskStructure.legHeightCm, depthCm - thicknessCm, melamine, { lengthStrategy: "floor", widthStrategy: "floor", maxLengthCm: deskStructure.legHeightCm, maxWidthCm: depthCm - thicknessCm });
      addPieces(pieces, "Refuerzo inferior módulo de cajones", 1, deskStructure.drawerOpeningWidthCm, deskStructure.moduleBraceHeightCm, melamine, {
        lengthStrategy: "floor", maxLengthCm: deskStructure.drawerOpeningWidthCm,
        mounting: "structural-module", location: "Parte frontal inferior del módulo", installation: "Atornillado entre lateral y divisor",
      });
      const drawerManufacturing = resolveDrawerManufacturingWidth({ openingWidthCm: deskStructure.drawerOpeningWidthCm, theoreticalBoxWidthCm: drawerDimensions.externalWidthCm, panelThicknessCm: thicknessCm, desiredClearanceCm: drawerDimensions.totalClearanceCm });
      if (!drawerManufacturing.valid) return [];
      const bottom = calculateDrawerBottomDimensions({
        externalWidth: drawerManufacturing.boxWidthCm,
        externalDepth: deskStructure.drawerDepthCm,
        panelThickness: thicknessCm,
        bottomThickness: hardboard.thicknessMm / 10,
      });
      const frontNames = ["Frente cajón superior", "Frente cajón central", "Frente cajón inferior"];
      for (let index = 0; index < drawers; index += 1) {
        addPieces(pieces, frontNames[index] || `Frente cajón ${index + 1}`, 1, deskStructure.drawerFrontWidthCm, deskStructure.drawerFrontHeightCm, melamine, { grainRequired: true });
      }
      addPieces(pieces, "Lateral izquierdo de cajón", drawers, deskStructure.drawerDepthCm, deskStructure.drawerSideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: deskStructure.drawerSideHeightCm });
      addPieces(pieces, "Lateral derecho de cajón", drawers, deskStructure.drawerDepthCm, deskStructure.drawerSideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: deskStructure.drawerSideHeightCm });
      addPieces(pieces, "Parte trasera de cajón", drawers, drawerManufacturing.backWidthCm, deskStructure.drawerSideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: deskStructure.drawerSideHeightCm, effectiveClearanceCm: drawerManufacturing.effectiveClearanceCm, clearanceDeltaCm: drawerManufacturing.clearanceDeltaCm });
      addPieces(pieces, "Base de cartón prensado del cajón", drawers, bottom.width, bottom.depth, hardboard, {
        location: bottom.location, installation: bottom.installation, mounting: bottom.mounting,
      });
    }
  } else if (furnitureType === "tvStand") {
    const structure = tvStandStructure;
    addPieces(pieces, "Tapa superior", 1, widthCm, depthCm, melamine, { grainRequired: true });
    addPieces(pieces, "Lateral izquierdo", 1, structure.sideHeightCm, depthCm, melamine, { grainRequired: true });
    addPieces(pieces, "Lateral derecho", 1, structure.sideHeightCm, depthCm, melamine, { grainRequired: true });
    addPieces(pieces, "Base inferior", 1, structure.innerWidthCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: structure.innerWidthCm });
    if (structure.config.dividerEnabled) addPieces(pieces, "Divisor vertical central", 1, structure.dividerHeightCm, structure.shelfDepthCm, melamine, { lengthStrategy: "floor", widthStrategy: "floor", maxLengthCm: structure.dividerHeightCm, maxWidthCm: structure.shelfDepthCm });
    if (structure.config.dividerEnabled) {
      addPieces(pieces, "Repisa izquierda", 1, structure.sectionWidthsCm[0], structure.shelfDepthCm, melamine, { lengthStrategy: "floor", widthStrategy: "floor", maxLengthCm: structure.sectionWidthsCm[0], maxWidthCm: structure.shelfDepthCm });
      addPieces(pieces, "Repisa derecha", 1, structure.sectionWidthsCm[1], structure.shelfDepthCm, melamine, { lengthStrategy: "floor", widthStrategy: "floor", maxLengthCm: structure.sectionWidthsCm[1], maxWidthCm: structure.shelfDepthCm });
      addPieces(pieces, "Soporte vertical izquierdo", 1, structure.supportHeightCm, structure.supportDepthCm, melamine);
      addPieces(pieces, "Soporte vertical derecho", 1, structure.supportHeightCm, structure.supportDepthCm, melamine);
    } else addPieces(pieces, "Repisa interior", 1, structure.shelfSpanCm, structure.shelfDepthCm, melamine, { lengthStrategy: "floor", widthStrategy: "floor", maxLengthCm: structure.shelfSpanCm, maxWidthCm: structure.shelfDepthCm });
    if (structure.config.upperRearEnabled) addPieces(pieces, "Travesaño trasero superior", 1, structure.innerWidthCm, structure.upperRearHeightCm, melamine);
    if (structure.config.lowerRearEnabled) addPieces(pieces, "Travesaño trasero inferior", 1, structure.innerWidthCm, structure.lowerRearHeightCm, melamine);
    addPieces(pieces, "Fondo trasero completo", 1, widthCm, heightCm, hardboard, {
      mounting: "external-rear",
      location: "Parte posterior exterior completa",
      installation: "Clavado sobre todo el perímetro posterior",
    });
  } else if (furnitureType === "nightstand") {
    addPieces(pieces, "Tapa superior", 1, widthCm, nightstandStructure.topDepthCm, melamine, { grainRequired: true });
    addPieces(pieces, "Laterales", 2, heightCm - thicknessCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: heightCm - thicknessCm, grainRequired: true });
    if (nightstandStructure.config.rearEnabled) addPieces(pieces, "Travesaño trasero inferior", 1, innerWidth, nightstandStructure.rearHeightCm, melamine, { lengthStrategy: "floor", maxLengthCm: innerWidth });
    if (nightstandStructure.config.frontEnabled) addPieces(
      pieces,
      "Travesaño frontal inferior",
      1,
      innerWidth,
      nightstandStructure.frontHeightCm,
      melamine,
      {
        lengthStrategy: "floor", maxLengthCm: innerWidth,
        mounting: "structural-front",
        location: "Parte frontal inferior, entre laterales",
        installation: `Altura estructural: ${nightstandStructure.frontHeightCm} cm · Separación mínima: ${nightstandStructure.safetyGapCm} cm`,
        structuralHeightCm: nightstandStructure.frontHeightCm, grainRequired: true,
      },
    );
    addBackPanel();
    if (drawers > 0) {
      const drawerManufacturing = resolveDrawerManufacturingWidth({ openingWidthCm: innerWidth, theoreticalBoxWidthCm: drawerDimensions.externalWidthCm, panelThicknessCm: thicknessCm, desiredClearanceCm: drawerDimensions.totalClearanceCm });
      if (!drawerManufacturing.valid) return [];
      const boxWidth = drawerManufacturing.boxWidthCm;
      const innerDrawerWidth = drawerManufacturing.backWidthCm;
      const bottom = calculateDrawerBottomDimensions({
        externalWidth: boxWidth,
        externalDepth: drawerDimensions.sideLengthCm,
        internalWidth: innerDrawerWidth,
        internalDepth: Math.max(0, drawerDimensions.sideLengthCm - thicknessCm * 2),
        panelThickness: thicknessCm,
        bottomThickness: hardboard.thicknessMm / 10,
      });
      nightstandStructure.drawerFrontHeightsCm.forEach((frontHeightCm, index) => {
        const sideHeightCm = nightstandStructure.drawerSideHeightsCm[index];
        addPieces(pieces, "Frente de cajón", 1, nightstandStructure.drawerFrontWidthCm, frontHeightCm, melamine, { grainRequired: true, idStart: index + 1 });
        addPieces(pieces, "Lateral izquierdo de cajón", 1, drawerDimensions.sideLengthCm, sideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: sideHeightCm, idStart: index + 1 });
        addPieces(pieces, "Lateral derecho de cajón", 1, drawerDimensions.sideLengthCm, sideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: sideHeightCm, idStart: index + 1 });
        addPieces(pieces, "Parte trasera de cajón", 1, innerDrawerWidth, sideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: sideHeightCm, effectiveClearanceCm: drawerManufacturing.effectiveClearanceCm, clearanceDeltaCm: drawerManufacturing.clearanceDeltaCm, idStart: index + 1 });
      });
      addPieces(pieces, "Base de cartón prensado del cajón", drawers, bottom.width, bottom.depth, hardboard, {
        location: bottom.location, installation: bottom.installation, mounting: bottom.mounting,
      });
    }
    else addPieces(pieces, "Repisa interior", 1, innerWidth, depthCm - thicknessCm, melamine, { lengthStrategy: "floor", widthStrategy: "floor", maxLengthCm: innerWidth, maxWidthCm: depthCm - thicknessCm });
  } else {
    const s = wardrobeStructure;
    const sectionCutWidthsCm = snapDistributedDimensions(s.sectionWidthsCm, s.innerTotalWidthCm);
    const drawerManufacturingByBody = s.sectionWidthsCm.map((openingWidthCm, bodyIndex) => resolveDrawerManufacturingWidth({ openingWidthCm, theoreticalBoxWidthCm: s.drawerBoxWidthsCm[bodyIndex], panelThicknessCm: thicknessCm, desiredClearanceCm: drawerDimensions.totalClearanceCm }));
    if ([drawerManufacturingByBody[0], drawerManufacturingByBody[2]].some((result) => !result.valid)) return [];
    addPieces(pieces, s.isSlidingDoors ? "Tapa superior extendida" : "Tapa superior", 1, widthCm, s.topDepthCm, melamine);
    addPieces(pieces, "Lateral izquierdo", 1, s.sideHeightCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: s.sideHeightCm, grainRequired: true });
    addPieces(pieces, "Lateral derecho", 1, s.sideHeightCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: s.sideHeightCm, grainRequired: true });
    addPieces(pieces, "Divisor vertical Cuerpo 1 / Cuerpo 2", 1, s.sideHeightCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: s.sideHeightCm });
    addPieces(pieces, "Divisor vertical Cuerpo 2 / Cuerpo 3", 1, s.sideHeightCm, depthCm, melamine, { lengthStrategy: "floor", maxLengthCm: s.sideHeightCm });
    for (let body = 1; body <= 3; body += 1) {
      const bodyWidthCm = sectionCutWidthsCm[body - 1];
      addPieces(pieces, `Travesaño frontal inferior Cuerpo ${body}`, 1, bodyWidthCm, s.lowerCrossbarHeightCm, melamine, { mounting: "structural-front", location: `Parte frontal inferior del Cuerpo ${body}`, installation: "Atornillado entre paneles verticales y apoyado al piso", grainRequired: true });
      addPieces(pieces, `Travesaño trasero inferior Cuerpo ${body}`, 1, bodyWidthCm, s.lowerCrossbarHeightCm, melamine, { mounting: "structural-rear", location: `Parte trasera inferior del Cuerpo ${body}`, installation: "Atornillado entre paneles verticales, delante del fondo" });
      addPieces(pieces, `Repisa superior Cuerpo ${body}`, 1, bodyWidthCm, depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
      if (s.isSlidingDoors) addPieces(pieces, `Puerta corrediza ${body}`, 1, s.slidingDoorHeightCm, s.slidingDoorWidthCm, melamine, { grainRequired: true });
      else {
        addPieces(pieces, `Puerta superior Cuerpo ${body}`, 1, s.upperDoorHeightCm, s.doorWidthsCm[body - 1], melamine, { grainRequired: true });
        addPieces(pieces, `Puerta principal Cuerpo ${body}`, 1, s.mainDoorHeightsCm[body - 1], s.doorWidthsCm[body - 1], melamine, { grainRequired: true });
      }
      addPieces(pieces, `Fondo cartón prensado Cuerpo ${body}`, 1, s.backLayouts[body - 1].widthCm, heightCm, hardboard, { mounting: "external-rear", location: `Parte posterior exterior del Cuerpo ${body}`, installation: "Clavado sobre el perímetro posterior correspondiente" });
    }
    if (s.isSlidingDoors) addPieces(pieces, "Soporte frontal inferior para riel", 1, widthCm, s.slidingLowerSupportHeightCm, melamine, { mounting: "sliding-track-support", location: "Frente inferior continuo", installation: "Atornillado sobre los cuatro paneles verticales para recibir el riel inferior" });
    addPieces(pieces, "Repisa sobre cajones Cuerpo 1", 1, sectionCutWidthsCm[0], depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
    addPieces(pieces, "Repisa intermedia 1 Cuerpo 1", 1, sectionCutWidthsCm[0], depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
    addPieces(pieces, "Repisa intermedia 2 Cuerpo 1", 1, sectionCutWidthsCm[0], depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
    addPieces(pieces, "Repisa sobre cajones Cuerpo 3", 1, sectionCutWidthsCm[2], depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
    addPieces(pieces, "Repisa inferior zapatero Cuerpo 2", 1, sectionCutWidthsCm[1], depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
    for (let shelf = 1; shelf <= shelves; shelf += 1) addPieces(pieces, `Repisa zapatos ${shelf} Cuerpo 2`, 1, sectionCutWidthsCm[1], depthCm - thicknessCm, melamine, { widthStrategy: "floor", maxWidthCm: depthCm - thicknessCm });
    for (const body of [1, 3]) {
      const bodyIndex = body - 1;
      const drawerManufacturing = drawerManufacturingByBody[bodyIndex];
      const front = calculateDrawerFrontDimensions({ boxWidthCm: drawerManufacturing.boxWidthCm, boxFrontHeightCm: s.drawerFrontHeightCm, drawerFrontConfig });
      const bottom = calculateDrawerBottomDimensions({ externalWidth: drawerManufacturing.boxWidthCm, externalDepth: s.drawerDepthCm, panelThickness: thicknessCm, bottomThickness: hardboard.thicknessMm / 10 });
      for (let drawer = 1; drawer <= 3; drawer += 1) {
      addPieces(pieces, `Frente Cajón ${drawer} Cuerpo ${body}`, 1, front.widthCm, front.heightCm, melamine, { grainRequired: true });
      addPieces(pieces, `Lateral izquierdo Cajón ${drawer} Cuerpo ${body}`, 1, s.drawerDepthCm, s.drawerSideHeightCm, melamine);
      addPieces(pieces, `Lateral derecho Cajón ${drawer} Cuerpo ${body}`, 1, s.drawerDepthCm, s.drawerSideHeightCm, melamine);
      addPieces(pieces, `Parte trasera Cajón ${drawer} Cuerpo ${body}`, 1, drawerManufacturing.backWidthCm, s.drawerSideHeightCm, melamine, { widthStrategy: "floor", maxWidthCm: s.drawerSideHeightCm, effectiveClearanceCm: drawerManufacturing.effectiveClearanceCm, clearanceDeltaCm: drawerManufacturing.clearanceDeltaCm });
      addPieces(pieces, `Base cartón prensado Cajón ${drawer} Cuerpo ${body}`, 1, bottom.width, bottom.depth, hardboard, { location: bottom.location, installation: bottom.installation, mounting: bottom.mounting });
      }
    }
  }
  return pieces.map((piece) => piece.material.id === "melamine"
    ? { ...piece, edgeBanding: validateEdgeBanding(edgeBanding[piece.id]) }
    : piece);
}

export const getFurnitureLabel = (type) => ({ wardrobe: "Ropero", desk: "Escritorio", tvStand: "Mueble TV", nightstand: "Mesa de noche", catHouse: "Casa para Gatos" }[type] || "Mueble");
