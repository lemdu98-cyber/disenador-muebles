import { normalizeAnnotation } from "./furnitureImageAnnotationContract.js";

/** Tolerances are fractions of the photographed furniture bounding area. */
export const ANNOTATION_GEOMETRY_TOLERANCES = {
  sectionCoverageMin: 0.85,
  sectionCoverageInvalid: 0.5,
  sectionGapTolerance: 0.03,
  sectionOverlapTolerance: 0.03,
  sectionOverlapInvalid: 0.15,
  alignmentTolerance: 0.08,
  boundaryTolerance: 0.01,
  significantElementOverlap: 0.15,
};

const stable = (value) => Math.round(value * 1_000_000) / 1_000_000;
const approximate = (value) => Math.round(value * 10) / 10;
const centerX = (annotation) => annotation.x + annotation.width / 2;
const horizontalEnd = (annotation) => annotation.x + annotation.width;

function unionCoverage(sections) {
  if (!sections.length) return 0;
  const ordered = [...sections].sort((a, b) => a.x - b.x || horizontalEnd(a) - horizontalEnd(b));
  let coverage = 0;
  let start = ordered[0].x;
  let end = horizontalEnd(ordered[0]);
  for (const section of ordered.slice(1)) {
    if (section.x <= end) end = Math.max(end, horizontalEnd(section));
    else { coverage += end - start; start = section.x; end = horizontalEnd(section); }
  }
  return stable(coverage + end - start);
}

export function deriveSectionRatios({ annotations, dimensions, tolerances = ANNOTATION_GEOMETRY_TOLERANCES }) {
  const sections = annotations.filter((annotation) => annotation.type === "section").sort((a, b) => centerX(a) - centerX(b) || a.y - b.y || a.id.localeCompare(b.id));
  if (!sections.length) return { sectionLayout: [], warnings: [], quality: "valid", canNormalize: false, coverageRatio: 0 };

  const gaps = [];
  const overlaps = [];
  for (let index = 1; index < sections.length; index += 1) {
    const separation = sections[index].x - horizontalEnd(sections[index - 1]);
    if (separation > 0) gaps.push(separation);
    if (separation < 0) overlaps.push(-separation);
  }
  const coverageRatio = unionCoverage(sections);
  const maxGap = Math.max(0, ...gaps);
  const maxOverlap = Math.max(0, ...overlaps);
  const topSpread = Math.max(...sections.map(({ y }) => y)) - Math.min(...sections.map(({ y }) => y));
  const bottomSpread = Math.max(...sections.map((section) => section.y + section.height)) - Math.min(...sections.map((section) => section.y + section.height));
  const aligned = topSpread <= tolerances.alignmentTolerance && bottomSpread <= tolerances.alignmentTolerance;
  const warnings = [];
  if (coverageRatio < tolerances.sectionCoverageMin) warnings.push("Las secciones no cubren suficientemente el ancho visible.");
  if (maxOverlap > tolerances.sectionOverlapTolerance) warnings.push("Las secciones se superponen de forma considerable.");
  if (maxGap > tolerances.sectionGapTolerance) warnings.push("Existe un hueco grande entre las secciones.");
  if (!aligned) warnings.push("Las secciones no están suficientemente alineadas entre sí.");
  const invalid = coverageRatio < tolerances.sectionCoverageInvalid || maxOverlap > tolerances.sectionOverlapInvalid;
  const canNormalize = !invalid && aligned && coverageRatio >= tolerances.sectionCoverageMin && maxGap <= tolerances.sectionGapTolerance && maxOverlap <= tolerances.sectionOverlapTolerance;
  const widthSum = sections.reduce((sum, section) => sum + section.width, 0);
  const normalizedWidths = canNormalize ? sections.map((section) => stable(section.width / widthSum)) : [];
  if (canNormalize) normalizedWidths[normalizedWidths.length - 1] = stable(1 - normalizedWidths.slice(0, -1).reduce((sum, value) => sum + value, 0));
  let normalizedOffset = 0;
  const sectionLayout = sections.map((section, index) => {
    const normalizedWidthRatio = canNormalize ? normalizedWidths[index] : null;
    const widthRatio = normalizedWidthRatio ?? section.width;
    const normalizedXRatio = canNormalize ? normalizedOffset : null;
    normalizedOffset += normalizedWidthRatio ?? 0;
    return {
      index,
      annotationId: section.id,
      xRatio: stable(section.x),
      widthRatio: stable(widthRatio),
      visualWidthRatio: stable(section.width),
      normalizedXRatio: normalizedXRatio === null ? null : stable(normalizedXRatio),
      normalized: canNormalize,
      approxWidthCm: approximate(widthRatio * Number(dimensions?.widthCm || 0)),
      yRatio: stable(section.y),
      heightRatio: stable(section.height),
    };
  });
  return { sectionLayout, warnings, quality: invalid ? "invalid" : warnings.length ? "warning" : "valid", canNormalize, coverageRatio, maxGap: stable(maxGap), maxOverlap: stable(maxOverlap) };
}

export function deriveVerticalRatios({ annotations, dimensions }) {
  return annotations.filter(({ type }) => type !== "section").map((annotation) => ({
    annotationId: annotation.id,
    type: annotation.type,
    xRatio: stable(annotation.x),
    yRatio: stable(annotation.y),
    widthRatio: stable(annotation.width),
    heightRatio: stable(annotation.height),
    approxWidthCm: approximate(annotation.width * Number(dimensions?.widthCm || 0)),
    approxHeightCm: approximate(annotation.height * Number(dimensions?.heightCm || 0)),
  })).sort((a, b) => a.yRatio - b.yRatio || a.xRatio - b.xRatio || a.annotationId.localeCompare(b.annotationId));
}

function assignElementsToSections({ elements, sections, tolerances }) {
  return elements.map((element) => {
    const source = element.annotation;
    const elementCenter = centerX(source);
    const significantSections = sections.filter((section) => {
      const overlap = Math.max(0, Math.min(horizontalEnd(source), horizontalEnd(section)) - Math.max(source.x, section.x));
      return overlap / source.width >= tolerances.significantElementOverlap;
    });
    const boundaryHit = sections.some((section, index) => index < sections.length - 1 && Math.abs(elementCenter - horizontalEnd(section)) <= tolerances.boundaryTolerance);
    const centered = sections.filter((section) => elementCenter > section.x + tolerances.boundaryTolerance && elementCenter < horizontalEnd(section) - tolerances.boundaryTolerance);
    if (boundaryHit || significantSections.length > 1 || centered.length > 1) return { ...element.layout, assignment: "ambiguous", sectionIndex: null };
    if (centered.length === 1) return { ...element.layout, assignment: "assigned", sectionIndex: sections.indexOf(centered[0]) };
    return { ...element.layout, assignment: "unassigned", sectionIndex: null };
  }).sort((a, b) => (a.sectionIndex ?? Number.MAX_SAFE_INTEGER) - (b.sectionIndex ?? Number.MAX_SAFE_INTEGER) || a.yRatio - b.yRatio || a.xRatio - b.xRatio || a.annotationId.localeCompare(b.annotationId));
}

export function deriveDeskDrawerModule({ annotations = [], sectionAnalysis }) {
  const drawers = annotations.filter(({ type }) => type === "drawer");
  if (!drawers.length) return null;
  const left = Math.min(...drawers.map(({ x }) => x));
  const right = Math.max(...drawers.map(horizontalEnd));
  const centers = drawers.map(centerX);
  const meanCenter = centers.reduce((sum, value) => sum + value, 0) / centers.length;
  const centerSpread = Math.max(...centers) - Math.min(...centers);
  const averageWidth = drawers.reduce((sum, item) => sum + item.width, 0) / drawers.length;
  if (centerSpread > Math.max(.08, averageWidth * .4) || (Math.min(...centers) < .42 && Math.max(...centers) > .58)) {
    return { valid: false, warning: "Los cajones no forman una única columna horizontal coherente." };
  }
  const sections = sectionAnalysis?.sectionLayout || [];
  if (sections.length === 2 && sectionAnalysis.canNormalize) {
    const target = sections.find((section) => meanCenter >= section.xRatio && meanCenter <= section.xRatio + section.visualWidthRatio);
    if (!target || left < target.xRatio - .02 || right > target.xRatio + target.visualWidthRatio + .02) return { valid: false, warning: "Los cajones no coinciden claramente con una de las dos secciones." };
    return { valid: true, side: target.index === 0 ? "left" : "right", xRatio: target.normalizedXRatio, widthRatio: target.widthRatio, source: "sections" };
  }
  const widthRatio = right - left;
  if (widthRatio <= 0 || left < 0 || right > 1 || (meanCenter > .42 && meanCenter < .58)) return { valid: false, warning: "La posición de la columna de cajones es ambigua." };
  return { valid: true, side: meanCenter < .5 ? "left" : "right", xRatio: stable(left), widthRatio: stable(widthRatio), source: "drawers" };
}

export function deriveFurnitureLayoutFromAnnotations({ annotations = [], dimensions = {}, tolerances = ANNOTATION_GEOMETRY_TOLERANCES }) {
  const validAnnotations = annotations.map((annotation) => normalizeAnnotation(annotation)).filter(Boolean);
  const sectionAnalysis = deriveSectionRatios({ annotations: validAnnotations, dimensions, tolerances });
  const drawerModule = deriveDeskDrawerModule({ annotations: validAnnotations, sectionAnalysis });
  const verticalLayout = deriveVerticalRatios({ annotations: validAnnotations, dimensions });
  const sections = sectionAnalysis.sectionLayout.map(({ annotationId }) => validAnnotations.find(({ id }) => id === annotationId));
  const elements = verticalLayout.map((layout) => ({ layout, annotation: validAnnotations.find(({ id }) => id === layout.annotationId) }));
  const elementAssignments = sections.length
    ? assignElementsToSections({ elements, sections, tolerances })
    : verticalLayout.map((element) => ({ ...element, assignment: "unassigned", sectionIndex: null }));
  const ambiguousCount = elementAssignments.filter(({ assignment }) => assignment === "ambiguous").length;
  const unassignedCount = sections.length ? elementAssignments.filter(({ assignment }) => assignment === "unassigned").length : 0;
  const warnings = [...sectionAnalysis.warnings];
  if (ambiguousCount) warnings.push(`${ambiguousCount === 1 ? "Un elemento cruza" : `${ambiguousCount} elementos cruzan`} límites de secciones y quedó como ambiguo.`);
  if (unassignedCount) warnings.push(`${unassignedCount === 1 ? "Un elemento quedó" : `${unassignedCount} elementos quedaron`} fuera de las secciones marcadas.`);
  if (drawerModule && !drawerModule.valid) warnings.push(drawerModule.warning);
  const quality = sectionAnalysis.quality === "invalid" ? "invalid" : warnings.length ? "warning" : "valid";
  return { sectionLayout: sectionAnalysis.sectionLayout, elementAssignments, drawerModule, warnings, quality: drawerModule && !drawerModule.valid ? "invalid" : quality, geometry: { canNormalizeSections: sectionAnalysis.canNormalize, coverageRatio: sectionAnalysis.coverageRatio, maxGap: sectionAnalysis.maxGap ?? 0, maxOverlap: sectionAnalysis.maxOverlap ?? 0 } };
}
