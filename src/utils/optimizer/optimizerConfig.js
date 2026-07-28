export const OPTIMIZATION_MODES = {
  fast: { label: "Rápido", attempts: 20 },
  standard: { label: "Estándar", attempts: 100 },
  maximum: { label: "Máxima optimización", attempts: 500 },
};

export const DEFAULT_OPTIMIZER_SETTINGS = {
  mode: "standard",
  kerfMm: 3,
  marginsCm: { top: 1, bottom: 1, left: 1, right: 1 },
  allowRotation: true,
  respectGrain: true,
  useScrapBank: true,
};
