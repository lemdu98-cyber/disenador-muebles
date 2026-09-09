export const DIAGNOSTIC_SEVERITIES = Object.freeze(["error", "warning", "info"]);

export const DIAGNOSTIC_CODES = Object.freeze([
  "MISSING_EXPECTED_SUPPORT",
  "MISSING_EXPECTED_CONNECTION",
  "OUTSIDE_EXPECTED_CONTAINER",
  "INVALID_SEPARATION_POSITION",
  "INSUFFICIENT_COVERAGE",
]);

export const DIAGNOSTIC_SEVERITY_ORDER = Object.freeze({ error: 0, warning: 1, info: 2 });
export const isDiagnosticSeverity = (severity) => DIAGNOSTIC_SEVERITIES.includes(severity);
export const isDiagnosticCode = (code) => DIAGNOSTIC_CODES.includes(code);
