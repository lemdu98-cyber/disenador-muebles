export const DESIGN_SCHEMA_VERSION = 1;
import { sanitizeEdgeBandingConfig } from "./edgeBanding.js";
import { DEFAULT_DESK_CONFIG, getDeskSectionGeometry } from "./deskStructure.js";
import { DEFAULT_WARDROBE_CONFIG, normalizeWardrobeSectionWidthRatios } from "./wardrobeStructure.js";
import { DEFAULT_TV_STAND_CONFIG, normalizeTvStandSectionWidthRatios } from "./tvStandStructure.js";

const VISUAL_ONLY_KEYS = new Set([
  "showOpenDrawers",
  "showOpenDoors",
  "showDoors",
  "showStructure",
]);

function omitVisualState(value) {
  if (Array.isArray(value)) return value.map(omitVisualState);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !VISUAL_ONLY_KEYS.has(key))
      .map(([key, item]) => [key, omitVisualState(item)]),
  );
}

const TYPE_FIELDS = {
  nightstand: { quantities: ["drawers"], furniture: ["drawerSlideConfig", "drawerFrontConfig", "nightstandStructureConfig"] },
  desk: { quantities: ["drawers"], furniture: ["drawerSlideConfig", "deskConfig"] },
  tvStand: { quantities: [], furniture: ["tvStandConfig"] },
  catHouse: { quantities: [], furniture: ["catHouseConfig"] },
  wardrobe: { quantities: ["drawers", "shelves"], furniture: ["drawerSlideConfig", "drawerFrontConfig", "wardrobeConfig"] },
};

function pick(source, keys) {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

export function serializeDesignConfig(state) {
  const fields = TYPE_FIELDS[state.furnitureType];
  if (!fields) throw new Error(`Tipo de mueble no compatible: ${state.furnitureType}.`);
  const furniture = pick(state, fields.furniture);
  if (state.furnitureType === "wardrobe") {
    const normalized = normalizeWardrobeSectionWidthRatios(furniture.wardrobeConfig?.sectionWidthRatios ?? DEFAULT_WARDROBE_CONFIG.sectionWidthRatios);
    furniture.wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, ...furniture.wardrobeConfig, sectionWidthRatios: normalized.ratios };
  }
  if (state.furnitureType === "desk") {
    const geometry = getDeskSectionGeometry({ widthCm: state.widthCm, thicknessCm: (state.materialConfigs?.melamine?.thicknessMm ?? 15) / 10, deskConfig: furniture.deskConfig });
    furniture.deskConfig = { ...DEFAULT_DESK_CONFIG, ...furniture.deskConfig, drawerModuleSide: geometry.drawerModuleSide, drawerModuleWidthRatio: geometry.drawerModuleWidthRatio };
    delete furniture.deskConfig.drawerPosition; delete furniture.deskConfig.drawerModuleWidthCm;
  }
  if (state.furnitureType === "tvStand") {
    const normalized = normalizeTvStandSectionWidthRatios(furniture.tvStandConfig?.sectionWidthRatios ?? DEFAULT_TV_STAND_CONFIG.sectionWidthRatios);
    furniture.tvStandConfig = { ...DEFAULT_TV_STAND_CONFIG, ...furniture.tvStandConfig, sectionWidthRatios: normalized.ratios };
  }
  return omitVisualState({
    dimensions: {
      widthCm: state.widthCm,
      heightCm: state.heightCm,
      depthCm: state.depthCm,
    },
    quantities: pick(state, fields.quantities),
    furniture,
    materials: {
      melamineThicknessMm: state.materialConfigs?.melamine?.thicknessMm,
      hardboardThicknessMm: state.materialConfigs?.hardboard?.thicknessMm,
    },
    edgeBanding: sanitizeEdgeBandingConfig(state.edgeBanding),
  });
}

export function deserializeDesignConfig(furnitureType, config) {
  const fields = TYPE_FIELDS[furnitureType];
  if (!fields) throw new Error(`Tipo de mueble no compatible: ${furnitureType}.`);
  const oldMaterials = config.materials || {};
  const furniture = pick(config.furniture || {}, fields.furniture);
  if (furnitureType === "wardrobe") {
    const normalized = normalizeWardrobeSectionWidthRatios(furniture.wardrobeConfig?.sectionWidthRatios ?? DEFAULT_WARDROBE_CONFIG.sectionWidthRatios);
    furniture.wardrobeConfig = { ...DEFAULT_WARDROBE_CONFIG, ...furniture.wardrobeConfig, sectionWidthRatios: normalized.ratios };
  }
  if (furnitureType === "desk") {
    const thicknessMm = oldMaterials.melamineThicknessMm ?? oldMaterials.melamine?.thicknessMm ?? 15;
    const geometry = getDeskSectionGeometry({ widthCm: config.dimensions.widthCm, thicknessCm: thicknessMm / 10, deskConfig: furniture.deskConfig });
    furniture.deskConfig = { ...DEFAULT_DESK_CONFIG, ...furniture.deskConfig, drawerModuleSide: geometry.drawerModuleSide, drawerModuleWidthRatio: geometry.drawerModuleWidthRatio };
    delete furniture.deskConfig.drawerPosition; delete furniture.deskConfig.drawerModuleWidthCm;
  }
  if (furnitureType === "tvStand") {
    const normalized = normalizeTvStandSectionWidthRatios(furniture.tvStandConfig?.sectionWidthRatios ?? DEFAULT_TV_STAND_CONFIG.sectionWidthRatios);
    furniture.tvStandConfig = { ...DEFAULT_TV_STAND_CONFIG, ...furniture.tvStandConfig, sectionWidthRatios: normalized.ratios };
  }
  return {
    dimensions: config.dimensions,
    quantities: pick(config.quantities || {}, fields.quantities),
    furniture,
    materialThicknesses: {
      melamine: oldMaterials.melamineThicknessMm ?? oldMaterials.melamine?.thicknessMm,
      hardboard: oldMaterials.hardboardThicknessMm ?? oldMaterials.hardboard?.thicknessMm,
    },
    edgeBanding: sanitizeEdgeBandingConfig(config.edgeBanding),
  };
}

export function assertSupportedDesign(design) {
  if (design.schema_version !== DESIGN_SCHEMA_VERSION) {
    throw new Error(`Versión de diseño no compatible: ${design.schema_version}.`);
  }
  if (!design.config?.dimensions || !design.config?.furniture) {
    throw new Error("El diseño guardado no contiene una configuración válida.");
  }
  return design;
}
