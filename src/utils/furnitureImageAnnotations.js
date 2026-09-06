import { PROPOSAL_TYPES } from "./imageFurnitureProposal.js";
import { deriveFurnitureLayoutFromAnnotations } from "./furnitureAnnotationGeometry.js";
import { MIN_ANNOTATION_SIZE, normalizeAnnotation } from "./furnitureImageAnnotationContract.js";
export { ANNOTATION_LABELS, ANNOTATION_TYPES, MIN_ANNOTATION_SIZE, normalizeAnnotation } from "./furnitureImageAnnotationContract.js";

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function createAnnotation({ id, type, startX, startY, endX, endY }) {
  const left = Math.min(finite(startX), finite(endX));
  const top = Math.min(finite(startY), finite(endY));
  const width = Math.abs(finite(endX) - finite(startX));
  const height = Math.abs(finite(endY) - finite(startY));
  if (width < MIN_ANNOTATION_SIZE || height < MIN_ANNOTATION_SIZE) return null;
  return normalizeAnnotation({ id, type, x: left, y: top, width, height });
}

export function updateAnnotation(annotations, id, changes) {
  return annotations.map((annotation) => {
    if (annotation.id !== id) return annotation;
    return normalizeAnnotation({ ...annotation, ...changes }) || annotation;
  });
}

export function removeAnnotation(annotations, id) {
  return annotations.filter((annotation) => annotation.id !== id);
}

export function countAnnotations(annotations) {
  return annotations.reduce((counts, annotation) => {
    if (annotation.type === "drawer") counts.drawers += 1;
    if (annotation.type === "door") counts.doors += 1;
    if (annotation.type === "shelf") counts.shelves += 1;
    if (annotation.type === "section") counts.sections += 1;
    return counts;
  }, { sections: 0, drawers: 0, doors: 0, shelves: 0 });
}

export function annotationsToFurnitureProposal({ detectedType, dimensions, annotations }) {
  if (!PROPOSAL_TYPES.includes(detectedType) || detectedType === "unknown") throw new Error("Selecciona un tipo de mueble compatible.");
  if (![dimensions?.widthCm, dimensions?.heightCm, dimensions?.depthCm].every((value) => Number(value) > 0)) throw new Error("Introduce ancho, alto y fondo.");
  const validAnnotations = annotations.map((annotation) => normalizeAnnotation(annotation)).filter(Boolean);
  const layout = deriveFurnitureLayoutFromAnnotations({ annotations: validAnnotations, dimensions, furnitureType: detectedType });
  const structure = countAnnotations(validAnnotations);
  if (layout.sectionLayout.length) structure.sectionLayout = layout.sectionLayout;
  if (layout.elementAssignments.length) structure.elementLayout = layout.elementAssignments;
  if (layout.drawerModule) structure.drawerModule = layout.drawerModule;
  if (layout.nightstandDrawerLayout) structure.drawerLayout = layout.nightstandDrawerLayout;
  if (layout.sectionLayout.length || layout.elementAssignments.length) structure.layoutQuality = layout.quality;
  if (layout.sectionLayout.length) structure.layoutCanNormalizeSections = layout.geometry.canNormalizeSections;
  return {
    detectedType,
    confidence: 1,
    dimensions: Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, Number(value)])),
    structure,
    notes: ["Estructura definida manualmente por el usuario."],
    warnings: layout.warnings,
    provider: "manual",
  };
}
