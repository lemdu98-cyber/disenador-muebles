export function getHardwareItems({ furnitureType, drawers = 0, drawerSlideConfig }) {
  if (!drawers || !["desk", "nightstand", "wardrobe"].includes(furnitureType)) return [];
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
