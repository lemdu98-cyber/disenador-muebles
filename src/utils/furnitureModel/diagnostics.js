import { DIAGNOSTIC_SEVERITY_ORDER } from "./diagnosticTypes.js";
import { RELATION_CONTACT_EPSILON_CM } from "./relationTypes.js";
import { componentsTouchOnAxis } from "./relations.js";

const AXIS_BOUNDS = Object.freeze({ x: ["minX", "maxX"], y: ["minY", "maxY"], z: ["minZ", "maxZ"] });

export function createFurnitureDiagnostic({ code, severity, componentId, relatedComponentIds = [], message, metadata = {} }) {
  const related = [...new Set(relatedComponentIds)].sort();
  return {
    id: `${componentId}|${code}|${related.join(",") || "none"}`,
    code,
    severity,
    componentId,
    relatedComponentIds: related,
    message,
    metadata: { ...metadata },
  };
}

const boundsCenter = (component, axis) => {
  const [min, max] = AXIS_BOUNDS[axis] ?? [];
  if (component?.bounds && min) return (component.bounds[min] + component.bounds[max]) / 2;
  return component?.position?.[`${axis}Cm`] ?? null;
};

const axisGap = (source, target, axis) => {
  const [min, max] = AXIS_BOUNDS[axis] ?? [];
  if (!source?.bounds || !target?.bounds || !min) return null;
  return Math.min(Math.abs(source.bounds[min] - target.bounds[max]), Math.abs(source.bounds[max] - target.bounds[min]));
};

const boundsContained = (source, target, epsilon = RELATION_CONTACT_EPSILON_CM) => source?.bounds && target?.bounds && Object.values(AXIS_BOUNDS).every(([min, max]) => source.bounds[min] >= target.bounds[min] - epsilon && source.bounds[max] <= target.bounds[max] + epsilon);
const projectedCoverage = (source, target, axes, epsilon = RELATION_CONTACT_EPSILON_CM) => source?.bounds && target?.bounds && axes.every((axis) => { const [min, max] = AXIS_BOUNDS[axis]; return source.bounds[min] <= target.bounds[min] + epsilon && source.bounds[max] >= target.bounds[max] - epsilon; });

const provenance = (relation, rule, extra = {}) => ({ source: "relation", relationId: relation.id, relationType: relation.type, rule, ...extra });

function diagnoseContact(relation, source, target, code, label) {
  const axis = relation.metadata?.axis;
  if (!axis || !source?.bounds || !target?.bounds || componentsTouchOnAxis(source, target, axis)) return null;
  const gapCm = axisGap(source, target, axis);
  return createFurnitureDiagnostic({
    code,
    severity: "error",
    componentId: source.id,
    relatedComponentIds: [target.id],
    message: `${source.id} does not contact its expected ${label} ${target.id} on axis ${axis}.`,
    metadata: provenance(relation, `${relation.type}-contact`, { axis, gapCm }),
  });
}

function diagnoseContainment(relation, source, target) {
  if (!source?.bounds || !target?.bounds || source.metadata?.allowParentOverflow || boundsContained(source, target)) return null;
  return createFurnitureDiagnostic({
    code: "OUTSIDE_EXPECTED_CONTAINER",
    severity: "error",
    componentId: source.id,
    relatedComponentIds: [target.id],
    message: `${source.id} extends outside its expected container ${target.id}.`,
    metadata: provenance(relation, "contained-in-bounds"),
  });
}

function diagnoseSeparation(relation, source, target) {
  const axis = relation.metadata?.axis;
  const side = relation.metadata?.side;
  const sourceCenter = boundsCenter(source, axis);
  const targetCenter = boundsCenter(target, axis);
  if (!axis || !["left", "right"].includes(side) || !Number.isFinite(sourceCenter) || !Number.isFinite(targetCenter)) return null;
  const correctlyPlaced = side === "left" ? targetCenter < sourceCenter : targetCenter > sourceCenter;
  if (correctlyPlaced) return null;
  return createFurnitureDiagnostic({
    code: "INVALID_SEPARATION_POSITION",
    severity: "error",
    componentId: source.id,
    relatedComponentIds: [target.id],
    message: `${source.id} is not between the regions it should separate; ${target.id} is expected on its ${side}.`,
    metadata: provenance(relation, "separates-relative-position", { axis, side }),
  });
}

function diagnoseCoverage(relation, source, target) {
  if (!source?.bounds || !target?.bounds) return null;
  // Sliding leaf bounds currently use cut-list face orientation, so only their
  // semantic global-front relation is reliable. Do not pretend it is a 1:1 cover.
  if (relation.type === "covers" && relation.metadata?.region === "front" && target.role === "root") return null;
  const axes = ["x", "y"];
  if (projectedCoverage(source, target, axes)) return null;
  return createFurnitureDiagnostic({
    code: "INSUFFICIENT_COVERAGE",
    severity: "warning",
    componentId: source.id,
    relatedComponentIds: [target.id],
    message: `${source.id} does not cover the expected projected region of ${target.id}.`,
    metadata: provenance(relation, `${relation.type}-projected-coverage`, { axes }),
  });
}

export function buildGeneralDiagnostics(model) {
  const byId = new Map((model?.components ?? []).map((component) => [component.id, component]));
  const diagnostics = [];
  for (const relation of model?.relations ?? []) {
    const source = byId.get(relation.sourceId); const target = byId.get(relation.targetId);
    if (!source || !target) continue;
    let diagnostic = null;
    if (relation.type === "supported-by") diagnostic = diagnoseContact(relation, source, target, "MISSING_EXPECTED_SUPPORT", "support");
    if (relation.type === "connects") diagnostic = diagnoseContact(relation, source, target, "MISSING_EXPECTED_CONNECTION", "connection");
    if (relation.type === "contained-in") diagnostic = diagnoseContainment(relation, source, target);
    if (relation.type === "separates") diagnostic = diagnoseSeparation(relation, source, target);
    if (["covers", "closes"].includes(relation.type)) diagnostic = diagnoseCoverage(relation, source, target);
    if (diagnostic) diagnostics.push(diagnostic);
  }
  return diagnostics;
}

export function buildFurnitureDiagnostics(model) {
  return buildGeneralDiagnostics(model).sort((left, right) => DIAGNOSTIC_SEVERITY_ORDER[left.severity] - DIAGNOSTIC_SEVERITY_ORDER[right.severity] || left.componentId.localeCompare(right.componentId) || left.code.localeCompare(right.code) || left.id.localeCompare(right.id));
}

export const getDiagnosticsForComponent = (model, componentId) => (model?.diagnostics ?? []).filter(({ componentId: directId }) => directId === componentId);
export const getDiagnosticsBySeverity = (model, severity) => (model?.diagnostics ?? []).filter((diagnostic) => diagnostic.severity === severity);
export const summarizeFurnitureDiagnostics = (model) => ({
  errors: getDiagnosticsBySeverity(model, "error").length,
  warnings: getDiagnosticsBySeverity(model, "warning").length,
  info: getDiagnosticsBySeverity(model, "info").length,
});
