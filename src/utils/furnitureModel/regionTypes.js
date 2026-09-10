export const REGION_PLANES = Object.freeze(["front", "rear"]);
export const REGION_AXES = Object.freeze(["xy"]);
export const REGION_TYPES = Object.freeze(["opening", "front"]);
export const REGION_ROLES = Object.freeze(["front-opening", "door-front", "drawer-front-region", "global-front", "rear-region"]);

export const FRONT_REGION_EPSILON_CM = 1e-6;

export const isRegionPlane = (value) => REGION_PLANES.includes(value);
export const isRegionAxis = (value) => REGION_AXES.includes(value);
export const isRegionType = (value) => REGION_TYPES.includes(value);
export const isRegionRole = (value) => REGION_ROLES.includes(value);
