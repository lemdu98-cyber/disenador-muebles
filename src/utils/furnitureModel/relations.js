import { RELATION_CONTACT_EPSILON_CM } from "./relationTypes.js";

const axisBounds = Object.freeze({ x: ["minX", "maxX"], y: ["minY", "maxY"], z: ["minZ", "maxZ"] });
const compareRelations = (left, right) => left.sourceId.localeCompare(right.sourceId) || left.type.localeCompare(right.type) || left.targetId.localeCompare(right.targetId);

export const createFurnitureRelation = (sourceId, type, targetId, metadata = {}) => ({
  id: `${sourceId}|${type}|${targetId}`,
  type,
  sourceId,
  targetId,
  metadata: { ...metadata },
});

/** Bounds only corroborate an already known semantic contact; they do not infer relations. */
export function componentsTouchOnAxis(source, target, axis, epsilon = RELATION_CONTACT_EPSILON_CM) {
  if (!source?.bounds || !target?.bounds || !axisBounds[axis]) return false;
  const [min, max] = axisBounds[axis];
  const touches = Math.abs(source.bounds[min] - target.bounds[max]) <= epsilon || Math.abs(source.bounds[max] - target.bounds[min]) <= epsilon;
  if (!touches) return false;
  return Object.keys(axisBounds).filter((other) => other !== axis).every((other) => {
    const [otherMin, otherMax] = axisBounds[other];
    return Math.min(source.bounds[otherMax], target.bounds[otherMax]) + epsilon >= Math.max(source.bounds[otherMin], target.bounds[otherMin]);
  });
}

function relationCollector(model) {
  const byId = new Map(model.components.map((component) => [component.id, component]));
  const relations = [];
  const add = (sourceId, type, targetId, metadata) => {
    if (byId.has(sourceId) && byId.has(targetId) && sourceId !== targetId) relations.push(createFurnitureRelation(sourceId, type, targetId, metadata));
  };
  const addSupport = (sourceId, targetId, axis = "y") => {
    if (componentsTouchOnAxis(byId.get(sourceId), byId.get(targetId), axis)) add(sourceId, "supported-by", targetId, { axis });
  };
  return { byId, relations, add, addSupport };
}

const sideOf = (component, divider) => component?.position?.xCm < divider?.position?.xCm ? "left" : "right";
const addConnectsPair = (add, sourceId, leftId, rightId, axis = "x") => {
  add(sourceId, "connects", leftId, { side: "left", axis });
  add(sourceId, "connects", rightId, { side: "right", axis });
};

export function buildNightstandRelations(model) {
  const { relations, add, addSupport } = relationCollector(model);
  addSupport("nightstand.top", "nightstand.leftSide");
  addSupport("nightstand.top", "nightstand.rightSide");
  addConnectsPair(add, "nightstand.frontCrossbar", "nightstand.leftSide", "nightstand.rightSide");
  addConnectsPair(add, "nightstand.rearCrossbar", "nightstand.leftSide", "nightstand.rightSide");
  add("nightstand.back", "closes", "nightstand.root", { region: "rear" });
  model.components.filter(({ type }) => type === "drawer").forEach(({ id }) => add(id, "contained-in", "nightstand.root"));
  return relations;
}

export function buildDeskRelations(model) {
  const { byId, relations, add, addSupport } = relationCollector(model);
  ["desk.leftSide", "desk.rightSide", "desk.divider"].forEach((id) => addSupport("desk.top", id));
  addConnectsPair(add, "desk.rearCrossbar", "desk.leftSide", "desk.rightSide");
  const divider = byId.get("desk.divider");
  ["desk.drawerModule", "desk.legOpening"].forEach((id) => add("desk.divider", "separates", id, { side: sideOf(byId.get(id), divider), axis: "x" }));
  model.components.filter(({ type }) => type === "drawer").forEach(({ id }) => add(id, "contained-in", "desk.drawerModule"));
  return relations;
}

export function buildTvStandRelations(model) {
  const { byId, relations, add, addSupport } = relationCollector(model);
  ["tvStand.leftSide", "tvStand.rightSide", "tvStand.divider.1"].forEach((id) => addSupport("tvStand.top", id));
  const divider = byId.get("tvStand.divider.1");
  [1, 2].forEach((number) => {
    const sectionId = `tvStand.section.${number}`;
    const shelfId = `tvStand.shelf.${number}`;
    add("tvStand.divider.1", "separates", sectionId, { side: sideOf(byId.get(sectionId), divider), axis: "x" });
    add(shelfId, "contained-in", sectionId);
    addSupport(shelfId, `tvStand.support.${number}`);
  });
  ["superior", "inferior"].forEach((position) => addConnectsPair(add, `tvStand.rearCrossbar.${position}`, "tvStand.leftSide", "tvStand.rightSide"));
  add("tvStand.back", "closes", "tvStand.root", { region: "rear" });
  return relations;
}

export function buildCatHouseRelations(model) {
  const { relations, add, addSupport } = relationCollector(model);
  addSupport("catHouse.top", "catHouse.leftSide");
  addSupport("catHouse.top", "catHouse.rightSide");
  addConnectsPair(add, "catHouse.bottom", "catHouse.leftSide", "catHouse.rightSide", "y");
  add("catHouse.back", "closes", "catHouse.root", { region: "rear" });
  return relations;
}

const wardrobeBoundaries = (body) => body === 1 ? ["wardrobe.leftSide", "wardrobe.divider.1"] : body === 2 ? ["wardrobe.divider.1", "wardrobe.divider.2"] : ["wardrobe.divider.2", "wardrobe.rightSide"];

export function buildWardrobeRelations(model) {
  const { relations, add, addSupport } = relationCollector(model);
  ["wardrobe.leftSide", "wardrobe.divider.1", "wardrobe.divider.2", "wardrobe.rightSide"].forEach((id) => addSupport("wardrobe.top", id));
  [[1, 1, 2], [2, 2, 3]].forEach(([dividerNumber, leftBody, rightBody]) => {
    const dividerId = `wardrobe.divider.${dividerNumber}`;
    add(dividerId, "separates", `wardrobe.body.${leftBody}`, { side: "left", axis: "x" });
    add(dividerId, "separates", `wardrobe.body.${rightBody}`, { side: "right", axis: "x" });
  });
  add("wardrobe.body.1", "adjacent-to", "wardrobe.body.2", { axis: "x" });
  add("wardrobe.body.2", "adjacent-to", "wardrobe.body.3", { axis: "x" });
  for (let body = 1; body <= 3; body += 1) {
    const bodyId = `wardrobe.body.${body}`;
    const [leftBoundary, rightBoundary] = wardrobeBoundaries(body);
    add(`${bodyId}.back`, "closes", bodyId, { region: "rear" });
    ["frontal", "trasero"].forEach((position) => addConnectsPair(add, `${bodyId}.lowerCrossbar.${position}`, leftBoundary, rightBoundary));
    model.components.filter(({ type, parentId }) => type === "shelf" && parentId === bodyId).forEach(({ id }) => {
      add(id, "contained-in", bodyId);
      addSupport(id, leftBoundary, "x");
      addSupport(id, rightBoundary, "x");
    });
    model.components.filter(({ type, parentId }) => type === "drawer" && parentId === bodyId).forEach(({ id }) => add(id, "contained-in", bodyId));
    const openingId = `${bodyId}.opening`;
    [`${bodyId}.door.superior`, `${bodyId}.door.principal`].forEach((doorId) => add(doorId, "covers", openingId));
  }
  model.components.filter(({ type, role }) => type === "door" && role === "sliding").forEach(({ id }) => add(id, "covers", "wardrobe.root", { region: "front" }));
  return relations;
}

const BUILDERS = Object.freeze({
  nightstand: buildNightstandRelations,
  desk: buildDeskRelations,
  tvStand: buildTvStandRelations,
  catHouse: buildCatHouseRelations,
  wardrobe: buildWardrobeRelations,
});

export function buildFurnitureRelations(model) {
  const relations = BUILDERS[model?.furnitureType]?.(model) ?? [];
  return relations.slice().sort(compareRelations);
}

export const getOutgoingRelations = (model, componentId) => (model?.relations ?? []).filter(({ sourceId }) => sourceId === componentId);
export const getIncomingRelations = (model, componentId) => (model?.relations ?? []).filter(({ targetId }) => targetId === componentId);
export const getRelationsForComponent = (model, componentId) => (model?.relations ?? []).filter(({ sourceId, targetId }) => sourceId === componentId || targetId === componentId);
export const getRelationsByType = (model, type) => (model?.relations ?? []).filter((relation) => relation.type === type);
