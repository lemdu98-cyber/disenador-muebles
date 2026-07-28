import { optimizeCuts } from "./cuttingOptimizer";

export function optimizeMaterial(pieces, materialConfig, options = {}) {
  const materialPieces = pieces.filter((piece) => piece.material?.id === materialConfig.id);
  return {
    pieces: materialPieces,
    ...optimizeCuts(materialPieces, { ...options, boardConfig: materialConfig }),
  };
}

export function optimizeAllMaterials(pieces, materialConfigs, optionsByMaterial = {}) {
  return Object.fromEntries(
    Object.values(materialConfigs).map((config) => [
      config.id,
      optimizeMaterial(pieces, config, optionsByMaterial[config.id]),
    ]),
  );
}
