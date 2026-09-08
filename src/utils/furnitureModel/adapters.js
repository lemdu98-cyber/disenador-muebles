import { componentFromPiece, createComponent } from "./componentFactory.js";
import { createFurnitureModel } from "./furnitureModel.js";

const piece = (pieces, name, occurrence = 0) => pieces.filter((item) => item.name === name)[occurrence];
const named = (pieces, name) => pieces.find((item) => item.name === name);
const physical = (components, id, type, role, item, parentId, metadata) => { if (item) components.push(componentFromPiece({ id, type, role, piece: item, parentId, metadata })); };
const dimensions = ({ widthCm, heightCm, depthCm }) => ({ widthCm, heightCm, depthCm });
const finish = (furnitureType, input, components) => createFurnitureModel({ furnitureType, dimensions: input, components, generatedPieces: input.generatedPieces });

export function adaptNightstandToFurnitureModel(input) {
  const { generatedPieces: pieces, structure } = input; const c = [];
  physical(c, "nightstand.top", "panel", "top", named(pieces, "Tapa superior"), "nightstand.root");
  [0, 1].forEach((index) => physical(c, `nightstand.${index ? "rightSide" : "leftSide"}`, "panel", index ? "right-side" : "left-side", piece(pieces, "Laterales", index), "nightstand.root"));
  physical(c, "nightstand.back", "back", named(pieces, "Fondo de cartón prensado"), "nightstand.root");
  physical(c, "nightstand.frontCrossbar", "crossbar", named(pieces, "Travesaño frontal inferior"), "nightstand.root");
  physical(c, "nightstand.rearCrossbar", "crossbar", named(pieces, "Travesaño trasero inferior"), "nightstand.root");
  (structure?.drawerFrontHeightsCm ?? []).forEach((height, index) => {
    const parentId = `nightstand.drawer.${index + 1}`; c.push(createComponent({ id: parentId, type: "drawer", role: "drawer", parentId: "nightstand.root", dimensions: { widthCm: structure.drawerFrontWidthCm, heightCm: height, depthCm: structure.drawerGeometry?.drawerLayouts[index]?.depthCm ?? 0 }, metadata: { semanticId: parentId } }));
    physical(c, `${parentId}.front`, "drawer-front", "front", piece(pieces, "Frente de cajón", index), parentId);
    ["Lateral izquierdo de cajón", "Lateral derecho de cajón", "Parte trasera de cajón", "Base de cartón prensado del cajón"].forEach((name, side) => physical(c, `${parentId}.${["left-side", "right-side", "back", "bottom"][side]}`, "panel", ["left-side", "right-side", "back", "bottom"][side], piece(pieces, name, index), parentId));
  }); return finish("nightstand", input, c);
}

export function adaptDeskToFurnitureModel(input) {
  const { generatedPieces: pieces, structure } = input; const c = []; const root = "desk.root";
  physical(c, "desk.top", "panel", "top", named(pieces, "Tapa superior"), root); ["izquierdo", "derecho"].forEach((side) => physical(c, `desk.${side === "izquierdo" ? "leftSide" : "rightSide"}`, "panel", `${side === "izquierdo" ? "left" : "right"}-side`, named(pieces, `Lateral ${side}`), root));
  const moduleId = "desk.drawerModule"; c.push(createComponent({ id: moduleId, type: "section", role: "drawer-module", parentId: root, dimensions: { widthCm: structure.moduleWidthCm, heightCm: input.heightCm, depthCm: input.depthCm }, position: { xCm: structure.moduleCenterXCm, yCm: 0, zCm: 0 } }));
  c.push(createComponent({ id: "desk.legOpening", type: "opening", role: "leg-opening", parentId: root, dimensions: { widthCm: structure.legroomWidthCm, heightCm: structure.legHeightCm, depthCm: input.depthCm }, position: { xCm: structure.sectionGeometry?.freeOpeningCenterXCm ?? null, yCm: 0, zCm: 0 } }));
  physical(c, "desk.divider", "divider", "drawer-module-divider", named(pieces, "Divisor módulo de cajones"), root); physical(c, "desk.rearCrossbar", "crossbar", "rear-crossbar", named(pieces, "Travesaño trasero"), root);
  for (let i = 0; i < input.drawers; i += 1) { const id = `desk.drawer.${i + 1}`; c.push(createComponent({ id, type: "drawer", role: "drawer", parentId: moduleId, sourcePieceIds: [piece(pieces, "Lateral izquierdo de cajón", i), piece(pieces, "Lateral derecho de cajón", i), piece(pieces, "Parte trasera de cajón", i), piece(pieces, "Base de cartón prensado del cajón", i)].filter(Boolean).map(({ id: pieceId }) => pieceId) })); physical(c, `${id}.front`, "drawer-front", "front", named(pieces, ["Frente cajón superior", "Frente cajón central", "Frente cajón inferior"][i] ?? `Frente cajón ${i + 1}`), id); }
  return finish("desk", input, c);
}

export function adaptTvStandToFurnitureModel(input) {
  const { generatedPieces: pieces, structure } = input; const c = []; const root = "tvStand.root";
  ["top", "leftSide", "rightSide", "back"].forEach((id, i) => physical(c, `tvStand.${id}`, id === "back" ? "back" : "panel", id.replace(/[A-Z]/g, (v) => `-${v.toLowerCase()}`), named(pieces, ["Tapa superior", "Lateral izquierdo", "Lateral derecho", "Fondo trasero completo"][i]), root));
  (structure.sectionWidthsCm ?? []).forEach((width, i) => c.push(createComponent({ id: `tvStand.section.${i + 1}`, type: "section", role: "section", parentId: root, dimensions: { widthCm: width, heightCm: input.heightCm, depthCm: input.depthCm }, position: { xCm: structure.sectionCentersXCm?.[i] ?? null, yCm: 0, zCm: 0 } })));
  physical(c, "tvStand.divider.1", "divider", "vertical-divider", named(pieces, "Divisor vertical central"), root); ["izquierda", "derecha"].forEach((side, i) => physical(c, `tvStand.shelf.${i + 1}`, "shelf", "shelf", named(pieces, `Repisa ${side}`), `tvStand.section.${i + 1}`));
  ["izquierdo", "derecho"].forEach((side, i) => physical(c, `tvStand.support.${i + 1}`, "panel", "vertical-support", named(pieces, `Soporte vertical ${side}`), `tvStand.section.${i + 1}`));
  ["superior", "inferior"].forEach((side) => physical(c, `tvStand.rearCrossbar.${side}`, "crossbar", "rear-crossbar", named(pieces, `Travesaño trasero ${side}`), root)); return finish("tvStand", input, c);
}

export function adaptCatHouseToFurnitureModel(input) { const { generatedPieces: pieces } = input; const c = []; const root = "catHouse.root"; [["top", "Tapa superior"], ["bottom", "Base inferior"], ["leftSide", "Lateral izquierdo"], ["rightSide", "Lateral derecho"], ["back", "Trasera de cartón prensado"]].forEach(([id, name]) => physical(c, `catHouse.${id}`, id === "back" ? "back" : "panel", id, named(pieces, name), root)); c.push(createComponent({ id: "catHouse.frontOpening", type: "opening", role: "front-opening", parentId: root, dimensions: dimensions(input), position: null })); return finish("catHouse", input, c); }

export function adaptWardrobeToFurnitureModel(input) {
  const { generatedPieces: pieces, structure } = input; const c = []; const root = "wardrobe.root";
  physical(c, "wardrobe.top", "panel", "top", named(pieces, structure.isSlidingDoors ? "Tapa superior extendida" : "Tapa superior"), root); ["izquierdo", "derecho"].forEach((side) => physical(c, `wardrobe.${side === "izquierdo" ? "leftSide" : "rightSide"}`, "panel", `${side === "izquierdo" ? "left" : "right"}-side`, named(pieces, `Lateral ${side}`), root));
  (structure.sectionWidthsCm ?? []).forEach((width, i) => { const body = i + 1; const id = `wardrobe.body.${body}`; c.push(createComponent({ id, type: "section", role: "body", parentId: root, dimensions: { widthCm: width, heightCm: input.heightCm, depthCm: input.depthCm }, position: { xCm: structure.bodyCentersXCm?.[i] ?? null, yCm: 0, zCm: 0 } })); physical(c, `${id}.back`, "back", "back", named(pieces, `Fondo cartón prensado Cuerpo ${body}`), id); ["superior", "principal"].forEach((kind) => physical(c, `${id}.door.${kind}`, "door", kind, named(pieces, `Puerta ${kind} Cuerpo ${body}`), id, { orientation: "front" })); if (structure.isSlidingDoors) physical(c, `${id}.door`, "door", "sliding", named(pieces, `Puerta corrediza ${body}`), id, { orientation: "sliding" }); });
  [1, 2].forEach((n) => physical(c, `wardrobe.divider.${n}`, "divider", "vertical-divider", named(pieces, `Divisor vertical Cuerpo ${n} / Cuerpo ${n + 1}`), root));
  (structure.sectionWidthsCm ?? []).forEach((width, i) => { const body = i + 1; const parentId = `wardrobe.body.${body}`; ["frontal", "trasero"].forEach((side) => physical(c, `${parentId}.lowerCrossbar.${side}`, "crossbar", `lower-${side}-crossbar`, named(pieces, `Travesaño ${side} inferior Cuerpo ${body}`), parentId)); physical(c, `${parentId}.upperShelf`, "shelf", "upper-shelf", named(pieces, `Repisa superior Cuerpo ${body}`), parentId); });
  ["sobre cajones Cuerpo 1", "intermedia 1 Cuerpo 1", "intermedia 2 Cuerpo 1", "sobre cajones Cuerpo 3", "inferior zapatero Cuerpo 2"].forEach((suffix, index) => { const body = suffix.endsWith("1") ? 1 : suffix.endsWith("3") ? 3 : 2; physical(c, `wardrobe.body.${body}.shelf.fixed.${index + 1}`, "shelf", "shelf", named(pieces, `Repisa ${suffix}`), `wardrobe.body.${body}`); });
  for (let shelf = 1; shelf <= input.shelves; shelf += 1) physical(c, `wardrobe.body.2.shoeShelf.${shelf}`, "shelf", "shoe-shelf", named(pieces, `Repisa zapatos ${shelf} Cuerpo 2`), "wardrobe.body.2");
  [1, 2, 3].forEach((body) => c.push(createComponent({ id: `wardrobe.body.${body}.opening`, type: "opening", role: body === 2 ? "hanging-opening" : "storage-opening", parentId: `wardrobe.body.${body}`, dimensions: { widthCm: structure.sectionWidthsCm?.[body - 1] ?? 0, heightCm: input.heightCm, depthCm: input.depthCm }, position: null })));
  (structure.drawerLayouts ?? []).forEach(({ bodyIndex, drawerIndex }) => { const body = bodyIndex + 1; const number = drawerIndex + 1; const id = `wardrobe.body.${body}.drawer.${number}`; const sources = ["Frente", "Lateral izquierdo", "Lateral derecho", "Parte trasera", "Base cartón prensado"].map((prefix) => named(pieces, `${prefix} Cajón ${number} Cuerpo ${body}`)).filter(Boolean); c.push(createComponent({ id, type: "drawer", role: "drawer", parentId: `wardrobe.body.${body}`, sourcePieceIds: sources.map(({ id: pieceId }) => pieceId) })); physical(c, `${id}.front`, "drawer-front", "front", named(pieces, `Frente Cajón ${number} Cuerpo ${body}`), id); });
  return finish("wardrobe", input, c);
}
