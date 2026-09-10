import { FRONT_REGION_EPSILON_CM } from "./regionTypes.js";

const finite = (...values) => values.every(Number.isFinite);
const compareRegions = (left, right) => left.id.localeCompare(right.id);

export function createPlanarRegion({ id, type, role, componentId = null, minX, maxX, minY, maxY, zCm, plane = "front", metadata = {} }) {
  return {
    id, type, role, plane, componentId,
    bounds: { minX, maxX, minY, maxY, minZ: zCm, maxZ: zCm },
    region: { axis: "xy", minX, maxX, minY, maxY, zCm },
    metadata: { ...metadata },
  };
}

export const getRegionWidth = (value) => value?.region && finite(value.region.minX, value.region.maxX) ? value.region.maxX - value.region.minX : null;
export const getRegionHeight = (value) => value?.region && finite(value.region.minY, value.region.maxY) ? value.region.maxY - value.region.minY : null;
export const getHorizontalGap = (left, right) => left?.region && right?.region ? right.region.minX - left.region.maxX : null;
export const getVerticalGap = (lower, upper) => lower?.region && upper?.region ? upper.region.minY - lower.region.maxY : null;
export const getOverlap = (left, right) => left?.region && right?.region ? Math.max(0, Math.min(left.region.maxX, right.region.maxX) - Math.max(left.region.minX, right.region.minX)) : null;

export function getCoverageRatio(source, target) {
  if (!source?.region || !target?.region) return null;
  const width = Math.max(0, Math.min(source.region.maxX, target.region.maxX) - Math.max(source.region.minX, target.region.minX));
  const height = Math.max(0, Math.min(source.region.maxY, target.region.maxY) - Math.max(source.region.minY, target.region.minY));
  const targetArea = getRegionWidth(target) * getRegionHeight(target);
  return targetArea > 0 ? width * height / targetArea : null;
}

export function getCombinedCoverageRatio(sources, target) {
  if (!target?.region || !sources?.length) return 0;
  const minY = target.region.minY; const maxY = target.region.maxY;
  const intervals = sources.map(({ region }) => ({ min: Math.max(region.minX, target.region.minX), max: Math.min(region.maxX, target.region.maxX), height: Math.max(0, Math.min(region.maxY, maxY) - Math.max(region.minY, minY)) }))
    .filter(({ min, max, height }) => max > min && height >= getRegionHeight(target) - FRONT_REGION_EPSILON_CM)
    .sort((a, b) => a.min - b.min);
  let covered = 0; let end = target.region.minX;
  intervals.forEach((interval) => { const start = Math.max(end, interval.min); if (interval.max > start) covered += interval.max - start; end = Math.max(end, interval.max); });
  return getRegionWidth(target) > 0 ? covered / getRegionWidth(target) : 0;
}

const componentFace = (component, role, type = "front", metadata = {}) => component?.bounds ? createPlanarRegion({
  id: `${component.id}.region.front`, type, role, componentId: component.id,
  minX: component.bounds.minX, maxX: component.bounds.maxX, minY: component.bounds.minY, maxY: component.bounds.maxY,
  zCm: component.bounds.maxZ, metadata,
}) : null;

const add = (regions, region) => { if (region) regions.push(region); };

function buildDrawerRegions(model, context, regions) {
  if (!["nightstand", "desk"].includes(model.furnitureType)) return;
  const thicknessCm = Number(context.generatedPieces?.find((piece) => ["Tapa superior", "Lateral izquierdo"].includes(piece.name))?.material?.thicknessMm ?? 0) / 10;
  model.components.filter(({ type }) => type === "drawer-front").forEach((front) => {
    const face = componentFace(front, "drawer-front-region", "front", { coverageKind: "drawer" });
    add(regions, face);
    if (!face) return;
    const openingWidth = model.furnitureType === "nightstand" ? Math.max(0, context.widthCm - thicknessCm * 2) : context.structure?.drawerOpeningWidthCm;
    const centerX = front.position?.xCm;
    if (!finite(openingWidth, centerX)) return;
    add(regions, createPlanarRegion({
      id: `${front.parentId}.region.front-opening`, type: "opening", role: "front-opening", componentId: front.parentId,
      minX: centerX - openingWidth / 2, maxX: centerX + openingWidth / 2,
      minY: face.region.minY, maxY: face.region.maxY, zCm: face.region.zCm,
      metadata: { coveredByRegionId: face.id, openingKind: "drawer" },
    }));
    face.metadata.targetRegionId = `${front.parentId}.region.front-opening`;
  });
}

function buildCatHouseRegions(model, regions) {
  const opening = model.components.find(({ id }) => id === "catHouse.frontOpening");
  add(regions, componentFace(opening, "front-opening", "opening", { openingKind: "cat-house" }));
}

function buildWardrobeRegions(model, context, regions) {
  if (model.furnitureType !== "wardrobe") return;
  const { structure, widthCm, heightCm, depthCm } = context;
  if (!structure) return;
  const zCm = depthCm / 2;
  add(regions, createPlanarRegion({ id: "wardrobe.region.global-front", type: "opening", role: "global-front", componentId: "wardrobe.root", minX: -widthCm / 2, maxX: widthCm / 2, minY: -heightCm / 2, maxY: heightCm / 2, zCm, metadata: { frontKind: structure.isSlidingDoors ? "sliding" : "hinged" } }));
  if (structure.isSlidingDoors) {
    const target = createPlanarRegion({ id: "wardrobe.region.sliding-opening", type: "opening", role: "front-opening", componentId: "wardrobe.root", minX: -widthCm / 2 + structure.slidingDoorClearanceCm, maxX: widthCm / 2 - structure.slidingDoorClearanceCm, minY: -heightCm / 2 + structure.slidingLowerSupportHeightCm + structure.slidingDoorClearanceCm, maxY: heightCm / 2 - (heightCm - structure.slidingDoorHeightCm - structure.slidingLowerSupportHeightCm - structure.slidingDoorClearanceCm), zCm, metadata: { openingKind: "sliding", coveredByGroup: "wardrobe-sliding" } });
    add(regions, target);
    structure.slidingDoorClosedCentersXCm.forEach((centerX, index) => {
      const componentId = `wardrobe.body.${index + 1}.door`;
      add(regions, createPlanarRegion({ id: `${componentId}.region.front`, type: "front", role: "door-front", componentId, minX: centerX - structure.slidingDoorWidthCm / 2, maxX: centerX + structure.slidingDoorWidthCm / 2, minY: target.region.minY, maxY: target.region.maxY, zCm, metadata: { coverageKind: "sliding", coverageGroup: "wardrobe-sliding", targetRegionId: target.id, expectedOverlapCm: structure.slidingDoorOverlapCm } }));
    });
    return;
  }
  structure.doorWidthsCm.forEach((doorWidth, index) => {
    const body = index + 1; const centerX = structure.bodyCentersXCm[index]; const left = centerX - doorWidth / 2; const right = centerX + doorWidth / 2;
    const bodyId = `wardrobe.body.${body}`;
    add(regions, createPlanarRegion({ id: `${bodyId}.region.global-front`, type: "opening", role: "global-front", componentId: bodyId, minX: left, maxX: right, minY: structure.mainDoorBottomEdgesCm[index], maxY: heightCm / 2 - structure.edgeGapCm, zCm, metadata: { frontKind: "hinged-body" } }));
    const segments = [
      ["principal", structure.mainDoorBottomEdgesCm[index], structure.upperShelfYCm - structure.hingedSectionGapCm / 2],
      ["superior", structure.upperShelfYCm + structure.hingedSectionGapCm / 2, heightCm / 2 - structure.edgeGapCm],
    ];
    segments.forEach(([kind, minY, maxY]) => {
      const componentId = `${bodyId}.door.${kind}`; const openingId = `${bodyId}.opening.region.${kind}`;
      add(regions, createPlanarRegion({ id: openingId, type: "opening", role: "front-opening", componentId: `${bodyId}.opening`, minX: structure.sectionStartXCm[index], maxX: structure.sectionStartXCm[index] + structure.sectionWidthsCm[index], minY, maxY, zCm, metadata: { openingKind: "hinged", coveredByRegionId: `${componentId}.region.front` } }));
      add(regions, createPlanarRegion({ id: `${componentId}.region.front`, type: "front", role: "door-front", componentId, minX: left, maxX: right, minY, maxY, zCm, metadata: { coverageKind: "hinged", targetRegionId: openingId, horizontalGapGroup: `wardrobe-hinged-${kind}`, verticalGapGroup: bodyId, configuredDoorGapCm: structure.doorGapCm, expectedVerticalGapCm: structure.hingedSectionGapCm } }));
    });
  });
  ["principal", "superior"].forEach((kind) => {
    const group = regions.filter(({ metadata }) => metadata?.horizontalGapGroup === `wardrobe-hinged-${kind}`).sort((a, b) => a.region.minX - b.region.minX);
    group.forEach((region, index) => { if (index) region.metadata.expectedHorizontalGapCm = getHorizontalGap(group[index - 1], region); });
  });
}

export function buildFurnitureRegions(model, context = {}) {
  const regions = [];
  buildDrawerRegions(model, context, regions);
  buildCatHouseRegions(model, regions);
  buildWardrobeRegions(model, context, regions);
  return regions.sort(compareRegions);
}

export const getRegionsForComponent = (model, componentId) => (model?.regions ?? []).filter((region) => region.componentId === componentId);
export const getRegionById = (model, id) => (model?.regions ?? []).find((region) => region.id === id) ?? null;
export const getRegionsByRole = (model, role) => (model?.regions ?? []).filter((region) => region.role === role);
