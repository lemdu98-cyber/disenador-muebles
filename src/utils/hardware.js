export function getHardwareItems({ furnitureType, drawers = 0, drawerSlideConfig, heightCm = 0 }) {
  if (furnitureType === "wardrobe") {
    const lengthCm = Number(drawerSlideConfig?.lengthMm || 350) / 10;
    const hingesPerDoor = heightCm >= 210 ? 5 : heightCm >= 170 ? 4 : 3;
    return [
      { id: "telescopic-slides", name: `Correderas telescópicas ${lengthCm} cm`, pairs: drawers, units: drawers * 2 },
      { id: "hinges", name: "Bisagras de cazoleta", pairs: 0, units: hingesPerDoor * 2 },
      { id: "hanging-rod", name: "Barra para colgar", pairs: 0, units: 1 },
      { id: "rod-supports", name: "Soportes de barra", pairs: 1, units: 2 },
      { id: "handles", name: "Tiradores", pairs: 0, units: 2 + drawers },
    ];
  }
  if (!drawers || !["desk", "nightstand"].includes(furnitureType)) return [];
  const lengthCm = Number(drawerSlideConfig?.lengthMm || 350) / 10;
  return [{
    id: "telescopic-slides",
    name: `Correderas telescópicas ${lengthCm} cm`,
    pairs: drawers,
    units: drawers * 2,
  }];
}

export function getOrderHardware(orderItems) {
  return orderItems.filter((item) => item.quantity > 0).flatMap((item) => getHardwareItems(item.params).map((hardware) => ({
    ...hardware,
    pairs: hardware.pairs * item.quantity,
    units: hardware.units * item.quantity,
    furnitureType: item.furnitureType,
  })));
}
