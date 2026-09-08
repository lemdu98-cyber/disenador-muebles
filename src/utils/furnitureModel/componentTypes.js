/** Structural vocabulary for the read-only FurnitureModel projection. */
export const COMPONENT_TYPES = Object.freeze([
  "panel", "shelf", "divider", "back", "crossbar", "drawer", "drawer-front", "door", "rail", "opening", "section",
]);

export const FURNITURE_TYPES = Object.freeze(["nightstand", "desk", "tvStand", "catHouse", "wardrobe"]);

export const isComponentType = (type) => COMPONENT_TYPES.includes(type);
