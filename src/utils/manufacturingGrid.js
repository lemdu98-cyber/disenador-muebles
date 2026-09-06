export const MANUFACTURING_GRID_MM = 5;
export const MANUFACTURING_GRID_CM = MANUFACTURING_GRID_MM / 10;
export const MANUFACTURING_GRID_EPSILON_CM = 1e-7;

const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const toGridUnits = (valueCm) => finite(valueCm) * 10 / MANUFACTURING_GRID_MM;
const fromGridUnits = (units) => Number((units * MANUFACTURING_GRID_MM / 10).toFixed(10));

export function isManufacturableCutDimension(valueCm) {
  const units = toGridUnits(valueCm);
  return finite(valueCm) > 0 && Math.abs(units - Math.round(units)) <= MANUFACTURING_GRID_EPSILON_CM / MANUFACTURING_GRID_CM;
}

export function snapCutDimension(valueCm, strategy = "nearest") {
  const units = toGridUnits(valueCm);
  const unitEpsilon = MANUFACTURING_GRID_EPSILON_CM / MANUFACTURING_GRID_CM;
  const snappedUnits = strategy === "floor" ? Math.floor(units + unitEpsilon) : strategy === "ceil" ? Math.ceil(units - unitEpsilon) : Math.round(units + unitEpsilon);
  return Math.max(0, fromGridUnits(snappedUnits));
}

export function snapCutDimensionWithConstraints(valueCm, { minCm = 0, maxCm = Infinity, validate, preferredStrategy = "nearest" } = {}) {
  const candidates = [...new Set([snapCutDimension(valueCm, preferredStrategy), snapCutDimension(valueCm, "floor"), snapCutDimension(valueCm, "ceil")])]
    .filter((candidate) => candidate > 0 && candidate >= minCm - MANUFACTURING_GRID_EPSILON_CM && candidate <= maxCm + MANUFACTURING_GRID_EPSILON_CM && (!validate || validate(candidate)))
    .sort((a, b) => Math.abs(a - valueCm) - Math.abs(b - valueCm));
  return candidates[0] ?? null;
}

/** Largest-remainder allocation in 5 mm units. Preserves target when representable. */
export function snapDistributedDimensions(valuesCm, targetTotalCm) {
  if (!Array.isArray(valuesCm) || !valuesCm.length || valuesCm.some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) return [];
  const targetUnitsExact = toGridUnits(targetTotalCm);
  if (Math.abs(targetUnitsExact - Math.round(targetUnitsExact)) > MANUFACTURING_GRID_EPSILON_CM / MANUFACTURING_GRID_CM) return valuesCm.map((value) => snapCutDimension(value));
  const targetUnits = Math.round(targetUnitsExact);
  const idealUnits = valuesCm.map(toGridUnits);
  const units = idealUnits.map(Math.floor);
  let remaining = targetUnits - units.reduce((sum, value) => sum + value, 0);
  const order = idealUnits.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let cursor = 0; remaining > 0; cursor += 1, remaining -= 1) units[order[cursor % order.length].index] += 1;
  for (let cursor = order.length - 1; remaining < 0; cursor -= 1, remaining += 1) {
    const target = order[(cursor + order.length) % order.length].index;
    if (units[target] > 0) units[target] -= 1;
  }
  return units.map(fromGridUnits);
}

export function resolveDrawerManufacturingWidth({ openingWidthCm, theoreticalBoxWidthCm, panelThicknessCm, desiredClearanceCm, clearanceToleranceCm = MANUFACTURING_GRID_CM / 2 }) {
  const theoreticalBackWidthCm = theoreticalBoxWidthCm - panelThicknessCm * 2;
  const backWidthCm = snapCutDimensionWithConstraints(theoreticalBackWidthCm, {
    maxCm: openingWidthCm - panelThicknessCm * 2,
    validate: (candidate) => {
      const effective = openingWidthCm - (candidate + panelThicknessCm * 2);
      return effective >= Math.max(0, desiredClearanceCm - clearanceToleranceCm) && effective <= desiredClearanceCm + clearanceToleranceCm;
    },
  });
  if (backWidthCm == null) return { valid: false, error: "No existe un ancho de cajón en pasos de 5 mm compatible con las holguras de las correderas." };
  const boxWidthCm = backWidthCm + panelThicknessCm * 2;
  const effectiveClearanceCm = openingWidthCm - boxWidthCm;
  return { valid: true, backWidthCm, boxWidthCm, effectiveClearanceCm, clearanceDeltaCm: effectiveClearanceCm - desiredClearanceCm };
}

export function findManufacturingPiece(pieces, name, occurrence = 0) {
  return (pieces || []).filter((piece) => piece.name === name)[occurrence] || null;
}
