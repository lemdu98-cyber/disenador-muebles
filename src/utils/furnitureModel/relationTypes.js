/** Canonical relation vocabulary for the derived, read-only FurnitureModel graph. */
export const RELATION_TYPES = Object.freeze([
  "supported-by",
  "contained-in",
  "adjacent-to",
  "connects",
  "separates",
  "covers",
  "closes",
]);

export const RELATION_CONTACT_EPSILON_CM = 0.05;

export const isRelationType = (type) => RELATION_TYPES.includes(type);
