import { getHorizontalGap, getOverlap, getVerticalGap } from "./furnitureModel/regions.js";

export const CM_TO_METERS = 0.01;
export const DEBUG_REGION_Z_OFFSET_M = 0.004;
export const REGION_FILTERS = Object.freeze(["all", "openings", "doors", "drawers", "global"]);
export const REGION_ROLE_STYLES = Object.freeze({
  "front-opening": { color: "#f59e0b", opacity: .1 },
  "door-front": { color: "#38bdf8", opacity: .12 },
  "drawer-front-region": { color: "#34d399", opacity: .14 },
  "global-front": { color: "#a78bfa", opacity: .06 },
  "rear-region": { color: "#fb7185", opacity: .1 },
});

export const cmToMeters = (value) => value * CM_TO_METERS;

export function normalizeSelectedRegionId(model, selectedRegionId) {
  return selectedRegionId && model?.regions?.some(({ id }) => id === selectedRegionId) ? selectedRegionId : null;
}

export function regionMatchesFilter(region, filter = "all") {
  if (filter === "openings") return region.role === "front-opening";
  if (filter === "doors") return region.role === "door-front";
  if (filter === "drawers") return region.role === "drawer-front-region";
  if (filter === "global") return region.role === "global-front";
  return true;
}

export function regionToOverlayRect(item, layer = 0) {
  const { region } = item;
  return {
    id: item.id,
    region: item,
    widthM: cmToMeters(region.maxX - region.minX),
    heightM: cmToMeters(region.maxY - region.minY),
    position: [cmToMeters((region.minX + region.maxX) / 2), cmToMeters((region.minY + region.maxY) / 2), cmToMeters(region.zCm) + DEBUG_REGION_Z_OFFSET_M + layer * 0.00005],
  };
}

export function buildRegionOverlayData(regions = [], filter = "all") {
  return regions.filter((region) => regionMatchesFilter(region, filter)).map(regionToOverlayRect);
}

const midpoint = (a, b) => (a + b) / 2;
const dimensionId = (type, from, to, axis) => `${type}|${from.id}|${to.id}|${axis}`;

function horizontalDimension(type, from, to, valueCm, metadata = {}) {
  const yCm = Math.min(from.region.maxY, to.region.maxY) + 2;
  return { id: dimensionId(type, from, to, "x"), type, axis: "x", fromRegionId: from.id, toRegionId: to.id, valueCm, endpointsCm: [[from.region.maxX, yCm, Math.max(from.region.zCm, to.region.zCm)], [to.region.minX, yCm, Math.max(from.region.zCm, to.region.zCm)]], ...metadata };
}

function verticalDimension(from, to, valueCm, metadata = {}) {
  const xCm = Math.min(from.region.minX, to.region.minX) - 2;
  return { id: dimensionId("gap", from, to, "y"), type: "gap", axis: "y", fromRegionId: from.id, toRegionId: to.id, valueCm, endpointsCm: [[xCm, from.region.maxY, Math.max(from.region.zCm, to.region.zCm)], [xCm, to.region.minY, Math.max(from.region.zCm, to.region.zCm)]], ...metadata };
}

function grouped(regions, key) {
  const groups = new Map();
  regions.filter(({ metadata }) => metadata?.[key]).forEach((region) => { const id = region.metadata[key]; groups.set(id, [...(groups.get(id) ?? []), region]); });
  return groups;
}

export function buildRegionDimensionData(regions = []) {
  const dimensions = [];
  grouped(regions, "horizontalGapGroup").forEach((items) => {
    const sorted = items.sort((a, b) => a.region.minX - b.region.minX);
    sorted.forEach((item, index) => { if (index) dimensions.push(horizontalDimension("gap", sorted[index - 1], item, getHorizontalGap(sorted[index - 1], item), { expectedCm: item.metadata.configuredDoorGapCm ?? item.metadata.expectedHorizontalGapCm })); });
  });
  grouped(regions, "verticalGapGroup").forEach((items) => {
    const sorted = items.sort((a, b) => a.region.minY - b.region.minY);
    if (sorted.length === 2) dimensions.push(verticalDimension(sorted[0], sorted[1], getVerticalGap(sorted[0], sorted[1]), { expectedCm: sorted[1].metadata.expectedVerticalGapCm }));
  });
  grouped(regions.filter(({ metadata }) => metadata?.coverageKind === "sliding"), "coverageGroup").forEach((items) => {
    const sorted = items.sort((a, b) => a.region.minX - b.region.minX);
    sorted.forEach((item, index) => { if (index) dimensions.push(horizontalDimension("overlap", sorted[index - 1], item, getOverlap(sorted[index - 1], item), { expectedCm: item.metadata.expectedOverlapCm })); });
  });
  return dimensions.sort((a, b) => a.id.localeCompare(b.id));
}

export function dimensionToMeters(dimension) {
  const points = dimension.endpointsCm.map(([x, y, z]) => [cmToMeters(x), cmToMeters(y), cmToMeters(z) + DEBUG_REGION_Z_OFFSET_M * 2]);
  return { ...dimension, points, labelPosition: [midpoint(points[0][0], points[1][0]), midpoint(points[0][1], points[1][1]) + .015, midpoint(points[0][2], points[1][2])] };
}
