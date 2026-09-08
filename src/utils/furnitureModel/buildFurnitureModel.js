import { adaptCatHouseToFurnitureModel, adaptDeskToFurnitureModel, adaptNightstandToFurnitureModel, adaptTvStandToFurnitureModel, adaptWardrobeToFurnitureModel } from "./adapters.js";

/** Build on demand (or memoize in a caller); never use this from a render frame. */
export function buildFurnitureModel(input) {
  const adapters = { nightstand: adaptNightstandToFurnitureModel, desk: adaptDeskToFurnitureModel, tvStand: adaptTvStandToFurnitureModel, catHouse: adaptCatHouseToFurnitureModel, wardrobe: adaptWardrobeToFurnitureModel };
  const adapter = adapters[input?.furnitureType];
  if (!adapter) throw new Error(`Unsupported furniture type: ${input?.furnitureType}`);
  return adapter(input);
}
