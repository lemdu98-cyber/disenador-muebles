import { applyFurnitureModelEdit, FURNITURE_EDIT_ERROR_CODES } from "./editAdapter.js";

const clone = (value) => value === undefined ? undefined : structuredClone(value);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function collectConfigDiff(before, after, path, diff) {
  if (Object.is(before, after)) return;
  if (Array.isArray(before) || Array.isArray(after)) {
    const left = Array.isArray(before) ? before : [];
    const right = Array.isArray(after) ? after : [];
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      collectConfigDiff(left[index], right[index], `${path}[${index}]`, diff);
    }
    return;
  }
  if (isRecord(before) || isRecord(after)) {
    const left = isRecord(before) ? before : {};
    const right = isRecord(after) ? after : {};
    [...new Set([...Object.keys(left), ...Object.keys(right)])].sort().forEach((key) => {
      collectConfigDiff(left[key], right[key], path ? `${path}.${key}` : key, diff);
    });
    return;
  }
  diff.push({ path, before: clone(before), after: clone(after) });
}

function buildConfigDiff(before, after) {
  const diff = [];
  collectConfigDiff(before, after, "", diff);
  return diff.sort((left, right) => left.path.localeCompare(right.path));
}

export function applyFurnitureModelTransaction({ model, config, edits, context, furnitureType = model?.furnitureType }) {
  if (furnitureType !== model?.furnitureType) {
    return {
      ok: false,
      error: {
        code: FURNITURE_EDIT_ERROR_CODES.TRANSACTION_FAILED,
        message: "The transaction furniture type does not match the active model.",
        cause: { code: FURNITURE_EDIT_ERROR_CODES.UNSUPPORTED_FURNITURE_TYPE, message: "Mixed furniture transactions are not supported." },
      },
      failedEditIndex: 0,
      edit: clone(edits?.[0]),
    };
  }
  const originalConfig = clone(config ?? {});
  let nextConfig = clone(originalConfig);
  const appliedEdits = [];
  for (let index = 0; index < (edits?.length ?? 0); index += 1) {
    const edit = edits[index];
    const result = applyFurnitureModelEdit({ model, config: nextConfig, edit, context });
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: FURNITURE_EDIT_ERROR_CODES.TRANSACTION_FAILED,
          message: `Edit ${index + 1} failed: ${result.error.message}`,
          cause: clone(result.error),
        },
        failedEditIndex: index,
        edit: clone(edit),
      };
    }
    nextConfig = clone(result.nextConfig);
    appliedEdits.push(clone(result.appliedEdit));
  }
  return {
    ok: true,
    furnitureType,
    nextConfig,
    diff: buildConfigDiff(originalConfig, nextConfig),
    appliedEdits,
  };
}
