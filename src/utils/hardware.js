export function getHardwareItems({ furnitureType, drawers = 0, drawerSlideConfig, heightCm = 0, wardrobeConfig }) {
  if (furnitureType === "wardrobe") {
    const lengthCm = Number(drawerSlideConfig?.lengthMm || 350) / 10;
    const upperHeightCm = Number(wardrobeConfig?.upperCompartmentHeightCm || 38);
    const upperHingesPerDoor = upperHeightCm > 60 ? 3 : 2;
    const sideMainHeightCm = Math.max(0, heightCm - upperHeightCm - Number(wardrobeConfig?.drawerRegionHeightCm || 58) - Number(wardrobeConfig?.lowerCrossbarHeightCm || 8));
    const centerMainHeightCm = Math.max(0, heightCm - upperHeightCm);
    const hingesForHeight = (doorHeightCm) => doorHeightCm >= 180 ? 5 : doorHeightCm >= 130 ? 4 : 3;
    const shared = [
      { id: "telescopic-slides", name: `Correderas telescópicas ${lengthCm} cm`, pairs: drawers, units: drawers * 2 },
      { id: "hanging-rod", name: "Barras para colgar", pairs: 0, units: 2 },
      { id: "rod-supports", name: "Soportes de barra", pairs: 2, units: 4 },
    ];
    return wardrobeConfig?.doorType === "sliding" ? [...shared,
      { id: "sliding-upper-track", name: "Riel superior para puertas corredizas", pairs: 0, units: 1 },
      { id: "sliding-lower-track", name: "Riel inferior para puertas corredizas", pairs: 0, units: 1 },
      { id: "sliding-guides", name: "Juegos de ruedas y guías", pairs: 3, units: 6 },
      { id: "handles", name: "Tiradores", pairs: 0, units: 3 + drawers },
    ] : [...shared,
      { id: "upper-door-hinges", name: "Bisagras puertas superiores", pairs: 0, units: upperHingesPerDoor * 3 },
      { id: "main-door-hinges", name: "Bisagras puertas principales", pairs: 0, units: hingesForHeight(sideMainHeightCm) * 2 + hingesForHeight(centerMainHeightCm) },
      { id: "handles", name: "Tiradores", pairs: 0, units: 6 + drawers },
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
