import { DESK_DRAWER_LIMITS, NIGHTSTAND_DRAWER_LIMITS } from "./drawerLimits.js";
import { normalizeWardrobeSectionWidthRatios, WARDROBE_LIMITS } from "./wardrobeStructure.js";

export const PROPOSAL_TYPES = ["unknown", "nightstand", "desk", "tvStand", "catHouse", "wardrobe"];

const DRAWER_LIMITS = { nightstand: NIGHTSTAND_DRAWER_LIMITS, desk: DESK_DRAWER_LIMITS };

export function validateFurnitureProposal(proposal) {
  const errors = [];
  if (!PROPOSAL_TYPES.includes(proposal.detectedType) || proposal.detectedType === "unknown") {
    errors.push("No fue posible reconocer un tipo de mueble compatible.");
  }
  if (![proposal.dimensions.widthCm, proposal.dimensions.heightCm, proposal.dimensions.depthCm].every((value) => Number(value) > 0)) {
    errors.push("Introduce ancho, alto y fondo.");
  }
  const limits = DRAWER_LIMITS[proposal.detectedType];
  const drawers = Number(proposal.structure.drawers);
  if (limits && (!Number.isInteger(drawers) || drawers < limits.min || drawers > limits.max)) {
    errors.push(`La cantidad de cajones debe estar entre ${limits.min} y ${limits.max}.`);
  }
  if (proposal.detectedType === "wardrobe") {
    const shelves = Number(proposal.structure.shelves);
    if (Number(proposal.structure.sections) !== 3) errors.push("El ropero actual utiliza exactamente 3 cuerpos.");
    if (Number(proposal.structure.doors) !== 3) errors.push("El ropero actual utiliza exactamente 3 puertas.");
    if (drawers !== 6) errors.push("El ropero actual utiliza 6 cajones fijos.");
    if (!Number.isInteger(shelves) || shelves < WARDROBE_LIMITS.shoeShelves.min || shelves > WARDROBE_LIMITS.shoeShelves.max) {
      errors.push(`Las repisas deben estar entre ${WARDROBE_LIMITS.shoeShelves.min} y ${WARDROBE_LIMITS.shoeShelves.max}.`);
    }
  }
  const unsupported = {
    nightstand: [["doors", "La Mesa de Noche actual no utiliza puertas."], ["shelves", "La Mesa de Noche actual no utiliza repisas."], ["sections", "La Mesa de Noche actual no utiliza cuerpos marcados."]],
    desk: [["doors", "El Escritorio actual no utiliza puertas."], ["shelves", "El Escritorio actual no utiliza repisas."], ["sections", "El Escritorio actual no utiliza cuerpos marcados."]],
    tvStand: [["drawers", "El Mueble TV actual no utiliza cajones."], ["doors", "El Mueble TV actual no utiliza puertas."], ["shelves", "El Mueble TV actual no utiliza repisas marcadas."], ["sections", "El Mueble TV actual no utiliza cuerpos marcados."]],
    catHouse: [["drawers", "La Casa para Gatos actual no utiliza cajones."], ["doors", "La Casa para Gatos actual no utiliza puertas."], ["shelves", "La Casa para Gatos actual no utiliza repisas."], ["sections", "La Casa para Gatos actual no utiliza cuerpos marcados."]],
  };
  for (const [key, message] of unsupported[proposal.detectedType] || []) {
    if (Number(proposal.structure[key]) > 0) errors.push(message);
  }
  return errors;
}

export function proposalToNormalizedConfig(proposal) {
  const errors = validateFurnitureProposal(proposal);
  if (errors.length) throw new Error(errors[0]);
  const quantities = {};
  if (["nightstand", "desk", "wardrobe"].includes(proposal.detectedType)) quantities.drawers = Number(proposal.structure.drawers);
  if (proposal.detectedType === "wardrobe") {
    quantities.doors = Number(proposal.structure.doors);
    quantities.shelves = Number(proposal.structure.shelves);
  }
  const furniture = {};
  if (proposal.detectedType === "wardrobe" && proposal.structure.layoutQuality !== "invalid" && proposal.structure.sectionLayout?.length === 3) {
    const normalizedRatios = normalizeWardrobeSectionWidthRatios(proposal.structure.sectionLayout.map(({ widthRatio }) => widthRatio));
    if (normalizedRatios.valid) furniture.wardrobeConfig = { sectionWidthRatios: normalizedRatios.ratios };
  }
  return {
    furnitureType: proposal.detectedType,
    dimensions: {
      widthCm: Number(proposal.dimensions.widthCm),
      heightCm: Number(proposal.dimensions.heightCm),
      depthCm: Number(proposal.dimensions.depthCm),
    },
    quantities,
    furniture,
    useConstructiveDefaults: true,
    source: "image",
  };
}

export function updateProposal(proposal, section, key, value) {
  return { ...proposal, [section]: { ...proposal[section], [key]: value } };
}
