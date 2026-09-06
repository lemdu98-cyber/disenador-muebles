export const ANNOTATION_TYPES = ["drawer", "door", "shelf", "section"];
export const ANNOTATION_LABELS = { drawer: "Cajón", door: "Puerta", shelf: "Repisa", section: "Sección" };
export const MIN_ANNOTATION_SIZE = 0.003;

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const stable = (value) => Math.round(value * 1_000_000) / 1_000_000;

/** FurnitureImageAnnotation coordinates are normalized image fractions (0..1). */
export function normalizeAnnotation(annotation, minimumSize = MIN_ANNOTATION_SIZE) {
  if (![annotation?.x, annotation?.y, annotation?.width, annotation?.height].every((value) => Number.isFinite(Number(value)))) return null;
  const x = clamp(finite(annotation?.x));
  const y = clamp(finite(annotation?.y));
  const width = clamp(finite(annotation?.width), minimumSize, 1 - x);
  const height = clamp(finite(annotation?.height), minimumSize, 1 - y);
  if (!ANNOTATION_TYPES.includes(annotation?.type) || width <= 0 || height <= 0) return null;
  return { id: String(annotation.id), type: annotation.type, x: stable(x), y: stable(y), width: stable(width), height: stable(height) };
}
