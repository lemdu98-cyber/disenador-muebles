import { isRegionAxis, isRegionPlane, isRegionRole, isRegionType } from "./regionTypes.js";

export function validateFurnitureRegions(model) {
  const errors = [];
  if (!Array.isArray(model?.regions)) return { valid: false, errors: ["regions must be an array."] };
  const componentIds = new Set((model.components ?? []).map(({ id }) => id)); const ids = new Set();
  for (const item of model.regions) {
    if (!item?.id || ids.has(item.id)) errors.push(`Duplicate or missing region id: ${item?.id ?? "unknown"}.`); ids.add(item?.id);
    if (!isRegionType(item?.type)) errors.push(`Invalid region type: ${item?.id ?? "unknown"}.`);
    if (!isRegionRole(item?.role)) errors.push(`Invalid region role: ${item?.id ?? "unknown"}.`);
    if (!isRegionPlane(item?.plane)) errors.push(`Invalid region plane: ${item?.id ?? "unknown"}.`);
    if (!isRegionAxis(item?.region?.axis)) errors.push(`Invalid region axis: ${item?.id ?? "unknown"}.`);
    const values = item?.region ? [item.region.minX, item.region.maxX, item.region.minY, item.region.maxY, item.region.zCm] : [];
    if (values.length !== 5 || !values.every(Number.isFinite) || item.region.minX > item.region.maxX || item.region.minY > item.region.maxY) errors.push(`Invalid planar bounds: ${item?.id ?? "unknown"}.`);
    if (item.componentId != null && !componentIds.has(item.componentId)) errors.push(`Unknown region component: ${item.componentId}.`);
  }
  return { valid: errors.length === 0, errors };
}
